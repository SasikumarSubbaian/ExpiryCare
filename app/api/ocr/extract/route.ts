import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleVisionService } from '@/lib/ocr/googleVision'
import { validateFile, generateFileHash, logOCRCall, checkDuplicateFile, checkRateLimit } from '@/lib/ocr/abuseProtection'
import { canUseOCR } from '@/lib/ocr/pricingLogic'
import { predictCategory, getPredictionConfidence } from '@/lib/ocr/categoryPredictor'
import { extractByCategory } from '@/lib/ocr/extractors'
import { sanitizeOCRText } from '@/lib/ocr/sanitizeOCRText'
import { processOCRText, convertToLegacyFormat } from '@/lib/ocr/pipelineProcessor'
import type { Category } from '@/lib/ocr/categorySchemas'
import sharp from 'sharp'

/**
 * OCR Extraction API Route
 * Uses Google Vision OCR with category-aware extraction
 */

// Force Node.js runtime for OCR processing (required for sharp and Google Vision)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * OCR Extraction API Route
 * 
 * PRODUCTION-SAFE: Never throws errors, always returns JSON responses
 * - Uses environment variables for Google Vision credentials (no file system)
 * - Validates FormData file input safely
 * - Returns fallback responses on failure
 * - Allows manual item entry if OCR fails
 */
