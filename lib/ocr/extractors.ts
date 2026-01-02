import type { Category } from './categorySchemas'
import { extractExpiryDate, type ExpiryDateResult } from './expiryExtractor'
import { getAllowedFields, isFieldAllowed } from './categorySchemas'
import { sanitizeOCRText } from './sanitizeOCRText'

/**
 * Extracted data structure
 */
export interface ExtractedData {
  expiryDate: ExpiryDateResult
  productName?: string | null
  companyName?: string | null
  policyType?: string | null
  insurerName?: string | null
  serviceType?: string | null
  providerName?: string | null
  serviceName?: string | null
  planType?: string | null
  medicineName?: string | null
  brandName?: string | null
  documentType?: string | null
  additionalFields?: Record<string, string>
  extractionWarnings?: string[]
}

/**
 * Extract warranty-specific fields
 */
function extractWarrantyFields(ocrText: string): Partial<ExtractedData> {
  const text = ocrText.toUpperCase()
  const result: Partial<ExtractedData> = {}

  // Extract product name (common patterns)
  const productPatterns = [
    /(?:PRODUCT|ITEM|MODEL)\s*:?\s*([A-Z0-9\s]{3,30})/,
    /^([A-Z][A-Z0-9\s]{3,30})(?:\s+WARRANTY|GUARANTEE)/,
  ]

  for (const pattern of productPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.productName = match[1].trim()
      break
    }
  }

  // Extract company name (common patterns)
  const companyPatterns = [
    /(?:MANUFACTURER|BRAND|COMPANY)\s*:?\s*([A-Z\s]{2,30})/,
    /^([A-Z][A-Z\s]{2,30})(?:\s+PRIVATE|LIMITED|LTD|INC)/,
  ]

  for (const pattern of companyPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.companyName = match[1].trim()
      break
    }
  }

  return result
}

/**
 * Extract insurance-specific fields
 */
function extractInsuranceFields(ocrText: string): Partial<ExtractedData> {
  const text = ocrText.toUpperCase()
  const result: Partial<ExtractedData> = {}

  // Extract policy type
  const policyTypePatterns = [
    /(?:POLICY\s*TYPE|TYPE\s*OF\s*POLICY)\s*:?\s*([A-Z\s]{2,30})/,
    /(HEALTH|MOTOR|LIFE|TERM|WHOLE\s*LIFE|ENDOWMENT)\s*(?:INSURANCE|POLICY)/,
  ]

  for (const pattern of policyTypePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.policyType = match[1].trim()
      break
    }
  }

  // Extract insurer name
  const insurerPatterns = [
    /(?:INSURER|INSURANCE\s*COMPANY)\s*:?\s*([A-Z\s]{2,30})/,
    /^([A-Z][A-Z\s]{2,30})(?:\s+INSURANCE|LIFE|GENERAL)/,
  ]

  for (const pattern of insurerPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.insurerName = match[1].trim()
      break
    }
  }

  return result
}

/**
 * Extract AMC-specific fields
 */
function extractAMCFields(ocrText: string): Partial<ExtractedData> {
  const text = ocrText.toUpperCase()
  const result: Partial<ExtractedData> = {}

  // Extract service type
  const serviceTypePatterns = [
    /(?:SERVICE\s*TYPE|TYPE\s*OF\s*SERVICE)\s*:?\s*([A-Z\s]{2,30})/,
    /(ANNUAL\s*MAINTENANCE|AMC|SERVICE\s*CONTRACT)/,
  ]

  for (const pattern of serviceTypePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.serviceType = match[1].trim()
      break
    }
  }

  // Extract provider name
  const providerPatterns = [
    /(?:PROVIDER|SERVICE\s*PROVIDER)\s*:?\s*([A-Z\s]{2,30})/,
    /^([A-Z][A-Z\s]{2,30})(?:\s+SERVICES|TECHNOLOGIES)/,
  ]

  for (const pattern of providerPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.providerName = match[1].trim()
      break
    }
  }

  return result
}

/**
 * Extract subscription-specific fields
 * CRITICAL: Per requirements, only serviceName is allowed (not planType)
 */
function extractSubscriptionFields(ocrText: string): Partial<ExtractedData> {
  const text = ocrText.toUpperCase()
  const result: Partial<ExtractedData> = {}

  // Extract service name only (planType is forbidden per requirements)
  const servicePatterns = [
    /(?:SERVICE|PLATFORM)\s*:?\s*([A-Z0-9\s]{2,30})/,
    /(NETFLIX|SPOTIFY|AMAZON\s*PRIME|YOUTUBE\s*PREMIUM|DISNEY|HOTSTAR)/,
  ]

  for (const pattern of servicePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.serviceName = match[1].trim()
      break
    }
  }

  // CRITICAL: planType is NOT extracted for subscription (forbidden field)
  // Removed planType extraction per requirements

  return result
}

/**
 * Extract medicine-specific fields
 * Enhanced to extract medicine name and company/brand name more intelligently
 * Handles both original case and uppercase text
 */
