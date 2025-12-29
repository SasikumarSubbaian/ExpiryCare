// Browser OCR using Tesseract.js
// Runs entirely in the browser - no server-side processing

import { createWorker } from 'tesseract.js'

/**
 * Preprocess image for OCR using Canvas API
 * - Resize to max width 1600px (maintains aspect ratio)
 * - Convert to grayscale
 * - Returns processed image as ImageData or File
 */
export async function preprocessImageForOCR(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Calculate new dimensions (max width 1600px)
        const MAX_WIDTH = 1600
        let width = img.width
        let height = img.height

        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width
          width = MAX_WIDTH
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height)

        // Enhance image for better OCR
        const imageData = ctx.getImageData(0, 0, width, height)
        const data = imageData.data

        // Apply aggressive image enhancement: grayscale + contrast boost + thresholding
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale formula: 0.299*R + 0.587*G + 0.114*B
          let gray = Math.round(
            0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          )
          
          // Enhance contrast more aggressively (50% boost for better text extraction)
          // Formula: newValue = (oldValue - 128) * contrastFactor + 128
          const contrastFactor = 1.5 // Increase contrast by 50%
          gray = Math.max(0, Math.min(255, (gray - 128) * contrastFactor + 128))
          
          // Apply thresholding (binarization) for better OCR on labels
          // Convert to pure black/white for text-heavy images
          const threshold = 140 // Adjust threshold for better text extraction
          gray = gray > threshold ? 255 : 0 // Pure black or white
          
          data[i] = gray     // R
          data[i + 1] = gray // G
          data[i + 2] = gray // B
          // data[i + 3] is alpha, keep as is
        }

        // Put processed image data back
        ctx.putImageData(imageData, 0, 0)

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            if (blob) {
              // Create new File from blob
              const processedFile = new File([blob], file.name, {
                type: 'image/png',
                lastModified: Date.now(),
              })
              resolve(processedFile)
            } else {
              reject(new Error('Failed to create blob from canvas'))
            }
          },
          'image/png',
          0.95
        )
      } catch (error: any) {
        URL.revokeObjectURL(url)
        reject(error)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Run OCR on image file in browser
 * Returns raw text only
 */
export async function runBrowserOCR(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{
  text: string
  confidence: number
}> {
  let worker: any = null

  try {
    // Preprocess image
    const processedFile = await preprocessImageForOCR(file)

    // Create Tesseract worker
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100))
        }
      },
    })

    // Run OCR with multiple PSM modes for better coverage
    // Try PSM 11 first (sparse text), then fallback to PSM 6 if needed
    let bestText = ''
    let bestConfidence = 0
    
    // Try PSM 11 (Sparse text - finds text in different areas) - BEST for labels
    try {
      await worker.setParameters({ tessedit_pageseg_mode: '11' })
      const result11 = await worker.recognize(processedFile)
      const text11 = result11.data.text || ''
      const conf11 = result11.data.confidence || 0
      console.log('[Browser OCR] PSM 11 result:', { textLength: text11.length, confidence: conf11, text: text11.substring(0, 200) })
      if (text11.trim().length > bestText.length) {
        bestText = text11
        bestConfidence = conf11
      }
    } catch (e) {
      console.warn('[Browser OCR] PSM 11 failed, trying PSM 6:', e)
    }
    
    // Try PSM 6 (Uniform block) as fallback
    try {
      await worker.setParameters({ tessedit_pageseg_mode: '6' })
      const result6 = await worker.recognize(processedFile)
      const text6 = result6.data.text || ''
      const conf6 = result6.data.confidence || 0
      console.log('[Browser OCR] PSM 6 result:', { textLength: text6.length, confidence: conf6, text: text6.substring(0, 200) })
      if (text6.trim().length > bestText.length) {
        bestText = text6
        bestConfidence = conf6
      }
    } catch (e) {
      console.warn('[Browser OCR] PSM 6 failed:', e)
    }
    
    // If still no good result, try PSM 3 (Fully automatic page segmentation)
    if (bestText.length < 30) {
      try {
        await worker.setParameters({ tessedit_pageseg_mode: '3' })
        const result3 = await worker.recognize(processedFile)
        const text3 = result3.data.text || ''
        const conf3 = result3.data.confidence || 0
        console.log('[Browser OCR] PSM 3 result:', { textLength: text3.length, confidence: conf3, text: text3.substring(0, 200) })
        if (text3.trim().length > bestText.length) {
          bestText = text3
          bestConfidence = conf3
        }
      } catch (e) {
        console.warn('[Browser OCR] PSM 3 failed:', e)
      }
    }
    
    // Try PSM 4 (Single column) for structured labels
    if (bestText.length < 50) {
      try {
        await worker.setParameters({ tessedit_pageseg_mode: '4' })
        const result4 = await worker.recognize(processedFile)
        const text4 = result4.data.text || ''
        const conf4 = result4.data.confidence || 0
        console.log('[Browser OCR] PSM 4 result:', { textLength: text4.length, confidence: conf4, text: text4.substring(0, 200) })
        if (text4.trim().length > bestText.length) {
          bestText = text4
          bestConfidence = conf4
        }
      } catch (e) {
        console.warn('[Browser OCR] PSM 4 failed:', e)
      }
    }
    
    // Try PSM 7 (Single text line) for single-line dates
    if (bestText.length < 50) {
      try {
        await worker.setParameters({ tessedit_pageseg_mode: '7' })
        const result7 = await worker.recognize(processedFile)
        const text7 = result7.data.text || ''
        const conf7 = result7.data.confidence || 0
        console.log('[Browser OCR] PSM 7 result:', { textLength: text7.length, confidence: conf7, text: text7.substring(0, 200) })
        if (text7.trim().length > bestText.length) {
          bestText = text7
          bestConfidence = conf7
        }
      } catch (e) {
        console.warn('[Browser OCR] PSM 7 failed:', e)
      }
    }

    console.log('[Browser OCR] Best result:', { textLength: bestText.length, confidence: bestConfidence, text: bestText.substring(0, 300) })

    return {
      text: bestText.trim() || '',
      confidence: Math.round((bestConfidence || 0) * 100) / 100,
    }
  } catch (error: any) {
    console.error('[Browser OCR] Error:', error)
    throw new Error(`OCR failed: ${error.message}`)
  } finally {
    // Always terminate worker
    if (worker) {
      try {
        await worker.terminate()
      } catch (terminateError) {
        console.warn('[Browser OCR] Failed to terminate worker:', terminateError)
      }
    }
  }
}

