// Tesseract OCR service wrapper
import type { OCRResponse } from './types'
import { detectHandwriting } from './handwriting-detection'
import { runHandwritingOCR } from './handwriting-ocr'

/**
 * Extract text from image using Tesseract.js
 * Returns raw text, confidence score, and image type
 * 
 * If imageType is "handwritten", uses optimized handwriting pipeline
 * 
 * @param imageInput - Can be Buffer, data URL string, or file path
 * @param timeout - Timeout in milliseconds
 * @param imageBuffer - Optional original buffer for handwriting detection
 * @param imageType - Pre-detected image type
 */
export async function extractTextFromImage(
  imageInput: Buffer | string, // Accept Buffer or data URL
  timeout: number = 60000, // Default 60 seconds (increased for reliability)
  imageBuffer?: Buffer, // Optional buffer for handwriting detection
  imageType?: 'handwritten' | 'printed' // Pre-detected image type
): Promise<OCRResponse> {
  // If handwritten, use optimized pipeline
  if (imageType === 'handwritten' && imageBuffer) {
    console.log('[OCR] Using handwriting-optimized pipeline...')
    try {
      const handwritingResult = await runHandwritingOCR(imageBuffer, timeout)
      
      return {
        rawText: handwritingResult.rawText,
        confidence: handwritingResult.averageConfidence,
        imageType: 'handwritten',
      }
    } catch (error: any) {
      console.error('[OCR] Handwriting pipeline failed, falling back to standard OCR:', error)
      // Fall through to standard OCR
    }
  }

  // Standard OCR for printed text or fallback
  const { createWorker } = await import('tesseract.js')

  // Declare worker outside try block for proper cleanup in finally
  let worker: any = null
  let workerTerminated = false

  try {
    // STEP 1: Create worker explicitly
    console.log('[OCR] Creating Tesseract worker...')
    worker = await createWorker('eng', 1, {
      logger: (m: any) => {
        // Log progress for debugging
        if (m.status === 'recognizing text') {
          const progress = Math.round(m.progress * 100)
          console.log(`[OCR] Progress: ${progress}%`)
        }
      },
    })
    console.log('[OCR] Worker created successfully')

    // STEP 2: Language is loaded automatically by createWorker('eng', ...)
    // No need to explicitly load language - it's already loaded

    // STEP 3: Set OCR parameters optimized for SPEED (not accuracy)
    // Goal: Extract readable text fast, not perfect accuracy
    await worker.setParameters({
      // Core settings (required)
      tessedit_pageseg_mode: '6', // Uniform block of text (fast)
      tessedit_ocr_engine_mode: '1', // LSTM engine (fastest)
      
      // SPEED OPTIMIZATION: Disable dictionary/DAWG loading (saves time)
      load_system_dawg: '0', // Disable system dictionary
      load_freq_dawg: '0', // Disable frequent words dictionary
      load_punc_dawg: '0', // Disable punctuation dictionary
      load_number_dawg: '0', // Disable number dictionary
      load_unambig_dawg: '0', // Disable unambiguous dictionary
      load_bigram_dawg: '0', // Disable bigram dictionary
      load_fixed_length_dawgs: '0', // Disable fixed-length dictionaries
      
      // SPEED OPTIMIZATION: Disable learning and accuracy features
      classify_enable_learning: '0', // Disable learning (saves time)
      tessedit_do_invert: '0', // Disable inversion (saves time)
      
      // SPEED OPTIMIZATION: Reduce processing overhead
      textord_min_linesize: '2.5', // Minimum line size (faster processing)
      classify_bln_numeric_mode: '0', // Disable numeric mode (saves time)
    })
    console.log('[OCR] Speed-optimized parameters set (OEM: 1, PSM: 6, dictionaries disabled)')

    // HARD TIMEOUT: OCR must timeout after 8 seconds (prevents hanging)
    // This is a hard limit regardless of the passed timeout parameter
    const HARD_OCR_TIMEOUT = 8000 // 8 seconds
    const recognizePromise = worker.recognize(imageInput)
    
    // Create hard timeout promise that terminates worker on timeout
    let timeoutId: NodeJS.Timeout | null = null
    const hardTimeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(async () => {
        // Terminate worker immediately on timeout
        if (worker && !workerTerminated) {
          try {
            await worker.terminate().catch(() => {})
            workerTerminated = true
            worker = null
            console.error('[OCR] Hard timeout (8s) - Worker terminated')
          } catch (terminateError) {
            console.error('[OCR] Failed to terminate worker on timeout:', terminateError)
            worker = null
          }
        }
        reject(new Error('OCR timeout'))
      }, HARD_OCR_TIMEOUT)
    })

    // Race between recognition and hard timeout
    let result: any
    try {
      result = await Promise.race([recognizePromise, hardTimeoutPromise])
      
      // Clear timeout if recognition completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    } catch (raceError: any) {
      // Clear timeout if it was set
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      // Re-throw error - worker will be terminated in finally block
      throw raceError
    }

    // Calculate average confidence
    const confidence = result.data.confidence || 0

    // Extract raw text
    const rawText = result.data.text || ''

    // STEP 4: Terminate worker after successful OCR
    if (worker && !workerTerminated) {
      try {
        await worker.terminate()
        workerTerminated = true
        worker = null
        console.log('[OCR] Worker terminated after successful OCR')
      } catch (terminateError) {
        console.warn('[OCR] Failed to terminate worker after OCR:', terminateError)
        worker = null
      }
    }

    // Detect handwriting if not already detected (if buffer provided)
    let detectedImageType: 'handwritten' | 'printed' | undefined = imageType
    if (!detectedImageType && imageBuffer) {
      try {
        const handwritingResult = await detectHandwriting(imageBuffer)
        detectedImageType = handwritingResult.imageType
        console.log(`[OCR] Image type detected: ${detectedImageType} (confidence: ${handwritingResult.confidence}%)`)
      } catch (detectionError) {
        console.warn('[OCR] Handwriting detection failed:', detectionError)
        // Continue without image type
      }
    }

    return {
      rawText: rawText.trim(),
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
      imageType: detectedImageType,
    }
  } catch (error: any) {
    // Re-throw after cleanup
    throw error
  } finally {
    // STEP 5: GUARANTEED cleanup - terminate worker in finally block
    // This ensures no zombie workers remain, even if errors occur
    if (worker && !workerTerminated) {
      try {
        await worker.terminate().catch(() => {})
        workerTerminated = true
        console.log('[OCR] Worker terminated in finally block (guaranteed cleanup)')
      } catch (cleanupError) {
        console.error('[OCR] Failed to terminate worker in finally block:', cleanupError)
        // Log but don't throw - we're in cleanup
      } finally {
        worker = null // Clear reference to prevent zombie workers
      }
    }
  }
}


