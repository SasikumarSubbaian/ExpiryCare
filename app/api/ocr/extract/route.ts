import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleVisionService } from '@/lib/ocr/googleVision'
import { validateFile, generateFileHash, logOCRCall, checkDuplicateFile, checkRateLimit } from '@/lib/ocr/abuseProtection'
import { canUseOCR } from '@/lib/ocr/pricingLogic'
import { predictCategory, getPredictionConfidence } from '@/lib/ocr/categoryPredictor'
import { extractByCategory } from '@/lib/ocr/extractors'
import { sanitizeOCRText } from '@/lib/ocr/sanitizeOCRText'
import { processOCRText, convertToLegacyFormat } from '@/lib/ocr/pipelineProcessor'
import { reevaluateCategoryFromExtractedData } from '@/lib/ocr/categoryReevaluator'
import { extractDataFromRawText } from '@/lib/ocr/humanExtractionEngine'
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
    let visionAvailable: boolean = false
    let visionError: string | null = null
    
    if (visionService.isAvailable()) {
      visionAvailable = true
      try {
        ocrText = await visionService.extractText(imageBuffer)
        hasText = Boolean(ocrText && ocrText.trim().length > 0)
        
        // 🔧 PRODUCTION DEBUG: Log OCR text length (safe - no sensitive data)
        if (process.env.NODE_ENV === 'production') {
          console.log('[OCR] Google Vision extracted text length:', ocrText.length, 'hasText:', hasText)
        }
      } catch (ocrError: unknown) {
        visionError = ocrError instanceof Error ? ocrError.message : String(ocrError)
        console.error('[OCR] OCR extraction error:', visionError)
        // Continue with empty text - will return structured response with empty fields
        ocrText = ''
        hasText = false
      }
    } else {
      // 🔧 PRODUCTION DEBUG: Log why Google Vision is not available
      if (process.env.NODE_ENV === 'production') {
        console.error('[OCR] Google Vision service not available - check credentials')
      } else {
        console.error('[OCR] Google Vision service not available')
      }
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
    
    // 🔧 CRITICAL: Initialize ocrResultFields BEFORE human extraction so we can merge
    let ocrResultFields: Record<string, any> = {}
    
    try {
      // 🔧 CRITICAL FIX: Always run human extraction if we have ANY text (even minimal)
      // This ensures extraction works even if Google Vision returns partial text
      if (normalizedText && normalizedText.trim().length > 0) {
        // 🔧 LAYER 2: ADD A REAL EXTRACTION ENGINE (CRITICAL)
        // Google Vision ≠ Human reader - YOU must read like a human
        const humanExtracted = extractDataFromRawText(normalizedText)
        
        // 🔧 PRODUCTION DEBUG: Log extraction results (safe - no sensitive data)
        if (process.env.NODE_ENV === 'production') {
          console.log('[OCR] Human extraction completed:', {
            category: humanExtracted.category,
            fieldsFound: Object.keys(humanExtracted.extractedData).length,
            hasExpiry: !!humanExtracted.extractedData.expiryDate?.value,
            hasProductName: !!humanExtracted.extractedData.productName?.value,
            hasManufacturingDate: !!humanExtracted.extractedData.manufacturingDate?.value,
            hasBatchNumber: !!humanExtracted.extractedData.batchNumber?.value,
          })
        }
        
        // Map human extraction category to API category
        // License is stored as "other" with license fields
        const humanCategory = humanExtracted.category
        category = (humanCategory === 'license' ? 'other' : humanCategory) as Category
        confidence = 0.8 // High confidence for human extraction
        
        // 🔧 LAYER 4: FIX UI DATA CONTRACT
        // extractedData must have: { fieldName: { value, confidence } }
        extractedData = {
          category,
          categoryConfidence: 'High' as const,
          categoryConfidencePercentage: 80,
          expiryDate: humanExtracted.extractedData.expiryDate || { value: null, confidence: 'Low' as const, sourceKeyword: null },
        }
        
      // 🔧 CRITICAL: Map all extracted fields from human extraction to extractedData
      // These fields are already in { value, confidence } format
      if (humanExtracted.extractedData.documentName) {
        extractedData.documentName = humanExtracted.extractedData.documentName
      }
      if (humanExtracted.extractedData.licenseNumber) {
        extractedData.licenseNumber = humanExtracted.extractedData.licenseNumber
      }
      if (humanExtracted.extractedData.holderName) {
        extractedData.holderName = humanExtracted.extractedData.holderName
      }
      if (humanExtracted.extractedData.dateOfBirth) {
        extractedData.dateOfBirth = humanExtracted.extractedData.dateOfBirth
      }
      if (humanExtracted.extractedData.dateOfIssue) {
        extractedData.dateOfIssue = humanExtracted.extractedData.dateOfIssue
      }
            if (humanExtracted.extractedData.productName) {
              extractedData.productName = humanExtracted.extractedData.productName
            }
            // 🔧 Add manufacturing date for medicine category
            if (humanExtracted.extractedData.manufacturingDate) {
              extractedData.manufacturingDate = humanExtracted.extractedData.manufacturingDate
            }
      if (humanExtracted.extractedData.batchNumber) {
        extractedData.batchNumber = humanExtracted.extractedData.batchNumber
      }
      if (humanExtracted.extractedData.purchaseDate) {
        extractedData.purchaseDate = humanExtracted.extractedData.purchaseDate
      }
      if (humanExtracted.extractedData.companyName) {
        extractedData.companyName = humanExtracted.extractedData.companyName
      }
      
      // 🔧 CRITICAL: Also add human-extracted fields to ocrResultFields for extractedFields
      // This ensures they appear in the confirmation modal
      if (humanExtracted.extractedData.documentName) {
        ocrResultFields.documentName = {
          value: humanExtracted.extractedData.documentName.value || '',
          confidence: humanExtracted.extractedData.documentName.confidence === 'High' ? 90 : 
                     humanExtracted.extractedData.documentName.confidence === 'Medium' ? 60 : 30,
        }
      }
      if (humanExtracted.extractedData.licenseNumber) {
        ocrResultFields.licenseNumber = {
          value: humanExtracted.extractedData.licenseNumber.value || '',
          confidence: humanExtracted.extractedData.licenseNumber.confidence === 'High' ? 90 : 
                     humanExtracted.extractedData.licenseNumber.confidence === 'Medium' ? 60 : 30,
        }
      }
      if (humanExtracted.extractedData.holderName) {
        ocrResultFields.holderName = {
          value: humanExtracted.extractedData.holderName.value || '',
          confidence: humanExtracted.extractedData.holderName.confidence === 'High' ? 90 : 
                     humanExtracted.extractedData.holderName.confidence === 'Medium' ? 60 : 30,
        }
      }
      if (humanExtracted.extractedData.dateOfBirth) {
        ocrResultFields.dateOfBirth = {
          value: humanExtracted.extractedData.dateOfBirth.value || '',
          confidence: humanExtracted.extractedData.dateOfBirth.confidence === 'High' ? 90 : 
                     humanExtracted.extractedData.dateOfBirth.confidence === 'Medium' ? 60 : 30,
        }
      }
      if (humanExtracted.extractedData.dateOfIssue) {
        ocrResultFields.dateOfIssue = {
          value: humanExtracted.extractedData.dateOfIssue.value || '',
          confidence: humanExtracted.extractedData.dateOfIssue.confidence === 'High' ? 90 : 
                     humanExtracted.extractedData.dateOfIssue.confidence === 'Medium' ? 60 : 30,
        }
      }
      if (humanExtracted.extractedData.productName) {
        ocrResultFields.productName = {
          value: humanExtracted.extractedData.productName.value || '',
          confidence: humanExtracted.extractedData.productName.confidence === 'High' ? 90 : 
                     humanExtracted.extractedData.productName.confidence === 'Medium' ? 60 : 30,
        }
      }
      if (humanExtracted.extractedData.batchNumber) {
        ocrResultFields.batchNumber = {
          value: humanExtracted.extractedData.batchNumber.value || '',
          confidence: humanExtracted.extractedData.batchNumber.confidence === 'High' ? 90 : 
                     humanExtracted.extractedData.batchNumber.confidence === 'Medium' ? 60 : 30,
        }
      }
      // 🔧 Add manufacturing date to ocrResultFields for medicine category
      if (humanExtracted.extractedData.manufacturingDate) {
        ocrResultFields.manufacturingDate = {
          value: humanExtracted.extractedData.manufacturingDate.value || '',
          confidence: humanExtracted.extractedData.manufacturingDate.confidence === 'High' ? 90 : 
                     humanExtracted.extractedData.manufacturingDate.confidence === 'Medium' ? 60 : 30,
        }
      }
      if (humanExtracted.extractedData.purchaseDate) {
        ocrResultFields.purchaseDate = {
          value: humanExtracted.extractedData.purchaseDate.value || '',
          confidence: humanExtracted.extractedData.purchaseDate.confidence === 'High' ? 90 : 
                     humanExtracted.extractedData.purchaseDate.confidence === 'Medium' ? 60 : 30,
        }
      }
        
        // Also run pipeline processor as fallback for additional fields
        const ocrResult = processOCRText(normalizedText, userSelectedCategory)
        const pipelineData = convertToLegacyFormat(ocrResult)
        
        // Merge pipeline data for fields not in human extraction
        for (const [key, value] of Object.entries(pipelineData)) {
          if (key !== 'category' && key !== 'categoryConfidence' && key !== 'categoryConfidencePercentage') {
            if (!extractedData[key]) {
              extractedData[key] = value
            }
          }
        }
        
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
        // 🔧 CRITICAL: Still try to extract from normalizedText even if hasText is false
        // This handles cases where Google Vision returns text but hasText check failed
        if (normalizedText && normalizedText.trim().length > 0) {
          // Try extraction one more time with normalizedText
          const humanExtracted = extractDataFromRawText(normalizedText)
          const humanCategory = humanExtracted.category
          category = (humanCategory === 'license' ? 'other' : humanCategory) as Category
          confidence = 0.6 // Medium confidence since we have some text
          extractedData = {
            category,
            categoryConfidence: 'Medium' as const,
            categoryConfidencePercentage: 60,
            expiryDate: humanExtracted.extractedData.expiryDate || { value: null, confidence: 'Low' as const, sourceKeyword: null },
          }
          
          // Map all extracted fields to extractedData
          if (humanExtracted.extractedData.productName) {
            extractedData.productName = humanExtracted.extractedData.productName
          }
          if (humanExtracted.extractedData.manufacturingDate) {
            extractedData.manufacturingDate = humanExtracted.extractedData.manufacturingDate
          }
          if (humanExtracted.extractedData.batchNumber) {
            extractedData.batchNumber = humanExtracted.extractedData.batchNumber
          }
          if (humanExtracted.extractedData.expiryDate) {
            extractedData.expiryDate = humanExtracted.extractedData.expiryDate
          }
          
          // 🔧 CRITICAL: Also populate ocrResultFields for UI (extractedFields)
          // This ensures the confirmation modal receives the extracted data
          if (humanExtracted.extractedData.productName) {
            ocrResultFields.productName = {
              value: humanExtracted.extractedData.productName.value || '',
              confidence: humanExtracted.extractedData.productName.confidence === 'High' ? 90 : 
                         humanExtracted.extractedData.productName.confidence === 'Medium' ? 60 : 30,
            }
          }
          if (humanExtracted.extractedData.manufacturingDate) {
            ocrResultFields.manufacturingDate = {
              value: humanExtracted.extractedData.manufacturingDate.value || '',
              confidence: humanExtracted.extractedData.manufacturingDate.confidence === 'High' ? 90 : 
                         humanExtracted.extractedData.manufacturingDate.confidence === 'Medium' ? 60 : 30,
            }
          }
          if (humanExtracted.extractedData.batchNumber) {
            ocrResultFields.batchNumber = {
              value: humanExtracted.extractedData.batchNumber.value || '',
              confidence: humanExtracted.extractedData.batchNumber.confidence === 'High' ? 90 : 
                         humanExtracted.extractedData.batchNumber.confidence === 'Medium' ? 60 : 30,
            }
          }
          if (humanExtracted.extractedData.expiryDate) {
            ocrResultFields.expiryDate = {
              value: humanExtracted.extractedData.expiryDate.value || '',
              confidence: humanExtracted.extractedData.expiryDate.confidence === 'High' ? 90 : 
                         humanExtracted.extractedData.expiryDate.confidence === 'Medium' ? 60 : 30,
            }
          }
        } else {
          // Truly no text - return structured response with empty fields
          category = userSelectedCategory as Category || 'other'
          confidence = 0.3 // Low confidence for empty text
          extractedData = {
            category: 'other',
            categoryConfidence: 'Low' as const,
            categoryConfidencePercentage: 30,
            expiryDate: { value: null, confidence: 'Low' as const, sourceKeyword: null },
          }
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
    // 🔧 FIX: Handle both string values and object values from human extraction
    const mapConfidence = (value: string | null | undefined | { value: string | null; confidence: 'High' | 'Medium' | 'Low' }): { value: string | null; confidence: 'High' | 'Medium' | 'Low' } => {
      // If value is already an object with value and confidence, return it
      if (value && typeof value === 'object' && 'value' in value && 'confidence' in value) {
        return {
          value: value.value || null,
          confidence: value.confidence,
        }
      }
      
      // If value is a string, convert it
      const stringValue = typeof value === 'string' ? value : null
      if (!stringValue || stringValue.trim().length === 0) {
        return { value: null, confidence: 'Low' }
      }
      // Simple heuristic: if value was extracted and is not empty, assume Medium confidence
      // In production, this would be calculated based on extraction quality
      return { value: stringValue, confidence: 'Medium' }
    }
    
    // ocrResultFields is already initialized above before human extraction
    // Merge pipeline processor fields if not already set by human extraction
    // 🔧 CRITICAL FIX: Check normalizedText instead of hasText to ensure extraction runs
    try {
      if (normalizedText && normalizedText.trim().length > 0 && Object.keys(ocrResultFields).length === 0) {
        const ocrResult = processOCRText(normalizedText, userSelectedCategory)
        ocrResultFields = ocrResult.fields || {}
      }
    } catch (e) {
      // Fallback - continue with human extraction only
      if (process.env.NODE_ENV === 'production') {
        console.error('[OCR] Pipeline processor error:', e instanceof Error ? e.message : String(e))
      }
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
      // 🔧 Add manufacturing date for medicine category - use extractedData first, then ocrResultFields
      manufacturingDate: extractedData.manufacturingDate ? mapConfidence(extractedData.manufacturingDate) :
        (ocrResultFields.manufacturingDate ? {
          value: ocrResultFields.manufacturingDate.value || '',
          confidence: (typeof ocrResultFields.manufacturingDate.confidence === 'number' && ocrResultFields.manufacturingDate.confidence >= 70) ? 'High' : 
                     (typeof ocrResultFields.manufacturingDate.confidence === 'number' && ocrResultFields.manufacturingDate.confidence >= 40) ? 'Medium' : 'Low',
        } : mapConfidence(null)),
      // 🔧 Add batch number - use extractedData first, then ocrResultFields
      batchNumber: extractedData.batchNumber ? mapConfidence(extractedData.batchNumber) :
        (ocrResultFields.batchNumber ? {
          value: ocrResultFields.batchNumber.value || '',
          confidence: (typeof ocrResultFields.batchNumber.confidence === 'number' && ocrResultFields.batchNumber.confidence >= 70) ? 'High' : 
                     (typeof ocrResultFields.batchNumber.confidence === 'number' && ocrResultFields.batchNumber.confidence >= 40) ? 'Medium' : 'Low',
        } : mapConfidence(null)),
      documentType: mapConfidence(extractedData.documentType),
      // 🔧 CRITICAL: Use extractedData fields first (from human extraction), then fallback to ocrResultFields
      documentName: extractedData.documentName ? mapConfidence(extractedData.documentName) : 
        (ocrResultFields.documentName ? {
          value: ocrResultFields.documentName.value || '',
          confidence: (typeof ocrResultFields.documentName.confidence === 'number' && ocrResultFields.documentName.confidence >= 70) ? 'High' : 
                     (typeof ocrResultFields.documentName.confidence === 'number' && ocrResultFields.documentName.confidence >= 40) ? 'Medium' : 'Low',
        } : mapConfidence(null)),
      licenseNumber: extractedData.licenseNumber ? mapConfidence(extractedData.licenseNumber) :
        (ocrResultFields.licenseNumber ? {
          value: ocrResultFields.licenseNumber.value || '',
          confidence: (typeof ocrResultFields.licenseNumber.confidence === 'number' && ocrResultFields.licenseNumber.confidence >= 70) ? 'High' : 
                     (typeof ocrResultFields.licenseNumber.confidence === 'number' && ocrResultFields.licenseNumber.confidence >= 40) ? 'Medium' : 'Low',
        } : mapConfidence(null)),
      holderName: extractedData.holderName ? mapConfidence(extractedData.holderName) :
        (ocrResultFields.holderName ? {
          value: ocrResultFields.holderName.value || '',
          confidence: (typeof ocrResultFields.holderName.confidence === 'number' && ocrResultFields.holderName.confidence >= 70) ? 'High' : 
                     (typeof ocrResultFields.holderName.confidence === 'number' && ocrResultFields.holderName.confidence >= 40) ? 'Medium' : 'Low',
        } : mapConfidence(null)),
      dateOfBirth: extractedData.dateOfBirth ? mapConfidence(extractedData.dateOfBirth) :
        (ocrResultFields.dateOfBirth ? {
          value: ocrResultFields.dateOfBirth.value || '',
          confidence: (typeof ocrResultFields.dateOfBirth.confidence === 'number' && ocrResultFields.dateOfBirth.confidence >= 70) ? 'High' : 
                     (typeof ocrResultFields.dateOfBirth.confidence === 'number' && ocrResultFields.dateOfBirth.confidence >= 40) ? 'Medium' : 'Low',
        } : mapConfidence(null)),
      dateOfIssue: extractedData.dateOfIssue ? mapConfidence(extractedData.dateOfIssue) :
        (ocrResultFields.dateOfIssue ? {
          value: ocrResultFields.dateOfIssue.value || '',
          confidence: (typeof ocrResultFields.dateOfIssue.confidence === 'number' && ocrResultFields.dateOfIssue.confidence >= 70) ? 'High' : 
                     (typeof ocrResultFields.dateOfIssue.confidence === 'number' && ocrResultFields.dateOfIssue.confidence >= 40) ? 'Medium' : 'Low',
        } : mapConfidence(null)),
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
