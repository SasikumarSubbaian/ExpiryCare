// Handwriting-Optimized OCR Pipeline
// Dual-pass OCR with different configurations for handwritten text

import type { OCRResponse } from './types'
import { preprocessForHandwriting, preprocessForHandwritingAlternative } from './handwriting-preprocessing'
import { correctHandwriting } from '@/lib/ai/correctHandwriting'
import { extractHandwritingExpiry } from '@/lib/ai/extractHandwritingExpiry'

export interface HandwritingOCRResult {
  rawText: string
  averageConfidence: number
  passes: Array<{
    psm: string
    confidence: number
    textLength: number
  }>
}

/**
 * Run handwriting-optimized OCR pipeline
 * 
 * 1. Aggressive preprocessing
 * 2. Dual OCR pass with PSM 6 and PSM 11
 * 3. Merge results by confidence
 */
export async function runHandwritingOCR(
  imageBuffer: Buffer,
  timeout: number = 60000 // Default 60 seconds (increased for reliability)
): Promise<HandwritingOCRResult> {
  console.log('[Handwriting OCR] Starting optimized pipeline...')

  const { createWorker } = await import('tesseract.js')
  const passes: HandwritingOCRResult['passes'] = []
  const results: Array<{ text: string; confidence: number; psm: string }> = []

  // Preprocess image aggressively
  const preprocessedBuffer = await preprocessForHandwriting(imageBuffer)
  const base64 = preprocessedBuffer.toString('base64')
  const imageDataUrl = `data:image/png;base64,${base64}`

  // Pass 1: PSM 6 (Uniform block of text)
  // Declare worker outside try block for proper cleanup in finally
  let worker1: any = null
  let worker1Terminated = false
  
  try {
    console.log('[Handwriting OCR] Pass 1: PSM 6 (Uniform block)...')
    
    // STEP 1: Create worker explicitly
    worker1 = await createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`[Handwriting OCR] PSM 6 Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })
    console.log('[Handwriting OCR] Worker1 created')
    
    // STEP 2: Language is loaded automatically by createWorker('eng', ...)

    // STEP 3: Set OCR parameters optimized for SPEED (not accuracy)
    await worker1.setParameters({
      // Core settings (required)
      tessedit_pageseg_mode: '6', // Uniform block (fast)
      tessedit_ocr_engine_mode: '1', // LSTM engine (fastest)
      
      // SPEED OPTIMIZATION: Disable dictionary/DAWG loading (saves time)
      load_system_dawg: '0',
      load_freq_dawg: '0',
      load_punc_dawg: '0',
      load_number_dawg: '0',
      load_unambig_dawg: '0',
      load_bigram_dawg: '0',
      load_fixed_length_dawgs: '0',
      
      // SPEED OPTIMIZATION: Disable learning and accuracy features
      classify_enable_learning: '0',
      tessedit_do_invert: '0',
      
      // SPEED OPTIMIZATION: Reduce processing overhead
      textord_min_linesize: '2.5',
      classify_bln_numeric_mode: '0',
    })
    console.log('[Handwriting OCR] Pass 1: Speed-optimized parameters set')

    // HARD TIMEOUT: 8 seconds per pass (prevents hanging)
    const HARD_OCR_TIMEOUT = 8000 // 8 seconds
    const recognizePromise1 = worker1.recognize(imageDataUrl)
    
    // Create hard timeout promise that terminates worker on timeout
    let timeoutId1: NodeJS.Timeout | null = null
    const hardTimeoutPromise1 = new Promise<never>((_, reject) => {
      timeoutId1 = setTimeout(async () => {
        // Terminate worker immediately on timeout
        if (worker1 && !worker1Terminated) {
          try {
            await worker1.terminate().catch(() => {})
            worker1Terminated = true
            worker1 = null
            console.error('[Handwriting OCR] Pass 1 hard timeout (8s) - Worker terminated')
          } catch (terminateError) {
            console.error('[Handwriting OCR] Failed to terminate worker1 on timeout:', terminateError)
            worker1 = null
          }
        }
        reject(new Error('OCR timeout'))
      }, HARD_OCR_TIMEOUT)
    })

    let result1: any
    try {
      result1 = await Promise.race([recognizePromise1, hardTimeoutPromise1])
      
      // Clear timeout if recognition completed successfully
      if (timeoutId1) {
        clearTimeout(timeoutId1)
        timeoutId1 = null
      }
    } catch (raceError: any) {
      // Clear timeout if it was set
      if (timeoutId1) {
        clearTimeout(timeoutId1)
        timeoutId1 = null
      }
      
      // Re-throw error - worker will be terminated in finally block
      throw raceError
    }
    const confidence1 = result1.data.confidence || 0
    const text1 = result1.data.text || ''

    // STEP 3: Terminate worker after successful OCR
    if (worker1 && !worker1Terminated) {
      try {
        await worker1.terminate()
        worker1Terminated = true
        worker1 = null
        console.log('[Handwriting OCR] Worker1 terminated after successful OCR')
      } catch (terminateError) {
        console.warn('[Handwriting OCR] Failed to terminate worker1 after OCR:', terminateError)
        worker1 = null
      }
    }

    results.push({
      text: text1.trim(),
      confidence: confidence1,
      psm: '6',
    })

    passes.push({
      psm: '6',
      confidence: confidence1,
      textLength: text1.trim().length,
    })

    console.log(`[Handwriting OCR] PSM 6 completed - Confidence: ${confidence1.toFixed(1)}%, Text: ${text1.trim().length} chars`)
  } catch (error: any) {
    console.error('[Handwriting OCR] PSM 6 failed:', error.message)
    passes.push({
      psm: '6',
      confidence: 0,
      textLength: 0,
    })
  } finally {
    // STEP 4: GUARANTEED cleanup - terminate worker1 in finally block
    // This ensures no zombie workers remain, even if errors occur
    if (worker1 && !worker1Terminated) {
      try {
        await worker1.terminate().catch(() => {})
        worker1Terminated = true
        console.log('[Handwriting OCR] Worker1 terminated in finally block (guaranteed cleanup)')
      } catch (cleanupError) {
        console.error('[Handwriting OCR] Failed to terminate worker1 in finally block:', cleanupError)
      } finally {
        worker1 = null // Clear reference to prevent zombie workers
      }
    }
  }

  // Pass 2: PSM 11 (Sparse text) - Different preprocessing
  // Declare worker outside try block for proper cleanup in finally
  let worker2: any = null
  let worker2Terminated = false
  
  try {
    console.log('[Handwriting OCR] Pass 2: PSM 11 (Sparse text)...')
    
    // Use alternative preprocessing for second pass
    const altPreprocessedBuffer = await preprocessForHandwritingAlternative(imageBuffer)
    const altBase64 = altPreprocessedBuffer.toString('base64')
    const altImageDataUrl = `data:image/png;base64,${altBase64}`

    // STEP 1: Create worker explicitly
    worker2 = await createWorker('eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`[Handwriting OCR] PSM 11 Progress: ${Math.round(m.progress * 100)}%`)
        }
      },
    })
    console.log('[Handwriting OCR] Worker2 created')
    
    // STEP 2: Language is loaded automatically by createWorker('eng', ...)

    // STEP 3: Set OCR parameters optimized for SPEED (not accuracy)
    await worker2.setParameters({
      // Core settings (required)
      tessedit_pageseg_mode: '11', // Sparse text (fast)
      tessedit_ocr_engine_mode: '1', // LSTM engine (fastest)
      
      // SPEED OPTIMIZATION: Disable dictionary/DAWG loading (saves time)
      load_system_dawg: '0',
      load_freq_dawg: '0',
      load_punc_dawg: '0',
      load_number_dawg: '0',
      load_unambig_dawg: '0',
      load_bigram_dawg: '0',
      load_fixed_length_dawgs: '0',
      
      // SPEED OPTIMIZATION: Disable learning and accuracy features
      classify_enable_learning: '0',
      tessedit_do_invert: '0',
      
      // SPEED OPTIMIZATION: Reduce processing overhead
      textord_min_linesize: '2.5',
      classify_bln_numeric_mode: '0',
    })
    console.log('[Handwriting OCR] Pass 2: Speed-optimized parameters set')

    // HARD TIMEOUT: 8 seconds per pass (prevents hanging)
    const HARD_OCR_TIMEOUT = 8000 // 8 seconds
    const recognizePromise2 = worker2.recognize(altImageDataUrl)
    
    // Create hard timeout promise that terminates worker on timeout
    let timeoutId2: NodeJS.Timeout | null = null
    const hardTimeoutPromise2 = new Promise<never>((_, reject) => {
      timeoutId2 = setTimeout(async () => {
        // Terminate worker immediately on timeout
        if (worker2 && !worker2Terminated) {
          try {
            await worker2.terminate().catch(() => {})
            worker2Terminated = true
            worker2 = null
            console.error('[Handwriting OCR] Pass 2 hard timeout (8s) - Worker terminated')
          } catch (terminateError) {
            console.error('[Handwriting OCR] Failed to terminate worker2 on timeout:', terminateError)
            worker2 = null
          }
        }
        reject(new Error('OCR timeout'))
      }, HARD_OCR_TIMEOUT)
    })

    let result2: any
    try {
      result2 = await Promise.race([recognizePromise2, hardTimeoutPromise2])
      
      // Clear timeout if recognition completed successfully
      if (timeoutId2) {
        clearTimeout(timeoutId2)
        timeoutId2 = null
      }
    } catch (raceError: any) {
      // Clear timeout if it was set
      if (timeoutId2) {
        clearTimeout(timeoutId2)
        timeoutId2 = null
      }
      
      // Re-throw error - worker will be terminated in finally block
      throw raceError
    }
    const confidence2 = result2.data.confidence || 0
    const text2 = result2.data.text || ''

    // STEP 3: Terminate worker after successful OCR
    if (worker2 && !worker2Terminated) {
      try {
        await worker2.terminate()
        worker2Terminated = true
        worker2 = null
        console.log('[Handwriting OCR] Worker2 terminated after successful OCR')
      } catch (terminateError) {
        console.warn('[Handwriting OCR] Failed to terminate worker2 after OCR:', terminateError)
        worker2 = null
      }
    }

    results.push({
      text: text2.trim(),
      confidence: confidence2,
      psm: '11',
    })

    passes.push({
      psm: '11',
      confidence: confidence2,
      textLength: text2.trim().length,
    })

    console.log(`[Handwriting OCR] PSM 11 completed - Confidence: ${confidence2.toFixed(1)}%, Text: ${text2.trim().length} chars`)
  } catch (error: any) {
    console.error('[Handwriting OCR] PSM 11 failed:', error.message)
    passes.push({
      psm: '11',
      confidence: 0,
      textLength: 0,
    })
  } finally {
    // STEP 4: GUARANTEED cleanup - terminate worker2 in finally block
    // This ensures no zombie workers remain, even if errors occur
    if (worker2 && !worker2Terminated) {
      try {
        await worker2.terminate().catch(() => {})
        worker2Terminated = true
        console.log('[Handwriting OCR] Worker2 terminated in finally block (guaranteed cleanup)')
      } catch (cleanupError) {
        console.error('[Handwriting OCR] Failed to terminate worker2 in finally block:', cleanupError)
      } finally {
        worker2 = null // Clear reference to prevent zombie workers
      }
    }
  }

  // Merge results by confidence
  const mergedResult = mergeOCRResults(results)

  console.log(
    `[Handwriting OCR] Merged result - Confidence: ${mergedResult.averageConfidence.toFixed(1)}%, Text: ${mergedResult.rawText.length} chars`
  )

  // AI Error Correction (CRITICAL for handwritten text)
  let correctedText = mergedResult.rawText
  let detectedDates: string[] = []
  let correctionConfidence = 0

  if (mergedResult.rawText.trim().length > 0) {
    try {
      console.log('[Handwriting OCR] Running AI error correction...')
      const correctionResult = await correctHandwriting(mergedResult.rawText, 'openai')
      
      correctedText = correctionResult.cleanedText
      detectedDates = correctionResult.detectedDates
      correctionConfidence = correctionResult.confidence

      console.log(
        `[Handwriting OCR] Error correction completed - Confidence: ${correctionConfidence}%, Dates: ${detectedDates.length}`
      )
    } catch (correctionError: any) {
      console.warn('[Handwriting OCR] Error correction failed, using uncorrected text:', correctionError.message)
      // Continue with uncorrected text
    }
  }

  // Use corrected text if available, otherwise use merged
  const finalText = correctedText || mergedResult.rawText
  const finalConfidence = correctionConfidence > 0 
    ? (mergedResult.averageConfidence + correctionConfidence) / 2 
    : mergedResult.averageConfidence

  console.log(
    `[Handwriting OCR] Final result - Confidence: ${finalConfidence.toFixed(1)}%, Text: ${finalText.length} chars`
  )

  return {
    rawText: finalText,
    averageConfidence: Math.round(finalConfidence * 100) / 100,
    passes,
  }
}

/**
 * Merge OCR results from multiple passes
 * Prefers higher confidence results
 */
function mergeOCRResults(
  results: Array<{ text: string; confidence: number; psm: string }>
): {
  rawText: string
  averageConfidence: number
} {
  if (results.length === 0) {
    return {
      rawText: '',
      averageConfidence: 0,
    }
  }

  if (results.length === 1) {
    return {
      rawText: results[0].text,
      averageConfidence: results[0].confidence,
    }
  }

  // Sort by confidence (highest first)
  const sortedResults = [...results].sort((a, b) => b.confidence - a.confidence)

  // Use highest confidence result as primary
  const primaryResult = sortedResults[0]

  // Calculate average confidence
  const validResults = sortedResults.filter((r) => r.confidence > 0)
  const averageConfidence =
    validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length
      : 0

  // Merge text: Use primary, but append unique words from secondary if confidence is close
  let mergedText = primaryResult.text

  if (sortedResults.length > 1) {
    const secondaryResult = sortedResults[1]

    // If secondary confidence is within 10% of primary, merge unique words
    if (
      secondaryResult.confidence > 0 &&
      primaryResult.confidence - secondaryResult.confidence < 10
    ) {
      const primaryWords = new Set(primaryResult.text.toLowerCase().split(/\s+/))
      const secondaryWords = secondaryResult.text
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2 && !primaryWords.has(word))

      if (secondaryWords.length > 0) {
        // Append unique words from secondary (with lower weight)
        mergedText = `${primaryResult.text} ${secondaryWords.join(' ')}`.trim()
      }
    }
  }

  return {
    rawText: mergedText,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
  }
}

