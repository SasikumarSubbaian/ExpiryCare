import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseExpiryData, createParseError } from '@/lib/ai/parseExpiryData'
import { extractHandwritingExpiry } from '@/lib/ai/extractHandwritingExpiry'
import type { ExpiryDataOutput } from '@/lib/ai/types'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { extractTextWithMLKit, isMLKitConfigured } from '@/lib/ocr'

const execFileAsync = promisify(execFile)

// OCR Provider Selection
// Set OCR_PROVIDER environment variable to 'mlkit' to use Google ML Kit (Cloud Vision API)
// Default: 'tesseract' (uses Tesseract.js)
const OCR_PROVIDER = process.env.OCR_PROVIDER || 'tesseract'

// Response type for the combined endpoint
interface ExtractExpiryResponse {
  success?: boolean
  stage?: string
  message?: string
  rawText: string
  parsedData: {
    productName: string | null
    expiryDate: string | null
    manufacturingDate: string | null
    batchNumber: string | null
    confidenceScore: number
    detectedLabels: string[]
  }
  ocrConfidence?: number
  imageType?: 'handwritten' | 'printed'
  processingTime?: number
  errors?: string[]
  requiresCrop?: boolean // CRITICAL: Indicates OCR timeout - user should crop expiry/warranty area
}

// Timeout configurations
const OCR_TIMEOUT = 60000 // 60 seconds for OCR (increased for large/complex images)
const AI_PARSE_TIMEOUT = 20000 // 20 seconds for AI parsing

