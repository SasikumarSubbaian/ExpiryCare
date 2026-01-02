/**
 * 🔧 LAYER 2: HUMAN EXTRACTION ENGINE
 * Google Vision ≠ Human reader
 * YOU must read like a human.
 * 
 * Input: rawText (string)
 * Output: extractedData object
 */

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
  
  // Valid Till: Valid Till : 31-12-2025
  const validTillMatch = rawText.match(/Valid\s*Till\s*[:\-]?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i)
  if (validTillMatch) {
    // Normalize date format
    const dateStr = validTillMatch[1].replace(/\//g, '-')
    fields.expiryDate = {
      value: dateStr,
      confidence: 'High',
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
  
  // Expiry Date: Expiry Date : 01/2026 or 2026
  const expiryMatch = rawText.match(/Expiry\s*Date\s*[:\-]?\s*(\d{2}\/\d{4}|\d{4})/i)
  if (expiryMatch) {
    let expiryValue = expiryMatch[1]
    // Normalize MM/YYYY to YYYY-MM-DD (use last day of month)
    if (expiryValue.includes('/')) {
      const [month, year] = expiryValue.split('/')
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      expiryValue = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
    } else {
      // Just year, use Dec 31
      expiryValue = `${expiryValue}-12-31`
    }
    fields.expiryDate = {
      value: expiryValue,
      confidence: 'High',
    }
  }
  
  // Product Name: First line or before "tablet"/"capsule"
  const productMatch = rawText.match(/^([A-Za-z0-9\s]+?)(?:\s+tablet|\s+capsule|$)/im)
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
  
  // Expiry Date
  const expiryMatch = rawText.match(/Expiry\s*Date\s*[:\-]?\s*(\d{2}[-/]\d{2}[-/]\d{4})/i)
  if (expiryMatch) {
    const dateStr = expiryMatch[1].replace(/\//g, '-')
    fields.expiryDate = {
      value: dateStr,
      confidence: 'High',
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
      // For "other", try to extract expiry date at least
      const expiryMatch = rawText.match(/(?:Expiry|Exp)\s*Date\s*[:\-]?\s*(\d{2}[-/]\d{2}[-/]\d{4}|\d{2}\/\d{4})/i)
      if (expiryMatch) {
        let expiryValue = expiryMatch[1]
        if (expiryValue.includes('/') && !expiryValue.includes('-')) {
          // MM/YYYY format
          const [month, year] = expiryValue.split('/')
          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
          expiryValue = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
        } else {
          expiryValue = expiryValue.replace(/\//g, '-')
        }
        extractedData.expiryDate = {
          value: expiryValue,
          confidence: 'High',
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
