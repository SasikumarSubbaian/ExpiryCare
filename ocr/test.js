#!/usr/bin/env node

/**
 * OCR Worker Test Script
 * 
 * Tests the OCR worker in isolation to confirm it works before API integration.
 * 
 * Usage:
 *   node ocr/test.js <image_path>
 * 
 * Example:
 *   node ocr/test.js ./test-images/Test_small.png
 */

const { execFile } = require('child_process')
const { promisify } = require('util')
const { existsSync } = require('fs')
const path = require('path')

const execFileAsync = promisify(execFile)

async function testOCR(imagePath) {
  // Validate image path
  if (!imagePath) {
    console.error('Error: Image path is required')
    console.error('Usage: node ocr/test.js <image_path>')
    process.exit(1)
  }

  // Resolve absolute path
  const absolutePath = path.isAbsolute(imagePath) 
    ? imagePath 
    : path.join(process.cwd(), imagePath)

  // Check if file exists
  if (!existsSync(absolutePath)) {
    console.error(`❌ Error: Image file not found: ${absolutePath}`)
    console.error('')
    console.error('📝 To test OCR, you can:')
    console.error('')
    console.error('Option 1: Use an existing image')
    console.error('  npm run ocr:test ./public/logo.png')
    console.error('  npm run ocr:test ./path/to/any/image.png')
    console.error('')
    console.error('Option 2: Create test-images directory')
    console.error('  mkdir test-images')
    console.error('  # Add a test image (PNG, JPG) to test-images/')
    console.error('  npm run ocr:test ./test-images/your-image.png')
    console.error('')
    console.error('💡 Tip: You can test with any image file on your system!')
    process.exit(1)
  }

  console.log('='.repeat(60))
  console.log('OCR Worker Test')
  console.log('='.repeat(60))
  console.log(`Image: ${absolutePath}`)
  console.log('')

  const workerScriptPath = path.join(process.cwd(), 'ocr', 'worker.js')
  const startTime = Date.now()

  try {
    console.log('Starting OCR worker...')
    console.log('')

    // Run OCR worker with --json flag for structured output
    const { stdout, stderr } = await execFileAsync('node', [
      workerScriptPath,
      absolutePath,
      '--json'
    ], {
      timeout: 10000, // 10 second timeout for testing
      maxBuffer: 10 * 1024 * 1024, // 10MB
    })

    const processingTime = Date.now() - startTime

    // Parse JSON output
    // Note: stderr may contain warnings, but JSON should be in stdout
    // Extract JSON from stdout (may have warnings before it)
    let result
    try {
      // Find JSON object in stdout (it should be the last valid JSON)
      // Try to parse the entire stdout first
      result = JSON.parse(stdout.trim())
    } catch (parseError) {
      // If that fails, try to extract JSON from stdout
      // Look for the last occurrence of { ... } which should be the JSON
      const jsonMatch = stdout.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0])
        } catch (nestedParseError) {
          console.error('Error: Failed to parse OCR output as JSON')
          console.error('Parse error:', parseError.message)
          console.error('Raw stdout (first 500 chars):', stdout.substring(0, 500))
          console.error('Raw stderr (first 500 chars):', stderr ? stderr.substring(0, 500) : 'none')
          process.exit(1)
        }
      } else {
        console.error('Error: Failed to parse OCR output as JSON')
        console.error('Parse error:', parseError.message)
        console.error('Raw stdout (first 500 chars):', stdout.substring(0, 500))
        console.error('Raw stderr (first 500 chars):', stderr ? stderr.substring(0, 500) : 'none')
        process.exit(1)
      }
    }

    // Display results
    console.log('='.repeat(60))
    console.log('OCR Results')
    console.log('='.repeat(60))
    console.log(`Processing Time: ${processingTime}ms`)
    console.log(`Confidence: ${result.confidence}%`)
    console.log(`Text Length: ${result.textLength} characters`)
    console.log('')
    console.log('OCR Text:')
    console.log('-'.repeat(60))
    console.log(result.text || '(empty)')
    console.log('-'.repeat(60))
    console.log('')

    // Log stderr (worker logs) if present
    if (stderr) {
      console.log('Worker Logs:')
      console.log('-'.repeat(60))
      console.log(stderr)
      console.log('-'.repeat(60))
      console.log('')
    }

    // Success summary
    console.log('='.repeat(60))
    console.log('✅ OCR Test Completed Successfully')
    console.log('='.repeat(60))
    
    if (result.textLength === 0) {
      console.warn('⚠️  Warning: No text extracted from image')
    }
    
    if (result.confidence < 50) {
      console.warn(`⚠️  Warning: Low confidence (${result.confidence}%)`)
    }

    process.exit(0)
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    console.error('='.repeat(60))
    console.error('❌ OCR Test Failed')
    console.error('='.repeat(60))
    console.error(`Processing Time: ${processingTime}ms`)
    console.error(`Error: ${error.message}`)
    
    if (error.code === 'ETIMEDOUT') {
      console.error('Timeout: OCR worker exceeded 10 second limit')
    }
    
    if (error.signal) {
      console.error(`Process killed with signal: ${error.signal}`)
    }
    
    if (error.stderr) {
      console.error('')
      console.error('Worker Error Output:')
      console.error('-'.repeat(60))
      console.error(error.stderr)
      console.error('-'.repeat(60))
    }
    
    console.error('')
    process.exit(1)
  }
}

// Run test
const imagePath = process.argv[2]
testOCR(imagePath).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

