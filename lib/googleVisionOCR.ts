// Google Cloud Vision OCR Service
// Production-ready OCR using Google Cloud Vision API
// Enhanced with preprocessing and better configuration

import { ImageAnnotatorClient } from '@google-cloud/vision'
import { readFileSync } from 'fs'
import { join } from 'path'
import { preprocessImageForOCR } from './ocr/imagePreprocessing'
import { normalizeOcrText } from './ocr/textNormalization'

let client: ImageAnnotatorClient | null = null

/**
 * Initialize Google Vision client
 * Uses service account credentials from config/gcp-vision.json
 */
function getVisionClient(): ImageAnnotatorClient {
  if (client) {
    return client
  }

  try {
    // Load credentials from config file
    const credentialsPath = join(process.cwd(), 'config', 'gcp-vision.json')
    const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8'))

    client = new ImageAnnotatorClient({
      credentials,
    })

    console.log('[Google Vision] Client initialized successfully')
    return client
  } catch (error: any) {
    console.error('[Google Vision] Failed to initialize client:', error.message)
    throw new Error('Google Vision API not configured. Please ensure config/gcp-vision.json exists.')
  }
}

/**
 * Extract text from image using Google Cloud Vision API
 * Enhanced with preprocessing and DOCUMENT_TEXT_DETECTION
 * 
 * @param imageBuffer - Image file as Buffer
 * @param preprocess - Whether to preprocess image (default: true)
 * @returns Extracted and normalized text string
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  preprocess: boolean = true
): Promise<string> {
  try {
    const visionClient = getVisionClient()

    // Step 1: Preprocess image for better OCR accuracy
    let processedBuffer = imageBuffer
    if (preprocess) {
      processedBuffer = await preprocessImageForOCR(imageBuffer, {
        maxDimension: 2000,
        autoRotate: true,
        grayscale: true,
        contrast: 1.2,
        sharpen: true,
      })
    }

    // Step 2: Use DOCUMENT_TEXT_DETECTION (better for documents) with language hints
    const [result] = await visionClient.documentTextDetection({
      image: {
        content: processedBuffer,
      },
      imageContext: {
        languageHints: ['en'], // English language hint for better accuracy
      },
    })

    // Extract full text annotation
    const fullTextAnnotation = result.fullTextAnnotation

    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      console.warn('[Google Vision] No text detected in image')
      return ''
    }

    // Step 3: Normalize text (fix OCR errors, remove noise)
    const rawText = fullTextAnnotation.text
    const normalizedText = normalizeOcrText(rawText)

    console.log('[Google Vision] Text extracted and normalized', {
      rawLength: rawText.length,
      normalizedLength: normalizedText.length,
    })
    
    return normalizedText
  } catch (error: any) {
    console.error('[Google Vision] OCR failed:', error.message)
    throw new Error(`OCR failed: ${error.message}`)
  }
}

/**
 * Calculate confidence level based on extracted text and expiry detection
 * Enhanced with expiry detection results
 * 
 * @param text - Extracted OCR text
 * @param expiryDetectionResult - Optional expiry detection result
 * @returns Confidence level: "HIGH" | "MEDIUM" | "LOW" and numeric score (0-100)
 */
export function calculateConfidence(
  text: string,
  expiryDetectionResult?: { confidence: number; sourceKeyword: string | null }
): { level: 'HIGH' | 'MEDIUM' | 'LOW'; score: number } {
  if (!text || text.trim().length < 20) {
    return { level: 'LOW', score: 0 }
  }

  const lowerText = text.toLowerCase()
  
  // Check for expiry-related keywords (high confidence indicators)
  const expiryKeywords = [
    'expiry',
    'exp',
    'valid till',
    'valid until',
    'warranty',
    'best before',
    'use before',
    'manufacturing',
    'mfg',
  ]

  const hasKeywords = expiryKeywords.some(keyword => lowerText.includes(keyword))
  
  // Check for date patterns
  const datePatterns = [
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/, // DD/MM/YYYY or MM/YYYY
    /\d{1,2}\s+[a-z]{3,9}\s+\d{4}/i, // DD MMM YYYY
    /[a-z]{3,9}\s+\d{4}/i, // MMM YYYY
  ]

  const hasDatePattern = datePatterns.some(pattern => pattern.test(text))

  // Use expiry detection confidence if available
  let confidenceScore = 0
  if (expiryDetectionResult) {
    confidenceScore = expiryDetectionResult.confidence
    // Boost if keyword was found
    if (expiryDetectionResult.sourceKeyword) {
      confidenceScore = Math.min(100, confidenceScore + 5)
    }
  } else {
    // Calculate base confidence
    if (hasKeywords && hasDatePattern) {
      confidenceScore = 80
    } else if (hasKeywords || hasDatePattern) {
      confidenceScore = 60
    } else {
      confidenceScore = 30
    }
  }

  // Determine level
  let level: 'HIGH' | 'MEDIUM' | 'LOW'
  if (confidenceScore >= 70) {
    level = 'HIGH'
  } else if (confidenceScore >= 40) {
    level = 'MEDIUM'
  } else {
    level = 'LOW'
  }

  return { level, score: confidenceScore }
}

