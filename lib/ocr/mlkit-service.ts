// Google ML Kit OCR Service (using Google Cloud Vision API)
// Extracts raw text from images and PDFs
// Supports both printed and handwritten text
// Preserves line breaks

import { ImageAnnotatorClient } from '@google-cloud/vision'
import type { OCRResponse } from './types'
import sharp from 'sharp'

// Initialize Google Cloud Vision client
let visionClient: ImageAnnotatorClient | null = null

/**
 * Initialize Google Cloud Vision client
 * Uses service account credentials from environment variable
 */
function getVisionClient(): ImageAnnotatorClient {
  if (visionClient) {
    return visionClient
  }

  const credentialsPath = process.env.GOOGLE_CLOUD_CREDENTIALS_PATH
  const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON

  if (!credentialsPath && !credentialsJson) {
    throw new Error(
      'Google Cloud credentials not configured. Set GOOGLE_CLOUD_CREDENTIALS_PATH or GOOGLE_CLOUD_CREDENTIALS_JSON'
    )
  }

  try {
    if (credentialsPath) {
      // Use credentials file path
      visionClient = new ImageAnnotatorClient({
        keyFilename: credentialsPath,
      })
    } else if (credentialsJson) {
      // Use credentials JSON string
      const credentials = JSON.parse(credentialsJson)
      visionClient = new ImageAnnotatorClient({
        credentials,
      })
    }

    return visionClient!
  } catch (error: any) {
    throw new Error(`Failed to initialize Google Cloud Vision client: ${error.message}`)
  }
}

/**
 * Preprocess image for OCR
 * - Convert to PNG if needed
 * - Resize if too large (max 20MB for Vision API)
 * - Maintain aspect ratio
 */
async function preprocessImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata()
    
    // Check file size (Vision API limit is 20MB)
    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    
    if (imageBuffer.length > MAX_SIZE) {
      // Resize to reduce file size while maintaining aspect ratio
      // Target: ~15MB to leave buffer
      const targetSize = 15 * 1024 * 1024
      const scaleFactor = Math.sqrt(targetSize / imageBuffer.length)
      
      const newWidth = Math.floor((metadata.width || 1600) * scaleFactor)
      const newHeight = Math.floor((metadata.height || 1600) * scaleFactor)
      
      console.log(`[ML Kit OCR] Resizing image: ${metadata.width}x${metadata.height} → ${newWidth}x${newHeight}`)
      
      return await sharp(imageBuffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer()
    }
    
    // Convert to PNG if not already
    if (metadata.format !== 'png') {
      return await sharp(imageBuffer).png().toBuffer()
    }
    
    return imageBuffer
  } catch (error: any) {
    console.warn('[ML Kit OCR] Image preprocessing failed, using original:', error.message)
    return imageBuffer
  }
}

/**
 * Extract text from image using Google Cloud Vision API
 * 
 * @param imageBuffer - Image buffer (PNG, JPEG, etc.)
 * @returns Raw text with line breaks preserved
 */
async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  const client = getVisionClient()
  
  try {
    // Perform text detection
    const [result] = await client.textDetection({
      image: { content: imageBuffer },
    })

    // Extract text from all detected text annotations
    const detections = result.textAnnotations || []
    
    if (detections.length === 0) {
      return ''
    }

    // The first annotation contains the full text with line breaks
    const fullTextAnnotation = detections[0]
    const rawText = fullTextAnnotation.description || ''

    // Preserve line breaks (they're already in the text)
    return rawText.trim()
  } catch (error: any) {
    throw new Error(`Google Cloud Vision OCR failed: ${error.message}`)
  }
}

/**
 * Extract text from PDF using Google Cloud Vision API
 * Uses documentTextDetection for better PDF handling
 * 
 * @param pdfBuffer - PDF buffer
 * @returns Raw text with line breaks preserved (from all pages)
 */
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  const client = getVisionClient()
  
  try {
    // Use documentTextDetection for PDFs (better for multi-page documents)
    const [result] = await client.documentTextDetection({
      image: { content: pdfBuffer },
    })

    // Extract full text annotation
    const fullTextAnnotation = result.fullTextAnnotation
    
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      return ''
    }

    // Return text with line breaks preserved
    return fullTextAnnotation.text.trim()
  } catch (error: any) {
    // Fallback: try regular text detection if documentTextDetection fails
    console.warn('[ML Kit OCR] Document text detection failed, trying regular text detection:', error.message)
    try {
      return await extractTextFromImage(pdfBuffer)
    } catch (fallbackError: any) {
      throw new Error(`PDF OCR failed: ${fallbackError.message}`)
    }
  }
}

/**
 * Main ML Kit OCR function
 * Extracts raw text from images or PDFs
 * 
 * @param file - File object (image or PDF)
 * @returns OCR response with raw text
 */
export async function extractTextWithMLKit(file: File): Promise<OCRResponse> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let rawText = ''

    // Handle PDF files
    if (file.type === 'application/pdf') {
      console.log('[ML Kit OCR] Processing PDF file')
      rawText = await extractTextFromPDF(buffer)
    } else {
      // Handle image files
      console.log('[ML Kit OCR] Processing image file:', file.type)
      
      // Preprocess image
      const processedBuffer = await preprocessImageForOCR(buffer)
      
      // Extract text
      rawText = await extractTextFromImage(processedBuffer)
    }

    // ML Kit doesn't provide confidence scores in the same way
    // We'll use a default confidence or calculate based on text length
    const confidence = rawText.length > 0 ? 85 : 0

    console.log(`[ML Kit OCR] Extracted ${rawText.length} characters`)

    return {
      rawText,
      confidence,
    }
  } catch (error: any) {
    throw new Error(`ML Kit OCR processing failed: ${error.message}`)
  }
}

/**
 * Check if Google Cloud Vision is configured
 */
export function isMLKitConfigured(): boolean {
  try {
    const credentialsPath = process.env.GOOGLE_CLOUD_CREDENTIALS_PATH
    const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS_JSON
    return !!(credentialsPath || credentialsJson)
  } catch {
    return false
  }
}

