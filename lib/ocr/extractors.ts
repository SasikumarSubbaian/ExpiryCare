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
 */
function extractMedicineFields(ocrText: string): Partial<ExtractedData> {
  const text = ocrText.toUpperCase()
  const result: Partial<ExtractedData> = {}

  // Extract medicine name (usually prominent)
  const medicinePatterns = [
    /(?:MEDICINE|DRUG|MEDICATION)\s*:?\s*([A-Z0-9\s]{3,40})/,
    /^([A-Z][A-Z0-9\s]{3,40})(?:\s+\d+MG|\d+ML)/,
  ]

  for (const pattern of medicinePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.medicineName = match[1].trim()
      break
    }
  }

  // Extract brand name
  const brandPatterns = [
    /(?:BRAND|MANUFACTURER)\s*:?\s*([A-Z\s]{2,30})/,
    /^([A-Z][A-Z\s]{2,30})(?:\s+PHARMA|PHARMACEUTICALS)/,
  ]

  for (const pattern of brandPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.brandName = match[1].trim()
      break
    }
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

