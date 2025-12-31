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
      // Return 200 with success:false - auth errors are not 500s
      return NextResponse.json(
        {
          success: false,
          text: null,
          reason: 'UNAUTHORIZED',
          error: 'Unauthorized',
          allowManualEntry: false,
        },
        { status: 200 }
      )
    }

    // 2. Rate limiting: 5 requests per minute per user
    try {
      const rateLimitResult = checkRateLimit(`ocr:${user.id}`, 5, 60 * 1000)
      if (!rateLimitResult.allowed) {
        // Return 200 with success:false - rate limit is not a 500 error
        return NextResponse.json(
          {
            success: false,
            text: null,
            reason: 'RATE_LIMIT_EXCEEDED',
            error: rateLimitResult.error || 'Rate limit exceeded',
            retryAfter: rateLimitResult.retryAfter,
            allowManualEntry: true, // Allow manual entry even if rate limited
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
      // Return 200 with success:false - missing file is not a 500 error
      return NextResponse.json(
        {
          success: false,
          text: null,
          reason: 'NO_FILE',
          error: 'No file provided',
          allowManualEntry: true, // Allow manual entry
        },
        { status: 200 }
      )
    }

    // 5. Validate file (size, type, etc.)
    let validation: { valid: boolean; error?: string }
    try {
      validation = validateFile(file)
      if (!validation.valid) {
        // Return 200 with success:false - invalid file is not a 500 error
        return NextResponse.json(
          {
            success: false,
            text: null,
            reason: 'INVALID_FILE',
            error: validation.error || 'Invalid file',
            allowManualEntry: true,
          },
          { status: 200 }
        )
      }
    } catch (validationError: unknown) {
      const errorMessage = validationError instanceof Error ? validationError.message : String(validationError)
      console.error('[OCR] File validation error:', errorMessage)
      return NextResponse.json(
        {
          success: false,
          text: null,
          reason: 'VALIDATION_ERROR',
          error: 'File validation failed',
          allowManualEntry: true,
        },
        { status: 200 }
      )
    }

    // 6. Check OCR limits based on plan
    let ocrCheck: { allowed: boolean; reason?: string; remaining?: number }
    try {
      ocrCheck = await canUseOCR(user.id)
      if (!ocrCheck.allowed) {
        // Return 200 with success:false - limit reached is not a 500 error
        return NextResponse.json(
          {
            success: false,
            text: null,
            reason: 'OCR_LIMIT_REACHED',
            error: ocrCheck.reason || 'OCR limit reached',
            remaining: ocrCheck.remaining,
            allowManualEntry: true, // Always allow manual entry
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
    if (!visionService.isAvailable()) {
      console.error('[OCR] Google Vision service not available')
      // Return 200 with success:false - service unavailable is not a 500 error
      return NextResponse.json(
        {
          success: false,
          text: null,
          reason: 'SERVICE_UNAVAILABLE',
          error: 'OCR service not available. Please configure Google Vision API credentials.',
          allowManualEntry: true, // Always allow manual entry
        },
        { status: 200 }
      )
    }

    let ocrText: string
    try {
      ocrText = await visionService.extractText(imageBuffer)
    } catch (ocrError: unknown) {
      const errorMessage = ocrError instanceof Error ? ocrError.message : String(ocrError)
      console.error('[OCR] OCR extraction error:', errorMessage)
      
      // Log failed OCR call (don't block on logging errors)
      try {
        await logOCRCall(user.id, fileHash || 'unknown', 'unknown', false)
      } catch (logError) {
        console.error('[OCR] Failed to log OCR call:', logError)
      }

      // Return 200 with success:false - OCR failure is not a 500 error
      return NextResponse.json(
        {
          success: false,
          text: null,
          reason: 'OCR_FAILED',
          error: 'Failed to extract text from document. Please try again or enter details manually.',
          allowManualEntry: true, // CRITICAL: Always allow manual entry
        },
        { status: 200 }
      )
    }

    // 12. Validate OCR text
    if (!ocrText || ocrText.trim().length === 0) {
      try {
        await logOCRCall(user.id, fileHash || 'unknown', 'unknown', false)
      } catch (logError) {
        console.error('[OCR] Failed to log OCR call:', logError)
      }
      
      // Return 200 with success:false - no text found is not a 500 error
      return NextResponse.json(
        {
          success: false,
          text: null,
          reason: 'NO_TEXT_FOUND',
          error: 'No text found in document. Please ensure the document is clear and readable, or enter details manually.',
          allowManualEntry: true, // Always allow manual entry
        },
        { status: 200 }
      )
    }

    // 13. Sanitize OCR text to remove PII before processing
    const sanitizedText = sanitizeOCRText(ocrText)

    // 14. Process through human-like OCR pipeline
    let category: Category
    let confidence: number
    let extractedData: any
    
    try {
      // Use new pipeline processor (human-like extraction)
      const ocrResult = processOCRText(ocrText, userSelectedCategory)
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
    } catch (extractionError: unknown) {
      const errorMessage = extractionError instanceof Error ? extractionError.message : String(extractionError)
      console.error('[OCR] Data extraction error:', errorMessage)
      // Fallback to legacy extraction
      try {
        category = userSelectedCategory as Category || predictCategory(sanitizedText)
        confidence = getPredictionConfidence(sanitizedText, category)
        extractedData = extractByCategory(sanitizedText, category)
      } catch (fallbackError) {
        // Return partial data if extraction fails
        category = 'other'
        confidence = 0.3 // Low confidence (0-1 scale)
        extractedData = {
          expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
        }
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
      additionalFields: extractedData.additionalFields || {},
      warnings: extractedData.extractionWarnings || [],
      rawText: sanitizedText.substring(0, 1000), // Limit raw text in response (sanitized)
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

    // 16. Return success response
    return NextResponse.json({
      success: true,
      text: sanitizedText, // Include sanitized OCR text for client (PII removed)
      extractedData: result,
    })
  } catch (error: unknown) {
    // Global error handler - NEVER throw, always return JSON
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[OCR] Global error handler:', errorMessage, errorStack)

    // Return 200 with success:false - never return 500 unless request is malformed
    return NextResponse.json(
      {
        success: false,
        text: null,
        reason: 'INTERNAL_ERROR',
        error: 'An error occurred while processing the document. Please try again or enter details manually.',
        allowManualEntry: true, // CRITICAL: Always allow manual entry
      },
      { status: 200 }
    )
  }
}