/**
 * Combined OCR + AI Parsing API Route
 * 
 * NEVER throws unhandled errors - always returns JSON with HTTP 200
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const errors: string[] = []
  let rawText = ''
  let ocrConfidence = 0
  let imageType: 'handwritten' | 'printed' | undefined
  let parsedData: ExpiryDataOutput | null = null
  let currentStage = 'initialization'

  // Debug mode: Check for ?debug=true query parameter
  const { searchParams } = new URL(request.url)
  const debugMode = searchParams.get('debug') === 'true'

  if (debugMode) {
    console.log('[Extract-Expiry] DEBUG MODE: Returning mock data (skipping OCR)')
    
    // Return mock data for frontend testing
    const mockResponse: ExtractExpiryResponse = {
      success: true,
      rawText: 'MOCK OCR TEXT: Test Product\nExpiry Date: 31/12/2026\nBatch: TEST123',
      parsedData: {
        productName: 'Test Product',
        expiryDate: '2026-12-31',
        manufacturingDate: null,
        batchNumber: null,
        confidenceScore: 90,
        detectedLabels: ['EXP', 'EXPIRY DATE'],
      },
      ocrConfidence: 95,
      imageType: 'printed',
      processingTime: Date.now() - startTime,
    }

    return NextResponse.json(mockResponse, { status: 200 })
  }

  try {
    // Stage: Authentication
    currentStage = 'authentication'
    console.log('[Extract-Expiry] Stage: Authentication started')
    
    let supabase
    let user
    try {
      supabase = await createClient()
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user
    } catch (authError: any) {
      console.error('[Extract-Expiry] Authentication error:', authError)
      return NextResponse.json(
        {
          success: false,
          stage: 'authentication',
          message: 'Authentication failed',
          rawText: '',
          parsedData: {
            productName: null,
            expiryDate: null,
            manufacturingDate: null,
            batchNumber: null,
            confidenceScore: 0,
            detectedLabels: [],
          },
          processingTime: Date.now() - startTime,
          errors: [authError.message || 'Authentication error'],
        },
        { status: 200 }
      )
    }

    if (!user) {
      console.log('[Extract-Expiry] Stage: Authentication failed - no user')
      return NextResponse.json(
        {
          success: false,
          stage: 'authentication',
          message: 'Unauthorized',
          rawText: '',
          parsedData: {
            productName: null,
            expiryDate: null,
            manufacturingDate: null,
            batchNumber: null,
            confidenceScore: 0,
            detectedLabels: [],
          },
          processingTime: Date.now() - startTime,
          errors: ['User not authenticated'],
        },
        { status: 200 }
      )
    }

    console.log('[Extract-Expiry] Stage: Authentication completed')

    // Stage: File Reception
    currentStage = 'file_reception'
    console.log('[Extract-Expiry] Stage: File reception started')

    let formData
    let file
    let category
    try {
      formData = await request.formData()
      file = formData.get('file') as File
      category = formData.get('category') as string | null
      console.log('[Extract-Expiry] File received:', {
        name: file?.name,
        type: file?.type,
        size: file?.size,
      })
    } catch (formError: any) {
      console.error('[Extract-Expiry] File reception error:', formError)
      return NextResponse.json(
        {
          success: false,
          stage: 'file_reception',
          message: 'Failed to receive file',
          rawText: '',
          parsedData: {
            productName: null,
            expiryDate: null,
            manufacturingDate: null,
            batchNumber: null,
            confidenceScore: 0,
            detectedLabels: [],
          },
          processingTime: Date.now() - startTime,
          errors: [formError.message || 'Form data parsing error'],
        },
        { status: 200 }
      )
    }

    if (!file) {
      console.log('[Extract-Expiry] Stage: File reception failed - no file')
      return NextResponse.json(
        {
          success: false,
          stage: 'file_reception',
          message: 'No file provided',
          rawText: '',
          parsedData: {
            productName: null,
            expiryDate: null,
            manufacturingDate: null,
            batchNumber: null,
            confidenceScore: 0,
            detectedLabels: [],
          },
          processingTime: Date.now() - startTime,
          errors: ['No file provided in request'],
        },
        { status: 200 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      console.log('[Extract-Expiry] Stage: File validation failed - unsupported type')
      return NextResponse.json(
        {
          success: false,
          stage: 'file_reception',
          message: `Unsupported file type: ${file.type}`,
          rawText: '',
          parsedData: {
            productName: null,
            expiryDate: null,
            manufacturingDate: null,
            batchNumber: null,
            confidenceScore: 0,
            detectedLabels: [],
          },
          processingTime: Date.now() - startTime,
          errors: [`Unsupported file type: ${file.type}. Supported: JPG, PNG, WEBP, PDF`],
        },
        { status: 200 }
      )
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      console.log('[Extract-Expiry] Stage: File validation failed - too large')
      return NextResponse.json(
        {
          success: false,
          stage: 'file_reception',
          message: 'File too large',
          rawText: '',
          parsedData: {
            productName: null,
            expiryDate: null,
            manufacturingDate: null,
            batchNumber: null,
            confidenceScore: 0,
            detectedLabels: [],
          },
          processingTime: Date.now() - startTime,
          errors: [`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`],
        },
        { status: 200 }
      )
    }

    console.log(
      `[Extract-Expiry] Stage: File reception completed - ${file.type}: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`
    )

    // Stage: Preprocessing
    currentStage = 'preprocessing'
    console.log('[Extract-Expiry] Stage: Preprocessing started')

    // Stage: OCR
    currentStage = 'ocr'
    console.log('[Extract-Expiry] Stage: OCR started')
    console.log('[Extract-Expiry] OCR Provider:', OCR_PROVIDER)

    try {
      const ocrStartTime = Date.now()

      // Choose OCR provider based on configuration
      let ocrPromise: Promise<{
        rawText: string
        confidence: number
        imageType?: 'handwritten' | 'printed'
      }>

      if (OCR_PROVIDER === 'mlkit' && isMLKitConfigured()) {
        // Use Google ML Kit (Cloud Vision API)
        console.log('[Extract-Expiry] Using Google ML Kit OCR')
        ocrPromise = runOCRWithMLKit(file)
      } else {
        // Use Tesseract (default)
        if (OCR_PROVIDER === 'mlkit' && !isMLKitConfigured()) {
          console.warn('[Extract-Expiry] ML Kit requested but not configured, falling back to Tesseract')
        }
        console.log('[Extract-Expiry] Using Tesseract OCR')
        ocrPromise = runOCR(file)
      }

      // Create timeout promise for OCR
      const ocrTimeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`OCR processing timeout after ${OCR_TIMEOUT / 1000} seconds`)),
          OCR_TIMEOUT
        )
      )

      let ocrResult
      try {
        ocrResult = await Promise.race([ocrPromise, ocrTimeoutPromise])
      } catch (timeoutError: any) {
        // Handle timeout specifically with better error message
        if (timeoutError.message?.includes('timeout')) {
          console.error('[Extract-Expiry] OCR timeout occurred:', {
            timeout: `${OCR_TIMEOUT / 1000}s`,
            fileType: file.type,
            fileSize: `${(file.size / 1024).toFixed(2)}KB`,
            fileName: file.name,
          })
          throw new Error(`OCR processing timed out after ${OCR_TIMEOUT / 1000} seconds. The image may be too large or complex. Please try a smaller image or crop the relevant area.`)
        }
        throw timeoutError
      }
      
      rawText = ocrResult.rawText
      ocrConfidence = ocrResult.confidence || 0
      imageType = ocrResult.imageType

      const ocrTime = Date.now() - ocrStartTime
      console.log('[Extract-Expiry] Stage: OCR completed', {
        time: `${ocrTime}ms`,
        textLength: rawText.length,
        confidence: `${ocrConfidence}%`,
        imageType: imageType || 'unknown',
      })

      // Log OCR accuracy metrics
      logOCRMetrics({
        fileType: file.type,
        fileSize: file.size,
        textLength: rawText.length,
        confidence: ocrConfidence,
        processingTime: ocrTime,
      })
    } catch (ocrError: any) {
      // Check if it's a timeout error (hard 8-second timeout)
      const isTimeout = ocrError.message?.includes('timeout') || ocrError.message === 'OCR timeout'
      const errorMsg = isTimeout 
        ? 'OCR timeout' 
        : `OCR failed: ${ocrError.message}`
      
      console.error('[Extract-Expiry] Stage: OCR failed', {
        error: errorMsg,
        stage: currentStage,
        isTimeout: isTimeout,
      })
      errors.push(errorMsg)

      // CRITICAL UX: If OCR times out, return requiresCrop flag
      // Frontend will prompt user to crop expiry/warranty area
      // Cropped OCR will be fast (<3s) since it's a smaller region
      if (isTimeout) {
        console.log('[Extract-Expiry] OCR timeout - requesting crop from user')
      }

      // Return HTTP 200 with error details (as per requirements)
      return NextResponse.json(
        {
          success: false,
          stage: 'ocr',
          message: isTimeout ? 'OCR timeout' : 'OCR failed',
          rawText: '',
          parsedData: {
            productName: null,
            expiryDate: null,
            manufacturingDate: null,
            batchNumber: null,
            confidenceScore: 0,
            detectedLabels: [],
          },
          ocrConfidence: 0,
          processingTime: Date.now() - startTime,
          errors: [errorMsg],
          requiresCrop: isTimeout, // CRITICAL: Frontend will show crop prompt
        },
        { status: 200 }
      )
    }

    // Stage: AI Parsing
    currentStage = 'ai_parsing'
    console.log('[Extract-Expiry] Stage: AI parsing started')

    // Use specialized handwriting expiry extraction for handwritten images
    if (rawText.trim().length > 0) {
      try {
        const aiStartTime = Date.now()

        if (imageType === 'handwritten') {
          // Use specialized handwriting expiry extraction
          console.log('[Extract-Expiry] Using handwriting expiry extraction')
          
          const handwritingPromise = extractHandwritingExpiry(rawText.trim(), 'openai')
          const handwritingTimeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Handwriting expiry extraction timeout')),
              AI_PARSE_TIMEOUT
            )
          )

          const handwritingResult = await Promise.race([handwritingPromise, handwritingTimeoutPromise])

          // Convert handwriting result to ExpiryDataOutput format
          parsedData = {
            productName: null,
            expiryDate: handwritingResult.expiryDate,
            manufacturingDate: null,
            batchNumber: null,
            confidenceScore: handwritingResult.reasoningConfidence,
            detectedLabels: [],
          }

          const aiTime = Date.now() - aiStartTime
          console.log('[Extract-Expiry] Handwriting expiry extraction completed', {
            time: `${aiTime}ms`,
            confidence: `${parsedData.confidenceScore}%`,
            expiryDate: parsedData.expiryDate || 'none',
          })
        } else {
          // Use standard AI parsing for printed text
          console.log('[Extract-Expiry] Using standard AI parsing')

          const aiPromise = parseExpiryData({
            rawText: rawText.trim(),
            category:
              category &&
              ['medicine', 'food', 'warranty', 'insurance', 'subscription'].includes(
                category
              )
                ? (category as any)
                : undefined,
          })
          const aiTimeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('AI parsing timeout')),
              AI_PARSE_TIMEOUT
            )
          )

          parsedData = await Promise.race([aiPromise, aiTimeoutPromise])

          const aiTime = Date.now() - aiStartTime
          console.log('[Extract-Expiry] AI parsing completed', {
            time: `${aiTime}ms`,
            confidence: `${parsedData.confidenceScore}%`,
            productName: parsedData.productName ? 'yes' : 'no',
            expiryDate: parsedData.expiryDate || 'no',
            manufacturingDate: parsedData.manufacturingDate || 'no',
            batchNumber: parsedData.batchNumber || 'no',
            labels: parsedData.detectedLabels,
          })
        }
      } catch (aiError: any) {
        const errorMsg = `AI parsing failed: ${aiError.message}`
        console.warn('[Extract-Expiry] Stage: AI parsing failed', {
          error: errorMsg,
          stage: currentStage,
        })
        errors.push(errorMsg)

        // Fallback: Continue with raw OCR only (parsedData will be null)
        parsedData = null
      }
    } else {
      console.warn('[Extract-Expiry] Stage: AI parsing skipped - no text extracted')
      errors.push('No text extracted from OCR')
    }

    // Build response
    const processingTime = Date.now() - startTime
    const response: ExtractExpiryResponse = {
      success: true,
      rawText,
      parsedData: parsedData || {
        productName: null,
        expiryDate: null,
        manufacturingDate: null,
        batchNumber: null,
        confidenceScore: 0,
        detectedLabels: [],
      },
      ocrConfidence,
      imageType,
      processingTime,
    }

    // Add errors if any (but still return success if we have rawText)
    if (errors.length > 0) {
      response.errors = errors
    }

    console.log('[Extract-Expiry] Stage: Completed', {
      time: `${processingTime}ms`,
      success: response.success,
      hasParsedData: !!parsedData,
      hasErrors: errors.length > 0,
    })

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    // Catch-all for any unexpected errors
    const processingTime = Date.now() - startTime
    const errorMessage = error?.message || 'Unknown error'
    const errorStack = error?.stack || 'No stack trace'

    console.error('[Extract-Expiry] Unexpected error', {
      stage: currentStage,
      error: errorMessage,
      stack: errorStack,
      time: `${processingTime}ms`,
    })

    // Always return JSON with HTTP 200
    const errorResponse: ExtractExpiryResponse = {
      success: false,
      stage: currentStage,
      message: 'Processing failed',
      rawText: rawText || '',
      parsedData: {
        productName: null,
        expiryDate: null,
        manufacturingDate: null,
        batchNumber: null,
        confidenceScore: 0,
        detectedLabels: [],
      },
      ocrConfidence: ocrConfidence || 0,
      imageType,
      processingTime,
      errors: [errorMessage],
    }

    return NextResponse.json(errorResponse, { status: 200 })
  }
}

/**
 * Run OCR on uploaded file using Google ML Kit (Cloud Vision API)
 * Extracts raw text only, preserves line breaks
 */
