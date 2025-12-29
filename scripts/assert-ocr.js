#!/usr/bin/env node
/**
 * Build assertion script - ensures OCR files exist before build
 * Fails the build if required OCR files are missing
 */

const fs = require('fs')
const path = require('path')

// Check if src folder exists
const hasSrc = fs.existsSync(path.join(process.cwd(), 'src'))
const libPath = hasSrc ? 'src/lib/ocr' : 'lib/ocr'

const requiredFiles = [
  'index.ts',
  'pdf-converter.ts',
  'handwriting-detection.ts',
]

console.log(`[Assert OCR] Checking OCR files in: ${libPath}`)

const missingFiles = []
const existingFiles = []

for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), libPath, file)
  if (fs.existsSync(filePath)) {
    existingFiles.push(file)
    console.log(`[Assert OCR] ✓ ${file} exists`)
  } else {
    missingFiles.push(file)
    console.error(`[Assert OCR] ✗ ${file} MISSING`)
  }
}

if (missingFiles.length > 0) {
  console.error(`[Assert OCR] ERROR: Missing required OCR files:`)
  missingFiles.forEach(file => {
    console.error(`  - ${libPath}/${file}`)
  })
  console.error(`[Assert OCR] Build will fail. Please ensure all OCR files exist.`)
  process.exit(1)
}

console.log(`[Assert OCR] ✓ All ${requiredFiles.length} required OCR files exist`)
console.log(`[Assert OCR] Build can proceed`)

