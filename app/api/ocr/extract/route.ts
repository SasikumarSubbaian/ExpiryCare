import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleVisionService } from '@/lib/ocr/googleVision'
import { validateFile, generateFileHash, logOCRCall, checkDuplicateFile, checkRateLimit } from '@/lib/ocr/abuseProtection'
import { canUseOCR } from '@/lib/ocr/pricingLogic'
import { predictCategory, getPredictionConfidence } from '@/lib/ocr/categoryPredictor'
import { extractByCategory } from '@/lib/ocr/extractors'
import sharp from 'sharp'

/**
 * OCR Extraction API Route
 * Uses Google Vision OCR with category-aware extraction
 */

// Force Node.js runtime for OCR processing (required for sharp and Google Vision)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      )
    }

    const { data, error: authError } = await supabase.auth.getUser()
    const user = data?.user || null

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting: 5 requests per minute per user
    const rateLimitResult = checkRateLimit(`ocr:${user.id}`, 5, 60 * 1000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const userSelectedCategory = formData.get('category') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Check OCR limits based on plan
    const ocrCheck = await canUseOCR(user.id)
    if (!ocrCheck.allowed) {
      return NextResponse.json(
        {
          error: ocrCheck.reason || 'OCR limit reached',
          remaining: ocrCheck.remaining,
        },
        { status: 403 }
      )
    }

    // Generate file hash for duplicate detection
    const fileHash = await generateFileHash(file)

    // Check for duplicate
    const duplicateCheck = await checkDuplicateFile(user.id, fileHash)
    if (duplicateCheck.isDuplicate && duplicateCheck.existingResult) {
      return NextResponse.json({
        success: true,
        extractedData: duplicateCheck.existingResult,
        isDuplicate: true,
        message: 'Using previously processed result',
      })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    let imageBuffer: Buffer = Buffer.from(new Uint8Array(arrayBuffer))

    // Preprocess image (resize, grayscale, enhance)
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
      } catch (preprocessError) {
        console.error('Image preprocessing error:', preprocessError)
        // Continue with original image if preprocessing fails
      }
    }

    // Extract text using Google Vision
    const visionService = getGoogleVisionService()
    if (!visionService.isAvailable()) {
      return NextResponse.json(
        {
          error: 'OCR service not available. Please configure Google Vision API credentials.',
        },
        { status: 503 }
      )
    }

    let ocrText: string
    try {
      ocrText = await visionService.extractText(imageBuffer)
    } catch (ocrError: any) {
      console.error('OCR extraction error:', ocrError)
      
      // Log failed OCR call
      await logOCRCall(user.id, fileHash, 'unknown', false)

      return NextResponse.json(
        {
          error: 'Failed to extract text from document',
          details: ocrError.message,
        },
        { status: 500 }
      )
    }

    if (!ocrText || ocrText.trim().length === 0) {
      await logOCRCall(user.id, fileHash, 'unknown', false)
      return NextResponse.json(
        {
          error: 'No text found in document. Please ensure the document is clear and readable.',
        },
        { status: 400 }
      )
    }

    // Predict category if not provided
    let category = userSelectedCategory as any || predictCategory(ocrText)
    const confidence = getPredictionConfidence(ocrText, category)

    // Extract data using category-aware extractors
    const extractedData = extractByCategory(ocrText, category)

    // Prepare response
    const result = {
      category,
      categoryConfidence: confidence,
      expiryDate: extractedData.expiryDate,
      productName: extractedData.productName,
      companyName: extractedData.companyName,
      policyType: extractedData.policyType,
      insurerName: extractedData.insurerName,
      serviceType: extractedData.serviceType,
      providerName: extractedData.providerName,
      serviceName: extractedData.serviceName,
      planType: extractedData.planType,
      medicineName: extractedData.medicineName,
      brandName: extractedData.brandName,
      documentType: extractedData.documentType,
      additionalFields: extractedData.additionalFields,
      warnings: extractedData.extractionWarnings,
      rawText: ocrText.substring(0, 1000), // Limit raw text in response
    }

    // Log successful OCR call with result stored
    await supabase.from('ocr_logs').insert({
      user_id: user.id,
      file_hash: fileHash,
      category,
      success: true,
      ocr_result: result,
    })

    return NextResponse.json({
      success: true,
      extractedData: result,
    })
  } catch (error: any) {
    console.error('Error in OCR extraction:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
