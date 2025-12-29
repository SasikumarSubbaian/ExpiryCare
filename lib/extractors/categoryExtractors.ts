// Category-Specific Field Extractors
// Each category has its own extraction rules
// Privacy-first: Only extracts whitelisted fields

import { extractExpiryDate, type ExpiryDateResult } from './expiryDateExtractor'

export interface ExtractedFields {
  expiryDate: ExpiryDateResult
  productName?: string | null
  companyName?: string | null
  additionalFields?: Record<string, string>
  extractionWarnings?: string[]
}

/**
 * Extract fields for Warranty category
 * Allowed: productName, companyName
 * Forbidden: invoice number, serial number, address, phone, GST
 */
export function extractWarrantyFields(ocrText: string): ExtractedFields {
  const expiryDate = extractExpiryDate(ocrText)
  const warnings: string[] = []

  // Extract product name (look for product-related keywords)
  let productName: string | null = null
  const productPatterns = [
    /(?:product|item|model)[\s:]+([A-Z][a-zA-Z0-9\s\-]+)/i,
    /([A-Z][a-zA-Z]+\s+(?:TV|AC|Phone|Laptop|Refrigerator|Washing Machine|Microwave))/i,
  ]

  for (const pattern of productPatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      // Exclude forbidden patterns
      if (!/invoice|serial|gst|address|phone/i.test(candidate) && candidate.length > 2 && candidate.length < 50) {
        productName = candidate
        break
      }
    }
  }

  // Extract company/brand name
  let companyName: string | null = null
  const companyPatterns = [
    /(?:brand|company|manufacturer|made by|marketed by)[\s:]+([A-Z][a-zA-Z\s&.-]+)/i,
    /\b(Samsung|LG|Sony|Panasonic|Whirlpool|Godrej|Voltas|Daikin|Hitachi|Carrier)\b/i,
  ]

  for (const pattern of companyPatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      if (candidate.length > 2 && candidate.length < 50) {
        companyName = candidate
        break
      }
    }
  }

  return {
    expiryDate,
    productName,
    companyName,
    extractionWarnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Extract fields for Insurance category
 * Allowed: policyType, insurerName
 * Forbidden: policy number, vehicle number, name, DOB
 */
export function extractInsuranceFields(ocrText: string): ExtractedFields {
  const expiryDate = extractExpiryDate(ocrText)
  const warnings: string[] = []

  // Extract policy type
  let policyType: string | null = null
  const policyTypes = [
    'health insurance',
    'life insurance',
    'term insurance',
    'motor insurance',
    'vehicle insurance',
    'car insurance',
    'bike insurance',
    'travel insurance',
    'home insurance',
  ]

  const lowerText = ocrText.toLowerCase()
  for (const type of policyTypes) {
    if (lowerText.includes(type)) {
      policyType = type
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
      break
    }
  }

  // Extract insurer name (company name)
  let insurerName: string | null = null
  const insurerPatterns = [
    /(?:insurer|insurance company|provider)[\s:]+([A-Z][a-zA-Z\s&.-]+)/i,
    /\b(LIC|HDFC|ICICI|Bajaj|Reliance|Star Health|New India|Oriental|United India)\b/i,
  ]

  for (const pattern of insurerPatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      // Exclude policy numbers, vehicle numbers
      if (!/\d{6,}/.test(candidate) && candidate.length > 2 && candidate.length < 50) {
        insurerName = candidate
        break
      }
    }
  }

  return {
    expiryDate,
    additionalFields: {
      ...(policyType && { policyType }),
      ...(insurerName && { insurerName }),
    },
    extractionWarnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Extract fields for AMC category
 * Allowed: serviceType, providerName
 * Forbidden: contract number, customer name
 */
export function extractAMCFields(ocrText: string): ExtractedFields {
  const expiryDate = extractExpiryDate(ocrText)
  const warnings: string[] = []

  // Extract service type
  let serviceType: string | null = null
  const serviceTypes = [
    'annual maintenance',
    'preventive maintenance',
    'repair service',
    'service contract',
  ]

  const lowerText = ocrText.toLowerCase()
  for (const type of serviceTypes) {
    if (lowerText.includes(type)) {
      serviceType = type
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
      break
    }
  }

  // Extract service provider name
  let providerName: string | null = null
  const providerPatterns = [
    /(?:service provider|provider|service company)[\s:]+([A-Z][a-zA-Z\s&.-]+)/i,
  ]

  for (const pattern of providerPatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      // Exclude contract numbers
      if (!/\d{6,}/.test(candidate) && candidate.length > 2 && candidate.length < 50) {
        providerName = candidate
        break
      }
    }
  }

  return {
    expiryDate,
    additionalFields: {
      ...(serviceType && { serviceType }),
      ...(providerName && { providerName }),
    },
    extractionWarnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Extract fields for Subscription category
 * Allowed: serviceName, planType
 * Special: "Next Renewal Date" is treated as expiry date
 */
export function extractSubscriptionFields(ocrText: string): ExtractedFields {
  const expiryDate = extractExpiryDate(ocrText)
  const warnings: string[] = []

  // Extract service name
  let serviceName: string | null = null
  const servicePatterns = [
    /(?:service|subscription|plan)[\s:]+([A-Z][a-zA-Z0-9\s\-]+)/i,
    /\b(Netflix|Amazon Prime|Disney|Hotstar|Spotify|YouTube Premium|Zee5|SonyLIV)\b/i,
  ]

  for (const pattern of servicePatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      if (candidate.length > 2 && candidate.length < 50) {
        serviceName = candidate
        break
      }
    }
  }

  // Extract plan type
  let planType: string | null = null
  const planPatterns = [
    /(?:plan|package)[\s:]+([A-Z][a-zA-Z0-9\s\-]+)/i,
    /\b(Basic|Standard|Premium|Family|Individual|Annual|Monthly)\b/i,
  ]

  for (const pattern of planPatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      if (candidate.length > 2 && candidate.length < 30) {
        planType = candidate
        break
      }
    }
  }

  return {
    expiryDate,
    additionalFields: {
      ...(serviceName && { serviceName }),
      ...(planType && { planType }),
    },
    extractionWarnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Extract fields for Medicine category
 * Allowed: medicineName, brandName
 * Forbidden: batch number, MFG license, patient info
 */
export function extractMedicineFields(ocrText: string): ExtractedFields {
  const expiryDate = extractExpiryDate(ocrText)
  const warnings: string[] = []

  // Extract medicine name
  let medicineName: string | null = null
  const medicinePatterns = [
    /(?:medicine|tablet|capsule|syrup)[\s:]+([A-Z][a-zA-Z0-9\s\-]+)/i,
    /([A-Z][a-zA-Z]+\s+\d+\s*(?:mg|ml|tablet|capsule))/i,
  ]

  for (const pattern of medicinePatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      // Exclude batch numbers, license numbers
      if (!/\d{6,}/.test(candidate) && candidate.length > 2 && candidate.length < 50) {
        medicineName = candidate
        break
      }
    }
  }

  // Extract brand name
  let brandName: string | null = null
  const brandPatterns = [
    /(?:brand|manufacturer)[\s:]+([A-Z][a-zA-Z\s&.-]+)/i,
  ]

  for (const pattern of brandPatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const candidate = match[1].trim()
      if (candidate.length > 2 && candidate.length < 50) {
        brandName = candidate
        break
      }
    }
  }

  return {
    expiryDate,
    additionalFields: {
      ...(medicineName && { medicineName }),
      ...(brandName && { brandName }),
    },
    extractionWarnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Extract fields for Other category (SAFE MODE)
 * Extracts expiry date and document type only
 * Ignores names, ID numbers, license numbers, addresses
 */
export function extractOtherFields(ocrText: string): ExtractedFields {
  const expiryDate = extractExpiryDate(ocrText)
  
  // Extract document type for "Other" category
  const documentType = guessDocumentType(ocrText)
  
  return {
    expiryDate,
    productName: null,
    companyName: null,
    additionalFields: documentType ? { documentType } : undefined,
    extractionWarnings: undefined,
  }
}

/**
 * Guess document type from OCR text
 * Used for "Other" category to identify document type
 * Matches the logic in extractBySchema.ts for consistency
 */
function guessDocumentType(text: string): string | null {
  const lower = text.toLowerCase()

  // Driving License detection (most common)
  if (
    lower.includes('driving licence') ||
    lower.includes('driving license') ||
    (lower.includes('driving') && (lower.includes('licence') || lower.includes('license'))) ||
    lower.includes('dl number') ||
    lower.includes('dl no') ||
    (lower.includes('union of india') && lower.includes('driving'))
  ) {
    return 'Driving License'
  }
  
  if (lower.includes('passport')) {
    return 'Passport'
  }
  if (lower.includes('voter')) {
    return 'Voter ID'
  }
  if (lower.includes('ration')) {
    return 'Ration Card'
  }
  if (lower.includes('certificate')) {
    return 'Certificate'
  }
  if (lower.includes('license') || lower.includes('licence')) {
    return 'License'
  }

  return null // Return null if cannot determine, user can enter manually
}

