// OCR API Route - Google Cloud Vision
// Accepts image upload and returns extracted text
// Comprehensive abuse protection: rate limiting, file validation, duplicate detection

import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromImage, calculateConfidence } from '@/lib/googleVisionOCR'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/supabase/plans'
import { canUseOCR } from '@/lib/plans'
import { getOcrCount, getOcrCountToday, getOcrCountThisMonth } from '@/lib/supabase/ocrTracking'
import { checkOcrRateLimit } from '@/lib/abuse/rateLimiting'
import { validateFile } from '@/lib/abuse/fileValidation'
import { generateFileHash, getCachedOcrResult, cacheOcrResult } from '@/lib/abuse/duplicateDetection'

export const runtime = 'nodejs'
export const maxDuration = 30 // 30 seconds max

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'OCR_FAILED',
          message: 'Please log in to use document scanning.',
        },
        { status: 401 }
      )
    }

    // Step 2: Rate limiting (5 requests/min/user)
    const rateLimit = checkOcrRateLimit(user.id)
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please wait ${resetIn} seconds before trying again.`,
        },
        { status: 429 }
      )
    }

    // Step 3: Get user plan and check OCR limits
    const userPlan = await getUserPlan(user.id)
    const ocrCheck = await canUseOCR(
      user.id,
      userPlan,
      getOcrCount,
      getOcrCountToday,
      getOcrCountThisMonth
    )

    if (!ocrCheck.allowed) {
      return NextResponse.json(
        {
          error: 'OCR_LIMIT_EXCEEDED',
          message: ocrCheck.reason || 'You\'ve used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders',
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // Step 4: Parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json(
        {
          error: 'OCR_FAILED',
          message: 'No file provided. Please select a file to scan.',
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json(
        {
          error: 'OCR_FAILED',
          message: 'Invalid file type. Please upload an image or PDF file.',
        },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Step 5: Comprehensive file validation (size, dimensions, PDF pages)
    const validation = await validateFile(file, fileBuffer)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: validation.error || 'File validation failed. Please check your file and try again.',
        },
        { status: 400 }
      )
    }

    // Step 6: Duplicate detection - check if we've processed this file before
    const fileHash = generateFileHash(fileBuffer)
    const cachedResult = await getCachedOcrResult(fileHash)
    
    if (cachedResult) {
      // Return cached result (no need to process again)
      return NextResponse.json({
        text: cachedResult.ocr_text,
        confidence: cachedResult.confidence,
        cached: true,
      })
    }

    // Step 7: Extract text using Google Vision (with preprocessing)
    const extractedText = await extractTextFromImage(fileBuffer, true)

    // Step 8: Detect expiry date for confidence calculation
    const { detectExpiryDate } = await import('@/lib/ocr/expiryDetection')
    const expiryDetection = detectExpiryDate(extractedText)

    // Step 9: Calculate confidence (enhanced with expiry detection)
    const confidenceResult = calculateConfidence(extractedText, expiryDetection)
    const confidence = confidenceResult.level
    const confidenceScore = confidenceResult.score

    // Step 10: Cache the result for future duplicate detection
    await cacheOcrResult(fileHash, extractedText, confidence)

    // Return result with confidence score
    return NextResponse.json({
      text: extractedText,
      confidence,
      confidenceScore, // Numeric score (0-100) for auto-fill decisions
      cached: false,
    })
  } catch (error: any) {
    console.error('[OCR API] Error:', error)

    // Graceful failure - never expose technical details
    return NextResponse.json(
      {
        error: 'OCR_FAILED',
        message: 'Could not read document clearly. Please try again or enter details manually.',
      },
      { status: 200 } // Return 200 to allow frontend to handle gracefully
    )
  }
}