function extractMedicineFields(ocrText: string): Partial<ExtractedData> {
  // Use original text for better extraction (preserves product names)
  const originalText = ocrText
  const text = ocrText.toUpperCase() // For pattern matching
  const result: Partial<ExtractedData> = {}

  // Strategy 1: Look for prominent product names (usually at the start or large text)
  // 🔧 CRITICAL FIX: Pattern for "Medicine 250" style names
  // Priority 1: Direct pattern for "Medicine" + number (e.g., "Medicine 250")
  const medicineNumberPattern = /(?:Medicine|MEDICINE)\s+(\d+[A-Za-z0-9\s]*)/i
  const medicineNumberMatch = originalText.match(medicineNumberPattern)
  if (medicineNumberMatch) {
    const fullMatch = originalText.match(/(?:Medicine|MEDICINE)\s+\d+[A-Za-z0-9\s]*/i)
    if (fullMatch) {
      const candidate = fullMatch[0].trim()
      if (candidate.length >= 5 && candidate.length <= 100) {
        result.medicineName = candidate
      }
    }
  }
  
  // Pattern: "VITAMIN C CHEWABLE TABLETS" or similar - capture full name including descriptors
  const prominentMedicinePatterns = [
    // Match full product names like "VITAMIN C CHEWABLE TABLETS" (capture everything including descriptors)
    /^([A-Za-z][A-Za-z0-9\s]{2,60}?)(?:\s+(?:CHEWABLE|TABLET|TABLETS|CAPSULE|CAPSULES|MG|ML|VIAL|INJECTION))/i,
    // Match "VITAMIN C" or similar at start, including following words
    /^([A-Za-z][A-Za-z0-9\s]{2,60}?)(?:\s+(?:TABLET|TABLETS|CAPSULE|CAPSULES))/i,
    // Match medicine name with descriptors before common keywords
    /([A-Za-z][A-Za-z0-9\s]{3,60}?)(?:\s+(?:CHEWABLE|TABLET|TABLETS|CAPSULE|CAPSULES|MG|ML))/i,
    // Match after "MEDICINE", "DRUG", "MEDICATION" labels (but not if already found above)
    /(?:MEDICINE|DRUG|MEDICATION|PRODUCT)\s*:?\s*([A-Za-z0-9\s]{3,60})/i,
    // Special pattern for "Vitamin C" style names
    /(VITAMIN\s+[A-Z]\s+[A-Za-z\s]{0,30}(?:CHEWABLE|TABLET|TABLETS|CAPSULE|CAPSULES)?)/i,
  ]

  // Only run prominent patterns if we haven't found medicine name yet
  if (!result.medicineName) {
  // Only run prominent patterns if we haven't found medicine name yet
  if (!result.medicineName) {
    for (const pattern of prominentMedicinePatterns) {
      const match = originalText.match(pattern)
      if (match && match[1]) {
        let candidate = match[1].trim()
        // Clean up extra whitespace
        candidate = candidate.replace(/\s+/g, ' ')
        // Filter out common non-medicine words
        if (!candidate.toUpperCase().match(/^(EXPIRY|DATE|BATCH|MFG|USE|BEST|BEFORE|VALID|TILL|UNTIL)/i) &&
            candidate.length >= 3 && candidate.length <= 60) {
          result.medicineName = candidate
          break
        }
      }
    }
  }
  }

  // Strategy 2: Look for product-like patterns (word + number, e.g., "Medicine 250", "Vitamin C 500")
  if (!result.medicineName) {
    const allLines = originalText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    for (const line of allLines.slice(0, 8)) {
      // Pattern: Word(s) followed by number (e.g., "Medicine 250", "Vitamin C 500mg")
      const productPattern = /^([A-Za-z][A-Za-z\s]{2,40}?\s+\d+[A-Za-z0-9\s]*)$/
      const match = line.match(productPattern)
      if (match && line.length >= 5 && line.length <= 100) {
        // Exclude common non-product lines
        const upperLine = line.toUpperCase()
        if (!upperLine.match(/^(EXPIRY|DATE|BATCH|MFG|USE|BEST|BEFORE|VALID|TILL|UNTIL|STORE|MANUFACTURING|BATCH|NO|NUMBER)/)) {
          result.medicineName = line.trim()
          break
        }
      }
    }
  }

  // Strategy 3: Extract from lines that look like product names (fallback)
  if (!result.medicineName) {
    const allLines = originalText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    for (const line of allLines.slice(0, 5)) {
      const trimmed = line.trim()
      const upperLine = trimmed.toUpperCase()
      
      // Look for lines that look like product names (5-100 chars, mostly letters/numbers)
      // Exclude single characters, dates, and instruction lines
      if (trimmed.length >= 5 && trimmed.length <= 100 && 
          trimmed.match(/^[A-Za-z0-9\s]+$/) && 
          !upperLine.match(/^(EXPIRY|DATE|BATCH|MFG|USE|BEST|BEFORE|VALID|TILL|UNTIL|MANUFACTURING|STORE|CHEWABLE|TABLET|TABLETS|CAPSULE|CAPSULES)/i) &&
          !trimmed.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/) && // Not a date
          trimmed.split(/\s+/).length <= 5) { // Not too many words
        result.medicineName = trimmed
        break
      }
    }
  }

  // Extract brand/company name
  const brandPatterns = [
    // After "BRAND", "MANUFACTURER", "MADE BY", "BY" labels
    /(?:BRAND|MANUFACTURER|MADE\s+BY|BY)\s*:?\s*([A-Za-z\s]{2,40})/i,
    // Company names ending with PHARMA, PHARMACEUTICALS, LTD, LIMITED, INC
    /([A-Za-z][A-Za-z\s]{2,30}?)(?:\s+(?:PHARMA|PHARMACEUTICALS|LTD|LIMITED|INC|PRIVATE|LIMITED))/i,
    // Look for company names in specific positions (usually after product name)
    /(?:^|\n)([A-Za-z][A-Za-z\s]{2,30}?)(?:\s+(?:PHARMA|PHARMACEUTICALS|LTD|LIMITED))/i,
  ]

  for (const pattern of brandPatterns) {
    const match = originalText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      // Filter out common non-company words
      if (!candidate.toUpperCase().match(/^(EXPIRY|DATE|BATCH|MFG|USE|BEST|BEFORE|VALID|TILL|UNTIL|MEDICINE|DRUG|MEDICATION|PRODUCT|STORE|MANUFACTURING)/i)) {
        result.brandName = candidate
        break
      }
    }
  }

  // Strategy 3: If brand not found, look for company names in lines after medicine name
  if (!result.brandName) {
    const lines = originalText.split('\n')
    const medicineLineIndex = lines.findIndex(line => 
      result.medicineName && line.toUpperCase().includes(result.medicineName.toUpperCase())
    )
    if (medicineLineIndex >= 0 && medicineLineIndex < lines.length - 1) {
      // Check next few lines for company name
      for (let i = medicineLineIndex + 1; i < Math.min(medicineLineIndex + 4, lines.length); i++) {
        const line = lines[i].trim()
        if (line.length >= 2 && line.length <= 40 && 
            line.match(/^[A-Za-z\s]+$/) &&
            !line.toUpperCase().match(/^(EXPIRY|DATE|BATCH|MFG|USE|BEST|BEFORE|VALID|TILL|UNTIL|STORE|MANUFACTURING|CHEWABLE|TABLET|TABLETS)/i)) {
          result.brandName = line
          break
        }
      }
    }
  }

  // Also set companyName to brandName if brandName exists (they're often the same for medicine)
  if (result.brandName && !result.companyName) {
    result.companyName = result.brandName
  }

  return result
}