export async function POST(request: NextRequest) {
  // CRITICAL: Never throw - always return JSON response
  try {
    // 1. Authenticate user via Supabase
    const supabase = await createClient()
    if (!supabase) {
      console.error('[OCR] Supabase client is null')
      // Return 200 with success:false - never return 500 unless request is malformed
      return NextResponse.json(
        {
          success: false,
          text: null,
          reason: 'SERVICE_CONFIG_ERROR',
          error: 'Service configuration error',
          allowManualEntry: true, // Allow user to enter data manually
        },
        { status: 200 }
      )
    }

    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user || null

    if (authError || !user) {
      // Return 200 with success:true and structured data (auth error = empty fields)
      return NextResponse.json(
        {
          success: true, // 🔥 ALWAYS TRUE
          text: '',
          rawText: '',
          category: 'other',
          fields: {},
          confidence: 0.3,
          allowManualEntry: false, // Auth required
          source: 'google_vision',
          extractedData: {
            category: 'other',
            categoryConfidence: 'Low' as const,
            categoryConfidencePercentage: 0,
            expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
          },
        },
        { status: 200 }
      )
    }

    // 2. Rate limiting: 5 requests per minute per user
    try {
      const rateLimitResult = checkRateLimit(`ocr:${user.id}`, 5, 60 * 1000)
      if (!rateLimitResult.allowed) {
        // Return 200 with success:true and structured data (rate limit = empty fields)
        return NextResponse.json(
          {
            success: true, // 🔥 ALWAYS TRUE
            text: '',
            rawText: '',
            category: 'other',
            fields: {},
            confidence: 0.3,
            allowManualEntry: true, // Allow manual entry even if rate limited
            source: 'google_vision',
            retryAfter: rateLimitResult.retryAfter,
            extractedData: {
              category: 'other',
              categoryConfidence: 'Low' as const,
              categoryConfidencePercentage: 0,
              expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
            },
          },
          { status: 200 }
        )
      }
    } catch (rateLimitError: unknown) {
      const errorMessage = rateLimitError instanceof Error ? rateLimitError.message : String(rateLimitError)
      console.error('[OCR] Rate limit check error:', errorMessage)
      // Continue - don't block on rate limit errors
    }

    // 3. Parse FormData - safe file handling
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formDataError: unknown) {
      const errorMessage = formDataError instanceof Error ? formDataError.message : String(formDataError)
      console.error('[OCR] FormData parse error:', errorMessage)
      // Malformed request - return 400 (this is the only case where we return non-200)
      return NextResponse.json(
        {
          success: false,
          text: null,
          reason: 'INVALID_REQUEST',
          error: 'Invalid request format',
          allowManualEntry: true,
        },
        { status: 400 }
      )
    }

    const file = formData.get('file') as File | null
    const userSelectedCategory = formData.get('category') as string | null

    // 4. Validate file exists
    if (!file || !(file instanceof File)) {
      // Return 200 with success:true and structured data (no file = empty fields)
      return NextResponse.json(
        {
          success: true, // 🔥 ALWAYS TRUE
          text: '',
          rawText: '',
          category: 'other',
          fields: {},
          confidence: 0.3,
          allowManualEntry: true, // Allow manual entry
          source: 'google_vision',
          extractedData: {
            category: 'other',
            categoryConfidence: 'Low' as const,
            categoryConfidencePercentage: 0,
            expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
          },
        },
        { status: 200 }
      )
    }

    // 5. Validate file (size, type, etc.)
    let validation: { valid: boolean; error?: string }
    try {
      validation = validateFile(file)
      if (!validation.valid) {
        // Return 200 with success:true and structured data (invalid file = empty fields)
        return NextResponse.json(
          {
            success: true, // 🔥 ALWAYS TRUE
            text: '',
            rawText: '',
            category: 'other',
            fields: {},
            confidence: 0.3,
            allowManualEntry: true,
            source: 'google_vision',
            extractedData: {
              category: 'other',
              categoryConfidence: 'Low' as const,
              categoryConfidencePercentage: 0,
              expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
            },
          },
          { status: 200 }
        )
      }
    } catch (validationError: unknown) {
      const errorMessage = validationError instanceof Error ? validationError.message : String(validationError)
      console.error('[OCR] File validation error:', errorMessage)
      // Return 200 with success:true and structured data
      return NextResponse.json(
        {
          success: true, // 🔥 ALWAYS TRUE
          text: '',
          rawText: '',
          category: 'other',
          fields: {},
          confidence: 0.3,
          allowManualEntry: true,
          source: 'google_vision',
          extractedData: {
            category: 'other',
            categoryConfidence: 'Low' as const,
            categoryConfidencePercentage: 0,
            expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
          },
        },
        { status: 200 }
      )
    }

    // 6. Check OCR limits based on plan
    let ocrCheck: { allowed: boolean; reason?: string; remaining?: number }
    try {
      ocrCheck = await canUseOCR(user.id)
      if (!ocrCheck.allowed) {
        // Return 200 with success:true and structured data (limit reached = empty fields)
        return NextResponse.json(
          {
            success: true, // 🔥 ALWAYS TRUE
            text: '',
            rawText: '',
            category: 'other',
            fields: {},
            confidence: 0.3,
            allowManualEntry: true, // Always allow manual entry
            source: 'google_vision',
            remaining: ocrCheck.remaining,
            extractedData: {
              category: 'other',
              categoryConfidence: 'Low' as const,
              categoryConfidencePercentage: 0,
              expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
            },
          },
          { status: 200 }
        )
      }
    } catch (ocrCheckError: unknown) {
      const errorMessage = ocrCheckError instanceof Error ? ocrCheckError.message : String(ocrCheckError)
      console.error('[OCR] OCR limit check error:', errorMessage)
      // Continue - don't block on limit check errors
    }

    // 7. Generate file hash for duplicate detection
    let fileHash: string
    try {
      fileHash = await generateFileHash(file)
    } catch (hashError: unknown) {
      const errorMessage = hashError instanceof Error ? hashError.message : String(hashError)
      console.error('[OCR] File hash generation error:', errorMessage)
      // Continue without duplicate check
      fileHash = ''
    }

    // 8. Check for duplicate (if hash was generated)
    if (fileHash) {
      try {
        const duplicateCheck = await checkDuplicateFile(user.id, fileHash)
        if (duplicateCheck.isDuplicate && duplicateCheck.existingResult) {
          return NextResponse.json({
            success: true,
            extractedData: duplicateCheck.existingResult,
            isDuplicate: true,
            message: 'Using previously processed result',
          })
        }
      } catch (duplicateError: unknown) {
        const errorMessage = duplicateError instanceof Error ? duplicateError.message : String(duplicateError)
        console.error('[OCR] Duplicate check error:', errorMessage)
        // Continue - don't block on duplicate check errors
      }
    }

    // 9. Convert file to buffer - safe conversion
    let imageBuffer: Buffer
    try {
      const arrayBuffer = await file.arrayBuffer()
      imageBuffer = Buffer.from(new Uint8Array(arrayBuffer))
      
      // Enforce size limit (5MB max for OCR)
      if (imageBuffer.length > 5 * 1024 * 1024) {
        // Return 200 with success:false - file too large is not a 500 error
        return NextResponse.json(
          {
            success: false,
            text: null,
            reason: 'FILE_TOO_LARGE',
            error: 'File too large. Maximum size is 5MB.',
            allowManualEntry: true,
          },
          { status: 200 }
        )
      }
    } catch (bufferError: unknown) {
      const errorMessage = bufferError instanceof Error ? bufferError.message : String(bufferError)
      console.error('[OCR] File buffer conversion error:', errorMessage)
      return NextResponse.json(
        {
          success: false,
          text: null,
          reason: 'BUFFER_CONVERSION_ERROR',
          error: 'Failed to process file',
          allowManualEntry: true,
        },
        { status: 200 }
      )
    }

    // 10. Preprocess image (resize, grayscale, enhance) - optional, continue on failure
    if (file.type.startsWith('image/')) {
      try {
        const processedBuffer: Buffer = await sharp(imageBuffer)
          .rotate() // Auto-rotate based on EXIF
          .resize(2000, 2000, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .greyscale()
          .normalise()
          .sharpen()
          .toBuffer()
        imageBuffer = processedBuffer
      } catch (preprocessError: unknown) {
        const errorMessage = preprocessError instanceof Error ? preprocessError.message : String(preprocessError)
        console.error('[OCR] Image preprocessing error:', errorMessage)
        // Continue with original image if preprocessing fails
      }
    }

    // 11. Extract text using Google Vision - with fallback
    const visionService = getGoogleVisionService()
    let ocrText: string = ''
    let hasText: boolean = false
    
    if (visionService.isAvailable()) {
      try {
        ocrText = await visionService.extractText(imageBuffer)
        hasText = Boolean(ocrText && ocrText.trim().length > 0)
      } catch (ocrError: unknown) {
        const errorMessage = ocrError instanceof Error ? ocrError.message : String(ocrError)
        console.error('[OCR] OCR extraction error:', errorMessage)
        // Continue with empty text - will return structured response with empty fields
        ocrText = ''
        hasText = false
      }
    } else {
      console.error('[OCR] Google Vision service not available')
      // Continue with empty text - will return structured response
      ocrText = ''
      hasText = false
    }

    // 13. Normalize OCR text - CRITICAL: Use original text for category detection
    // Always derive normalizedText from full OCR text
    const normalizedText = ocrText || ''
    const sanitizedText = normalizedText ? sanitizeOCRText(normalizedText) : ''

    // 14. ALWAYS predict category and extract fields (even with empty text)
    // Use ORIGINAL text for category detection (not sanitized)
    let category: Category
    let confidence: number
    let extractedData: any
    
    try {
      if (hasText) {
        // Use new pipeline processor (human-like extraction)
        // Pass original text for better category detection
        const ocrResult = processOCRText(normalizedText, userSelectedCategory)
        category = ocrResult.category
        confidence = ocrResult.confidence / 100 // Convert to 0-1 scale
        
        // Convert to legacy format for backward compatibility
        extractedData = convertToLegacyFormat(ocrResult)
        
        // Also run legacy extractor as fallback for missing fields
        const legacyExtracted = extractByCategory(sanitizedText, category)
        
        // Merge legacy data for fields not in new pipeline
        if (!extractedData.medicineName && legacyExtracted.medicineName) {
          extractedData.medicineName = {
            value: legacyExtracted.medicineName,
            confidence: 'Medium',
          }
        }
        if (!extractedData.brandName && legacyExtracted.brandName) {
          extractedData.brandName = {
            value: legacyExtracted.brandName,
            confidence: 'Medium',
          }
        }
        if (!extractedData.productName && legacyExtracted.productName) {
          extractedData.productName = {
            value: legacyExtracted.productName,
            confidence: 'Medium',
          }
        }
        
        // Use legacy expiry date if new one is missing
        if (!extractedData.expiryDate?.value && legacyExtracted.expiryDate?.value) {
          extractedData.expiryDate = {
            value: legacyExtracted.expiryDate.value,
            confidence: legacyExtracted.expiryDate.confidence,
            sourceKeyword: legacyExtracted.expiryDate.sourceKeyword,
          }
        }
        
        // Add warnings from legacy extractor
        if (legacyExtracted.extractionWarnings && legacyExtracted.extractionWarnings.length > 0) {
          extractedData.warnings = legacyExtracted.extractionWarnings
        }
      } else {
        // No text found - return structured response with empty fields
        category = userSelectedCategory as Category || 'other'
        confidence = 0.3 // Low confidence for empty text
        extractedData = {
          expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
        }
      }
    } catch (extractionError: unknown) {
      const errorMessage = extractionError instanceof Error ? extractionError.message : String(extractionError)
      console.error('[OCR] Data extraction error:', errorMessage)
      // Fallback: always return structured data
      category = userSelectedCategory as Category || 'other'
      confidence = hasText ? 0.5 : 0.3
      extractedData = {
        expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
      }
    }

    // 14. Prepare response - all serializable data with confidence scores
    // Map confidence levels: High (≥70%), Medium (40-69%), Low (<40%)
    const mapConfidence = (value: string | null | undefined): { value: string | null; confidence: 'High' | 'Medium' | 'Low' } => {
      if (!value || value.trim().length === 0) {
        return { value: null, confidence: 'Low' }
      }
      // Simple heuristic: if value was extracted and is not empty, assume Medium confidence
      // In production, this would be calculated based on extraction quality
      return { value, confidence: 'Medium' }
    }
    
    // Get OCRResult fields from pipeline processor
    let ocrResultFields: Record<string, any> = {}
    try {
      if (hasText) {
        const ocrResult = processOCRText(normalizedText, userSelectedCategory)
        ocrResultFields = ocrResult.fields || {}
      }
    } catch (e) {
      // Fallback - continue with empty fields
    }
    
    // Build legacy format result
    const result = {
      category,
      categoryConfidence: confidence >= 0.7 ? 'High' : confidence >= 0.4 ? 'Medium' : 'Low',
      categoryConfidencePercentage: Math.round(confidence * 100),
      expiryDate: extractedData.expiryDate ? {
        value: extractedData.expiryDate.value,
        confidence: extractedData.expiryDate.confidence,
        sourceKeyword: extractedData.expiryDate.sourceKeyword,
      } : { value: null, confidence: 'Low' as const, sourceKeyword: null },
      productName: mapConfidence(extractedData.productName),
      companyName: mapConfidence(extractedData.companyName),
      policyType: mapConfidence(extractedData.policyType),
      insurerName: mapConfidence(extractedData.insurerName),
      serviceType: mapConfidence(extractedData.serviceType),
      providerName: mapConfidence(extractedData.providerName),
      serviceName: mapConfidence(extractedData.serviceName),
      planType: mapConfidence(extractedData.planType),
      medicineName: mapConfidence(extractedData.medicineName),
      brandName: mapConfidence(extractedData.brandName),
      documentType: mapConfidence(extractedData.documentType),
      // Add new format fields from OCR pipeline
      documentName: ocrResultFields.documentName ? {
        value: ocrResultFields.documentName.value || '',
        confidence: ocrResultFields.documentName.confidence >= 70 ? 'High' : ocrResultFields.documentName.confidence >= 40 ? 'Medium' : 'Low',
      } : mapConfidence(null),
      licenseNumber: ocrResultFields.licenseNumber ? {
        value: ocrResultFields.licenseNumber.value || '',
        confidence: ocrResultFields.licenseNumber.confidence >= 70 ? 'High' : ocrResultFields.licenseNumber.confidence >= 40 ? 'Medium' : 'Low',
      } : mapConfidence(null),
      holderName: ocrResultFields.holderName ? {
        value: ocrResultFields.holderName.value || '',
        confidence: ocrResultFields.holderName.confidence >= 70 ? 'High' : ocrResultFields.holderName.confidence >= 40 ? 'Medium' : 'Low',
      } : mapConfidence(null),
      dateOfBirth: ocrResultFields.dateOfBirth ? {
        value: ocrResultFields.dateOfBirth.value || '',
        confidence: ocrResultFields.dateOfBirth.confidence >= 70 ? 'High' : ocrResultFields.dateOfBirth.confidence >= 40 ? 'Medium' : 'Low',
      } : mapConfidence(null),
      dateOfIssue: ocrResultFields.dateOfIssue ? {
        value: ocrResultFields.dateOfIssue.value || '',
        confidence: ocrResultFields.dateOfIssue.confidence >= 70 ? 'High' : ocrResultFields.dateOfIssue.confidence >= 40 ? 'Medium' : 'Low',
      } : mapConfidence(null),
      additionalFields: extractedData.additionalFields || {},
      warnings: extractedData.extractionWarnings || [],
      rawText: sanitizedText.substring(0, 1000), // Limit raw text in response (sanitized)
    }
    
    // Build extractedFields in new format (for confirmation modal)
    const extractedFields: Record<string, any> = {}
    for (const [key, field] of Object.entries(ocrResultFields)) {
      if (field && typeof field === 'object' && 'value' in field) {
        extractedFields[key] = {
          value: field.value || '',
          confidence: field.confidence >= 70 ? 'High' : field.confidence >= 40 ? 'Medium' : 'Low',
        }
      }
    }

    // 15. Log successful OCR call (don't block on logging errors)
    try {
      await supabase.from('ocr_logs').insert({
        user_id: user.id,
        file_hash: fileHash || 'unknown',
        category,
        success: true,
        ocr_result: result,
      })
    } catch (logError: unknown) {
      const errorMessage = logError instanceof Error ? logError.message : String(logError)
      console.error('[OCR] Failed to log OCR result:', errorMessage)
      // Continue - don't block response on logging errors
    }

    // 16. Return success response - success = true if ANY readable text is detected
    // 🔥 CRITICAL: success should NOT depend on field extraction success
    // normalizedText is already defined above, use it
    const fullTextLength = normalizedText.trim().length
    const apiSuccess = fullTextLength > 30 // If fullText.length > 30 → success MUST be true
    
    // If normalizedText is empty, still allow manual entry
    const allowManual = true // Always allow manual entry
    
    // Standardize OCR response format
    const finalNormalizedText = normalizedText.trim() // Use already defined normalizedText
    return NextResponse.json({
      success: apiSuccess, // true if text detected, false only if no text
      fullText: finalNormalizedText, // Full OCR text (exactly as returned from Google Vision)
      text: finalNormalizedText || sanitizedText || '', // Normalized text (fallback to sanitized)
      rawText: finalNormalizedText, // Original OCR text (same as fullText)
      category, // ALWAYS try to predict
      confidence: hasText ? 0.9 : 0.3, // Fallback confidence
      extractedFields: extractedFields, // New format: structured fields from OCR pipeline
      allowManualEntry: allowManual, // Always allow manual entry
      source: 'google_vision',
      extractedData: result, // Legacy format for backward compatibility
    })
  } catch (error: unknown) {
    // Global error handler - NEVER throw, always return JSON
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[OCR] Global error handler:', errorMessage, errorStack)

    // Return 200 with success:true and structured data (error = empty fields)
    // 🔥 CRITICAL: Never return success: false unless server crashes
    return NextResponse.json(
      {
        success: true, // 🔥 ALWAYS TRUE
        text: '',
        rawText: '',
        category: 'other',
        fields: {},
        confidence: 0.3,
        allowManualEntry: true, // CRITICAL: Always allow manual entry
        source: 'google_vision',
        extractedData: {
          category: 'other',
          categoryConfidence: 'Low' as const,
          categoryConfidencePercentage: 0,
          expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
        },
      },
      { status: 200 }
    )
  }
}