async function runOCRWithMLKit(file: File): Promise<{
  rawText: string
  confidence: number
  imageType?: 'handwritten' | 'printed'
}> {
  try {
    // Detect handwriting if it's an image (not PDF)
    let imageType: 'handwritten' | 'printed' | undefined
    if (file.type !== 'application/pdf') {
      try {
        const { detectHandwriting } = await import('@/lib/ocr/handwriting-detection')
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const handwritingResult = await detectHandwriting(buffer)
        imageType = handwritingResult.imageType
        console.log('[ML Kit OCR] Handwriting detection:', {
          type: imageType,
          confidence: `${handwritingResult.confidence}%`,
        })
      } catch (detectionError: any) {
        // Continue without image type - not critical
        console.warn('[ML Kit OCR] Handwriting detection failed:', detectionError.message)
      }
    }

    // Extract text using ML Kit
    const result = await extractTextWithMLKit(file)

    return {
      rawText: result.rawText,
      confidence: result.confidence,
      imageType,
    }
  } catch (error: any) {
    throw new Error(`ML Kit OCR failed: ${error.message}`)
  }
}

/**
 * Run OCR on uploaded file using dedicated OCR worker script
 * Spawns worker process instead of running Tesseract directly
 */
async function runOCR(file: File): Promise<{
  rawText: string
  confidence: number
  imageType?: 'handwritten' | 'printed'
}> {
  let tempFilePath: string | null = null
  
  try {
    // Import utilities for preprocessing and handwriting detection
    // Dynamic imports for optional dependencies (with error handling)
    // @ts-ignore - pdf-converter is optional dependency
    const { convertPdfToImage } = await import('@/lib/ocr/pdf-converter')
    // @ts-ignore - handwriting-detection is optional
    const { detectHandwriting } = await import('@/lib/ocr/handwriting-detection')
    const sharp = (await import('sharp')).default

    const isPdf = file.type === 'application/pdf'
    const originalFileSize = file.size
    
    console.log('[Extract-Expiry] Original file size:', {
      size: `${(originalFileSize / 1024).toFixed(2)}KB`,
      type: file.type,
    })

    // Step 1: Convert uploaded file to Buffer explicitly
    let arrayBuffer: ArrayBuffer
    let originalBuffer: Buffer

    try {
      arrayBuffer = await file.arrayBuffer()
      originalBuffer = Buffer.from(arrayBuffer)
      console.log('[Extract-Expiry] File converted to buffer:', {
        size: `${(originalBuffer.length / 1024).toFixed(2)}KB`,
      })
    } catch (bufferError: any) {
      throw new Error(`Failed to read file buffer: ${bufferError.message}`)
    }

    // Step 2: Handle PDF files (convert to image)
    let imageBuffer: Buffer
    if (isPdf) {
      try {
        imageBuffer = await convertPdfToImage(originalBuffer)
        console.log('[Extract-Expiry] PDF converted to image:', {
          size: `${(imageBuffer.length / 1024).toFixed(2)}KB`,
        })
      } catch (pdfError: any) {
        throw new Error(`PDF conversion failed: ${pdfError.message}`)
      }
    } else {
      imageBuffer = originalBuffer
    }

    // Step 3: Detect handwriting BEFORE preprocessing (on original image)
    let imageType: 'handwritten' | 'printed' | undefined
    try {
      const handwritingResult = await detectHandwriting(imageBuffer)
      imageType = handwritingResult.imageType
      console.log('[Extract-Expiry] Handwriting detection:', {
        type: imageType,
        confidence: `${handwritingResult.confidence}%`,
      })
    } catch (detectionError: any) {
      // Continue without image type - not critical
      console.warn('[Extract-Expiry] Handwriting detection failed:', detectionError.message)
    }

    // Step 4: Aggressively downscale image before OCR (MOST IMPORTANT for performance)
    // This prevents OCR timeout by reducing image size significantly
    let processedBuffer: Buffer
    let sharpProcessingFailed = false
    let originalDimensions: { width: number; height: number } | null = null
    let resizedDimensions: { width: number; height: number } | null = null
    
    try {
      // Get original image dimensions first
      try {
        const originalMetadata = await sharp(imageBuffer).metadata()
        originalDimensions = {
          width: originalMetadata.width || 0,
          height: originalMetadata.height || 0,
        }
        console.log('[Extract-Expiry] Original image dimensions:', originalDimensions)
      } catch (metadataError: any) {
        console.warn('[Extract-Expiry] Failed to get original dimensions:', metadataError.message)
      }

      // Wrap sharp() call in try/catch to handle initialization errors
      let pipeline
      try {
        pipeline = sharp(imageBuffer)
      } catch (sharpInitError: any) {
        console.error('[Extract-Expiry] Sharp initialization failed:', {
          error: sharpInitError.message,
          stack: sharpInitError.stack,
        })
        throw sharpInitError
      }

      // CRITICAL: Aggressively downscale to max 1600px width (maintains aspect ratio)
      // This is the MOST IMPORTANT step to prevent OCR timeout
      const MAX_WIDTH = 1600
      try {
        pipeline = pipeline.resize(MAX_WIDTH, null, {
          fit: 'inside',
          withoutEnlargement: true, // Don't upscale small images
        })
        console.log('[Extract-Expiry] Image will be resized to max width:', MAX_WIDTH, 'px (maintaining aspect ratio)')
      } catch (resizeError: any) {
        console.warn('[Extract-Expiry] Sharp resize failed, continuing without resize:', resizeError.message)
        // Continue without resize
      }

      try {
        // Convert to grayscale (reduces data size, improves OCR)
        pipeline = pipeline.greyscale()
      } catch (grayscaleError: any) {
        console.warn('[Extract-Expiry] Sharp grayscale conversion failed, continuing:', grayscaleError.message)
        // Continue without grayscale conversion
      }

      try {
        // Remove alpha channel (ensure RGB, not RGBA - reduces size)
        pipeline = pipeline.removeAlpha()
      } catch (alphaError: any) {
        console.warn('[Extract-Expiry] Sharp alpha removal failed, continuing:', alphaError.message)
        // Continue without alpha removal
      }

      try {
        // Normalize contrast (improves OCR accuracy)
        pipeline = pipeline.normalize()
      } catch (normalizeError: any) {
        console.warn('[Extract-Expiry] Sharp normalization failed, continuing:', normalizeError.message)
        // Continue without normalization
      }

      try {
        // Convert to PNG format (Tesseract works best with PNG)
        processedBuffer = await pipeline.png().toBuffer()
        
        // Get resized dimensions
        try {
          const resizedMetadata = await sharp(processedBuffer).metadata()
          resizedDimensions = {
            width: resizedMetadata.width || 0,
            height: resizedMetadata.height || 0,
          }
        } catch (resizedMetadataError: any) {
          console.warn('[Extract-Expiry] Failed to get resized dimensions:', resizedMetadataError.message)
        }
        
        console.log('[Extract-Expiry] Image aggressively downscaled and processed:', {
          originalDimensions: originalDimensions || 'unknown',
          resizedDimensions: resizedDimensions || 'unknown',
          originalSize: `${(imageBuffer.length / 1024).toFixed(2)}KB`,
          processedSize: `${(processedBuffer.length / 1024).toFixed(2)}KB`,
          sizeReduction: originalDimensions && resizedDimensions
            ? `${(((1 - (resizedDimensions.width * resizedDimensions.height) / (originalDimensions.width * originalDimensions.height)) * 100).toFixed(1))}%`
            : 'unknown',
          format: 'PNG',
          grayscale: true,
          alphaRemoved: true,
        })
      } catch (pngError: any) {
        console.error('[Extract-Expiry] Sharp PNG conversion failed:', {
          error: pngError.message,
          stack: pngError.stack,
        })
        throw pngError
      }
    } catch (processError: any) {
      // Log error but don't crash - fallback to original buffer
      console.error('[Extract-Expiry] Sharp processing failed, using original buffer:', {
        error: processError.message,
        errorType: processError.constructor?.name || 'Unknown',
        stack: processError.stack,
      })
      
      sharpProcessingFailed = true
      
      // Fallback: Use original image buffer
      processedBuffer = imageBuffer
      
      console.log('[Extract-Expiry] Using original buffer as fallback:', {
        size: `${(processedBuffer.length / 1024).toFixed(2)}KB`,
        reason: 'Sharp processing failed',
      })
    }

    // Step 5: Validate processed buffer
    if (!processedBuffer || processedBuffer.length === 0) {
      console.error('[Extract-Expiry] Processed buffer is empty, using original buffer')
      
      // Final fallback: Use original buffer if processed is empty
      if (imageBuffer && imageBuffer.length > 0) {
        processedBuffer = imageBuffer
        console.log('[Extract-Expiry] Using original buffer as final fallback:', {
          size: `${(processedBuffer.length / 1024).toFixed(2)}KB`,
        })
      } else {
        throw new Error('Both processed and original image buffers are empty - cannot proceed with OCR')
      }
    }

    // Step 6: Save processed image to /tmp and spawn OCR worker
    try {
      // Generate unique temp file path
      const tempFileName = `ocr-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      tempFilePath = join(tmpdir(), tempFileName)
      
      console.log('[Extract-Expiry] Saving processed image to temp file:', tempFilePath)
      
      // Save processed buffer to temp file
      await writeFile(tempFilePath, processedBuffer)
      
      console.log('[Extract-Expiry] Temp file saved, spawning OCR worker...')
      
      // Spawn OCR worker process
      const workerScriptPath = join(process.cwd(), 'ocr', 'worker.js')
      const HARD_TIMEOUT = 8000 // 8 seconds
      
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('OCR processing timeout'))
        }, HARD_TIMEOUT)
      })
      
      // Create execFile promise with timeout
      const execPromise = execFileAsync('node', [workerScriptPath, tempFilePath], {
        timeout: HARD_TIMEOUT,
        maxBuffer: 10 * 1024 * 1024, // 10MB max output
        killSignal: 'SIGKILL', // Force kill on timeout
      })
      
      // Race between execution and timeout
      let execResult
      try {
        execResult = await Promise.race([execPromise, timeoutPromise])
      } catch (raceError: any) {
        // Check if it's a timeout
        if (raceError.message?.includes('timeout') || raceError.code === 'ETIMEDOUT') {
          console.error('[Extract-Expiry] OCR worker timeout after 8 seconds')
          throw new Error('OCR timeout')
        }
        throw raceError
      }
      
      // Capture stdout as OCR text
      const rawText = execResult.stdout.trim()
      
      console.log('[Extract-Expiry] OCR worker completed:', {
        textLength: rawText.length,
        stderr: execResult.stderr ? execResult.stderr.substring(0, 200) : 'none',
      })
      
      // Calculate confidence (simplified - worker doesn't return confidence)
      // Use a default confidence based on text length
      const confidence = rawText.length > 0 ? 70 : 0
      
      return {
        rawText,
        confidence,
        imageType: imageType,
      }
    } catch (ocrError: any) {
      // Check if it's a timeout
      if (ocrError.message?.includes('timeout') || ocrError.message === 'OCR timeout') {
        throw new Error('OCR timeout')
      }
      
      // Check if process was killed
      if (ocrError.signal === 'SIGKILL') {
        throw new Error('OCR timeout')
      }
      
      throw new Error(`OCR worker failed: ${ocrError.message}`)
    } finally {
      // Clean up temp file
      if (tempFilePath) {
        try {
          await unlink(tempFilePath)
          console.log('[Extract-Expiry] Temp file cleaned up:', tempFilePath)
        } catch (cleanupError: any) {
          console.warn('[Extract-Expiry] Failed to clean up temp file:', cleanupError.message)
        }
      }
    }
  } catch (error: any) {
    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath).catch(() => {})
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
    
    // Re-throw with context, but this will be caught by the caller
    throw new Error(`OCR processing failed: ${error.message}`)
  }
}

/**
 * Log OCR metrics for accuracy improvement
 */
function logOCRMetrics(metrics: {
  fileType: string
  fileSize: number
  textLength: number
  confidence: number
  processingTime: number
}) {
  // Log structured metrics for analysis
  console.log('[OCR Metrics]', {
    fileType: metrics.fileType,
    fileSizeKB: Math.round(metrics.fileSize / 1024),
    textLength: metrics.textLength,
    confidence: metrics.confidence,
    processingTimeMs: metrics.processingTime,
    timestamp: new Date().toISOString(),
  })

  // Log warnings for low confidence
  if (metrics.confidence < 50) {
    console.warn(
      `[OCR Metrics] Low confidence detected: ${metrics.confidence}% - File type: ${metrics.fileType}`
    )
  }

  // Log warnings for long processing time
  if (metrics.processingTime > 20000) {
    console.warn(
      `[OCR Metrics] Slow processing: ${metrics.processingTime}ms - File size: ${Math.round(metrics.fileSize / 1024)}KB`
    )
  }

  // Log warnings for empty text
  if (metrics.textLength === 0 && metrics.confidence > 0) {
    console.warn(
      `[OCR Metrics] Empty text with confidence ${metrics.confidence}% - Possible OCR issue`
    )
  }
}
