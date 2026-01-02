/**
 * 🔧 LAYER 2: HUMAN EXTRACTION ENGINE
 * Google Vision ≠ Human reader
 * YOU must read like a human.
 * 
 * Input: rawText (string)
 * Output: extractedData object
 */

import { extractExpiryDate, type ExpiryDateResult } from './expiryExtractor'

export interface ExtractedFieldData {
  value: string | null
  confidence: 'High' | 'Medium' | 'Low'
}

export interface ExtractedDataResult {
  category: 'license' | 'medicine' | 'warranty' | 'other'
  categoryConfidence?: 'High' | 'Medium' | 'Low'
  extractedData: {
    // License fields
    documentName?: ExtractedFieldData
    licenseNumber?: ExtractedFieldData
    holderName?: ExtractedFieldData
    dateOfBirth?: ExtractedFieldData
    dateOfIssue?: ExtractedFieldData
    expiryDate?: ExtractedFieldData
    
    // Medicine fields
    productName?: ExtractedFieldData
    batchNumber?: ExtractedFieldData
    
    // Warranty fields
    purchaseDate?: ExtractedFieldData
    
    // Common fields
    companyName?: ExtractedFieldData
  }
}

/**
 * 🔍 LAYER 3: CATEGORY DETECTION (REAL HUMAN LOGIC)
 * Implement category detection FIRST using keywords
 */
function detectCategory(rawText: string): 'license' | 'medicine' | 'warranty' | 'other' {
  const lowerText = rawText.toLowerCase()
  
  // LICENSE if rawText contains:
  // - "Driving Licence" OR "DL No" OR "Valid Till"
  if (
    lowerText.includes('driving licence') ||
    lowerText.includes('driving license') ||
    lowerText.includes('dl no') ||
    lowerText.includes('dlno') ||
    lowerText.includes('valid till') ||
    lowerText.includes('valid until') ||
    lowerText.includes('date of issue') ||
    lowerText.includes('date of birth') ||
    lowerText.includes('union of india')
  ) {
    return 'license'
  }
  
  // MEDICINE if rawText contains:
  // - "Expiry Date" OR "Mfg" OR tablet names
  if (
    lowerText.includes('expiry date') ||
    lowerText.includes('exp date') ||
    lowerText.includes('mfg') ||
    lowerText.includes('manufacturing') ||
    lowerText.includes('tablet') ||
    lowerText.includes('capsule') ||
    lowerText.includes('medicine') ||
    lowerText.includes('mg') ||
    lowerText.includes('batch no') ||
    lowerText.includes('batch number')
  ) {
    return 'medicine'
  }
  
  // WARRANTY if rawText contains:
  // - "Warranty" OR "Invoice" OR "Purchased"
  if (
    lowerText.includes('warranty') ||
    lowerText.includes('invoice') ||
    lowerText.includes('purchased') ||
    lowerText.includes('purchase date') ||
    lowerText.includes('bill date')
  ) {
    return 'warranty'
  }
  
  // Only use "other" if none match
  return 'other'
}

/**
 * 🔍 LAYER 3: LICENSE EXTRACTION (INDIA DL)
 */
