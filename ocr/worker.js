#!/usr/bin/env node

/**
 * Dedicated OCR Worker Script
 * 
 * Runs outside Next.js as a standalone Node.js process.
 * Processes images using Tesseract.js and outputs raw OCR text.
 * 
 * Usage:
 *   node ocr/worker.js <image_path>
 * 
 * Output:
 *   - Raw OCR text to stdout
 *   - Errors to stderr
 *   - Exit code: 0 (success), 1 (error)
 */

const fs = require('fs')
const path = require('path')

// Validate command-line arguments
if (process.argv.length < 3) {
  console.error('Usage: node ocr/worker.js <image_path> [--json]')
  console.error('  --json: Output JSON with text and confidence')
  process.exit(1)
}

const imagePath = process.argv[2]
const outputJson = process.argv.includes('--json') || process.argv.includes('-j')

// Validate image path exists
if (!fs.existsSync(imagePath)) {
  console.error(`Error: Image file not found: ${imagePath}`)
  process.exit(1)
}

// Validate it's a file (not directory)
const stats = fs.statSync(imagePath)
if (!stats.isFile()) {
  console.error(`Error: Path is not a file: ${imagePath}`)
  process.exit(1)
}

/**
 * Main OCR processing function
 */
async function processOCR() {
  let worker = null
  let workerTerminated = false

  try {
    // Import Tesseract.js dynamically
    const { createWorker } = await import('tesseract.js')

    console.error(`[OCR Worker] Starting OCR for: ${imagePath}`)

    // Create worker with English language
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        // Log progress to stderr (not stdout - we reserve stdout for OCR text)
        if (m.status === 'recognizing text') {
          const progress = Math.round(m.progress * 100)
          console.error(`[OCR Worker] Progress: ${progress}%`)
        }
      },
    })

    console.error('[OCR Worker] Worker created successfully')

    // Set OCR parameters optimized for SPEED
    // Note: Some parameters (OEM, dictionaries) can only be set during worker creation
    // OEM mode is already set via createWorker('eng', 1, ...) - the '1' is OEM 1 (LSTM)
    await worker.setParameters({
      // Core settings (can be set after initialization)
      tessedit_pageseg_mode: '6', // Uniform block of text (fast)

      // SPEED OPTIMIZATION: Disable learning and accuracy features
      classify_enable_learning: '0', // Disable learning (saves time)
      tessedit_do_invert: '0', // Disable inversion (saves time)

      // SPEED OPTIMIZATION: Reduce processing overhead
      textord_min_linesize: '2.5', // Minimum line size (faster processing)
      classify_bln_numeric_mode: '0', // Disable numeric mode (saves time)
    })

    console.error('[OCR Worker] Parameters set (speed-optimized, PSM: 6)')
    console.error('[OCR Worker] Note: OEM mode (1) is set during worker creation')

    // HARD TIMEOUT: 8 seconds (prevents hanging)
    const HARD_OCR_TIMEOUT = 8000
    const recognizePromise = worker.recognize(imagePath)

    // Create hard timeout promise
    let timeoutId = null
    const hardTimeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(async () => {
        if (worker && !workerTerminated) {
          try {
            await worker.terminate().catch(() => {})
            workerTerminated = true
            worker = null
            console.error('[OCR Worker] Hard timeout (8s) - Worker terminated')
          } catch (terminateError) {
            console.error('[OCR Worker] Failed to terminate worker on timeout:', terminateError)
            worker = null
          }
        }
        reject(new Error('OCR timeout'))
      }, HARD_OCR_TIMEOUT)
    })

    // Race between recognition and timeout
    let result
    try {
      result = await Promise.race([recognizePromise, hardTimeoutPromise])

      // Clear timeout if recognition completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    } catch (raceError) {
      // Clear timeout if it was set
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      // Re-throw error - worker will be terminated in finally block
      throw raceError
    }

    // Extract raw text and confidence
    const rawText = result.data.text || ''
    const confidence = result.data.confidence || 0

    // Terminate worker after successful OCR
    if (worker && !workerTerminated) {
      try {
        await worker.terminate()
        workerTerminated = true
        worker = null
        console.error('[OCR Worker] Worker terminated after successful OCR')
      } catch (terminateError) {
        console.error('[OCR Worker] Failed to terminate worker:', terminateError)
        worker = null
      }
    }

    // Output based on mode
    if (outputJson) {
      // JSON mode: Output structured data with text and confidence
      // IMPORTANT: Only output JSON to stdout, all logs go to stderr
      const output = {
        text: rawText.trim(),
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
        textLength: rawText.trim().length,
      }
      // Write JSON to stdout (clean output, no warnings)
      process.stdout.write(JSON.stringify(output, null, 2))
      process.stdout.write('\n')
      // Log to stderr (for debugging, doesn't interfere with JSON parsing)
      console.error(`[OCR Worker] OCR completed - Text length: ${rawText.trim().length} chars, Confidence: ${confidence.toFixed(2)}%`)
    } else {
      // Default mode: Output raw OCR text only (for API compatibility)
      process.stdout.write(rawText.trim())
      process.stdout.write('\n')
      console.error(`[OCR Worker] OCR completed - Text length: ${rawText.trim().length} chars`)
    }

    // Exit successfully
    process.exit(0)
  } catch (error) {
    // Log error to stderr
    console.error(`[OCR Worker] Error: ${error.message}`)
    if (error.stack) {
      console.error(`[OCR Worker] Stack: ${error.stack}`)
    }

    // Exit with error code
    process.exit(1)
  } finally {
    // GUARANTEED cleanup - terminate worker in finally block
    if (worker && !workerTerminated) {
      try {
        await worker.terminate().catch(() => {})
        workerTerminated = true
        console.error('[OCR Worker] Worker terminated in finally block (guaranteed cleanup)')
      } catch (cleanupError) {
        console.error('[OCR Worker] Failed to terminate worker in finally block:', cleanupError)
      } finally {
        worker = null
      }
    }
  }
}

// Handle process signals for clean shutdown
process.on('SIGINT', () => {
  console.error('[OCR Worker] Received SIGINT - shutting down gracefully')
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.error('[OCR Worker] Received SIGTERM - shutting down gracefully')
  process.exit(1)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[OCR Worker] Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[OCR Worker] Unhandled rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run OCR processing
processOCR().catch((error) => {
  console.error('[OCR Worker] Fatal error:', error)
  process.exit(1)
})