/**
 * Extract "Other" category fields (SAFE MODE - ONLY expiry date)
 * CRITICAL: For licenses, ID cards, govt documents - extract ONLY expiry date
 * No other fields allowed per requirements
 */
function extractOtherFields(ocrText: string): Partial<ExtractedData> {
  // CRITICAL: Other category extracts ONLY expiry date (handled by extractExpiryDate)
  // No documentType, no other fields - maximum privacy protection
  return {}
}

/**
 * Main extraction function - category-aware
 * CRITICAL: Sanitizes OCR text to remove PII before extraction
 */
export function extractByCategory(ocrText: string, category: Category): ExtractedData {
  // CRITICAL: Sanitize OCR text to remove PII before processing
  const sanitizedText = sanitizeOCRText(ocrText)
  
  const warnings: string[] = []
  const result: ExtractedData = {
    expiryDate: extractExpiryDate(sanitizedText),
  }

  // Extract category-specific fields
  let categoryFields: Partial<ExtractedData> = {}

  // Use sanitized text for all category-specific extractions
  switch (category) {
    case 'warranty':
      categoryFields = extractWarrantyFields(sanitizedText)
      break
    case 'insurance':
      categoryFields = extractInsuranceFields(sanitizedText)
      break
    case 'amc':
      categoryFields = extractAMCFields(sanitizedText)
      break
    case 'subscription':
      categoryFields = extractSubscriptionFields(sanitizedText)
      break
    case 'medicine':
      categoryFields = extractMedicineFields(sanitizedText)
      break
    case 'other':
      // CRITICAL: For "Other" category, only extract expiry date
      categoryFields = extractOtherFields(sanitizedText)
      break
  }

  // Merge category fields (only if allowed)
  const allowedFields = getAllowedFields(category)
  for (const [key, value] of Object.entries(categoryFields)) {
    if (isFieldAllowed(category, key) && value) {
      ;(result as any)[key] = value
    }
  }

  // Check for multiple expiry candidates
  if (result.expiryDate.value) {
    // This is a simplified check - in production, you might want more sophisticated logic
    const expiryMatches = ocrText.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/g)
    if (expiryMatches && expiryMatches.length > 1) {
      warnings.push('Multiple date candidates found. Please verify the expiry date.')
    }
  }

  // Check if expiry is in the past
  if (result.expiryDate.value) {
    const expiryDate = new Date(result.expiryDate.value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (expiryDate < today) {
      warnings.push('Extracted expiry date is in the past. Please verify.')
    }
  }

  if (warnings.length > 0) {
    result.extractionWarnings = warnings
  }

  return result
}