function extractLicenseFields(rawText: string): Partial<ExtractedDataResult['extractedData']> {
  const fields: Partial<ExtractedDataResult['extractedData']> = {}
  
  // License Number: DL No. : ABC1234567890
  const licenseMatch = rawText.match(/DL\s*No\.?\s*[:\-]?\s*([A-Z0-9]+)/i)
  if (licenseMatch) {
    fields.licenseNumber = {
      value: licenseMatch[1],
      confidence: 'High',
    }
  }
  
  // 🔧 CRITICAL: Use comprehensive expiry date extractor for "Valid Till" and all formats
  // This handles: Valid Till, Valid Until, Expiry Date, etc. with all date formats
  const expiryResult = extractExpiryDate(rawText)
  if (expiryResult.value) {
    fields.expiryDate = {
      value: expiryResult.value, // Already in YYYY-MM-DD format
      confidence: expiryResult.confidence,
    }
  }
  
  // Date of Birth: Date of Birth : 01-01-1990
  const dobMatch = rawText.match(/Date\s*of\s*Birth\s*[:\-]?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i)
  if (dobMatch) {
    const dateStr = dobMatch[1].replace(/\//g, '-')
    fields.dateOfBirth = {
      value: dateStr,
      confidence: 'High',
    }
  }
  
  // Name: Name : JOHN DOE
  const nameMatch = rawText.match(/Name\s*[:\-]?\s*([A-Z][A-Z\s]{2,50})/i)
  if (nameMatch) {
    fields.holderName = {
      value: nameMatch[1].trim(),
      confidence: 'High',
    }
  }
  
  // Date of Issue: Date of Issue : 01-01-2020
  const issueMatch = rawText.match(/Date\s*of\s*Issue\s*[:\-]?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i)
  if (issueMatch) {
    const dateStr = issueMatch[1].replace(/\//g, '-')
    fields.dateOfIssue = {
      value: dateStr,
      confidence: 'High',
    }
  }
  
  // Document Name
  fields.documentName = {
    value: 'Driving License',
    confidence: 'High',
  }
  
  return fields
}

/**
 * 🔍 LAYER 3: MEDICINE EXTRACTION
 */
function extractMedicineFields(rawText: string): Partial<ExtractedDataResult['extractedData']> {
  const fields: Partial<ExtractedDataResult['extractedData']> = {}
  
  // 🔧 CRITICAL: Use comprehensive expiry date extractor for all formats
  // This handles: Expiry Date, Exp Date, Use Before, Best Before, etc. with all date formats
  const expiryResult = extractExpiryDate(rawText)
  if (expiryResult.value) {
    fields.expiryDate = {
      value: expiryResult.value, // Already in YYYY-MM-DD format
      confidence: expiryResult.confidence,
    }
  }
  
  // 🔧 CRITICAL FIX: Product Name extraction - think like a human reader
  // Strategy 1: Look for lines containing "Medicine" or product-like text
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let productName: string | null = null
  let confidence: 'High' | 'Medium' | 'Low' = 'Low'
  
  // Strategy 1: Look for lines containing "Medicine" keyword
  for (const line of lines) {
    const upperLine = line.toUpperCase()
    // Look for lines with "MEDICINE" followed by numbers or text
    if (upperLine.includes('MEDICINE')) {
      // Extract the full product name (e.g., "Medicine 250")
      const medicineMatch = line.match(/(?:Medicine|MEDICINE)\s*([A-Za-z0-9\s]+)/i)
      if (medicineMatch) {
        productName = line.trim() // Use the full line
        confidence = 'High'
        break
      } else {
        // If line contains "Medicine", use the whole line
        if (line.length >= 5 && line.length <= 100) {
          productName = line.trim()
          confidence = 'High'
          break
        }
      }
    }
  }
  
  // Strategy 2: Look for product-like patterns (word + number, e.g., "Medicine 250", "Vitamin C 500")
  if (!productName) {
    for (const line of lines) {
      // Pattern: Word(s) followed by number (e.g., "Medicine 250", "Vitamin C 500mg")
      const productPattern = /^([A-Za-z][A-Za-z\s]{2,40}?\s+\d+[A-Za-z0-9\s]*)$/
      const match = line.match(productPattern)
      if (match && line.length >= 5 && line.length <= 100) {
        // Exclude common non-product lines
        const upperLine = line.toUpperCase()
        if (!upperLine.match(/^(EXPIRY|DATE|BATCH|MFG|USE|BEST|BEFORE|VALID|TILL|UNTIL|STORE|MANUFACTURING|BATCH|NO|NUMBER)/)) {
          productName = line.trim()
          confidence = 'High'
          break
        }
      }
    }
  }
  
  // Strategy 3: Look for lines that look like product names (2-60 chars, mostly letters/numbers)
  if (!productName) {
    for (const line of lines.slice(0, 8)) { // First 8 lines
      const trimmed = line.trim()
      const upperLine = trimmed.toUpperCase()
      
      // Skip if it's a date, batch, or instruction line
      if (trimmed.length >= 5 && trimmed.length <= 100 &&
          !upperLine.match(/^(EXPIRY|DATE|BATCH|MFG|USE|BEST|BEFORE|VALID|TILL|UNTIL|STORE|MANUFACTURING|CHEWABLE|TABLET|TABLETS|CAPSULE|CAPSULES)/) &&
          !trimmed.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/) && // Not a date
          trimmed.match(/^[A-Za-z0-9\s]+$/) && // Only letters, numbers, spaces
          trimmed.split(/\s+/).length <= 5) { // Not too many words
        productName = trimmed
        confidence = 'Medium'
        break
      }
    }
  }
  
  // Strategy 4: Fallback - use first substantial line
  if (!productName) {
    for (const line of lines.slice(0, 5)) {
      const trimmed = line.trim()
      if (trimmed.length >= 3 && trimmed.length <= 100) {
        productName = trimmed
        confidence = 'Low'
        break
      }
    }
  }
  
  if (productName) {
    fields.productName = {
      value: productName,
      confidence,
    }
  }
  
  // Batch Number
  const batchMatch = rawText.match(/Batch\s*(?:No\.?|Number)?\s*[:\-]?\s*([A-Z0-9]+)/i)
  if (batchMatch) {
    fields.batchNumber = {
      value: batchMatch[1],
      confidence: 'High',
    }
  }
  
  return fields
}

/**
 * 🔍 LAYER 3: WARRANTY EXTRACTION
 */
function extractWarrantyFields(rawText: string): Partial<ExtractedDataResult['extractedData']> {
  const fields: Partial<ExtractedDataResult['extractedData']> = {}
  
  // 🔧 CRITICAL: Use comprehensive expiry date extractor for all formats
  const expiryResult = extractExpiryDate(rawText)
  if (expiryResult.value) {
    fields.expiryDate = {
      value: expiryResult.value, // Already in YYYY-MM-DD format
      confidence: expiryResult.confidence,
    }
  }
  
  // Purchase Date
  const purchaseMatch = rawText.match(/(?:Purchase|Bill)\s*Date\s*[:\-]?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i)
  if (purchaseMatch) {
    const dateStr = purchaseMatch[1].replace(/\//g, '-')
    fields.purchaseDate = {
      value: dateStr,
      confidence: 'High',
    }
  }
  
  // Product Name: First line or after "Product"
  const productMatch = rawText.match(/Product\s*[:\-]?\s*([A-Za-z0-9\s]+)/i)
  if (productMatch) {
    fields.productName = {
      value: productMatch[1].trim(),
      confidence: 'High',
    }
  } else {
    // Fallback: first non-empty line
    const lines = rawText.split('\n').filter(line => line.trim().length > 0)
    if (lines.length > 0 && lines[0].trim().length > 2) {
      fields.productName = {
        value: lines[0].trim(),
        confidence: 'Medium',
      }
    }
  }
  
  return fields
}

/**
 * 🔧 LAYER 2: MAIN EXTRACTION FUNCTION
 * Extract data from rawText like a human reader
 */
export function extractDataFromRawText(rawText: string): ExtractedDataResult {
  if (!rawText || rawText.trim().length === 0) {
    return {
      category: 'other',
      extractedData: {
        expiryDate: { value: null, confidence: 'Low' },
      },
    }
  }
  
  // Step 1: Detect category FIRST
  const category = detectCategory(rawText)
  
  // Step 2: Extract fields based on category
  let extractedData: Partial<ExtractedDataResult['extractedData']> = {}
  
  switch (category) {
    case 'license':
      extractedData = extractLicenseFields(rawText)
      break
    case 'medicine':
      extractedData = extractMedicineFields(rawText)
      break
    case 'warranty':
      extractedData = extractWarrantyFields(rawText)
      break
    default:
      // 🔧 CRITICAL: For "other" category (including licenses), use comprehensive expiry extractor
      // This will catch "Valid Till", "Valid Until", "Expiry Date", etc. with all formats
      const expiryResult = extractExpiryDate(rawText)
      if (expiryResult.value) {
        extractedData.expiryDate = {
          value: expiryResult.value, // Already in YYYY-MM-DD format
          confidence: expiryResult.confidence,
        }
      } else {
        extractedData.expiryDate = { value: null, confidence: 'Low' }
      }
      extractedData.documentName = { value: null, confidence: 'Low' }
      break
  }
  
  return {
    category,
    categoryConfidence: 'High' as const,
    extractedData: extractedData as ExtractedDataResult['extractedData'],
  }
}
