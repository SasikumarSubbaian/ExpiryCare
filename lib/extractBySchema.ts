// Strict Field Extraction by Category Schema
// Privacy-first: Only extracts whitelisted fields
// Never extracts confidential data

import { CategoryKey, getCategorySchema, sanitizeExtractedData } from './categorySchemas'
import { regexExtract, type ExtractedData } from './ocr/regexExtractor'

export interface SchemaExtractedData {
  category: CategoryKey
  expiryDate: string | null
  productName: string | null
  brand: string | null
  warrantyPeriod: string | null
  serialNumber: string | null
  policyType: string | null
  provider: string | null
  policyNumber: string | null
  serviceProvider: string | null
  contractNumber: string | null
  serviceType: string | null
  serviceName: string | null
  plan: string | null
  subscriptionId: string | null
  medicineName: string | null
  batchNo: string | null
  manufacturer: string | null
  documentType: string | null
  confidence: number
  originalText: string | null
}

/**
 * Extract fields strictly according to category schema
 * Only whitelisted fields are extracted
 * Forbidden patterns are removed
 */
export function extractBySchema(
  ocrText: string,
  category: CategoryKey
): SchemaExtractedData {
  const schema = getCategorySchema(category)
  const result: SchemaExtractedData = {
    category,
    expiryDate: null,
    productName: null,
    brand: null,
    warrantyPeriod: null,
    serialNumber: null,
    policyType: null,
    provider: null,
    policyNumber: null,
    serviceProvider: null,
    contractNumber: null,
    serviceType: null,
    serviceName: null,
    plan: null,
    subscriptionId: null,
    medicineName: null,
    batchNo: null,
    manufacturer: null,
    documentType: null,
    confidence: 0,
    originalText: null,
  }

  // Step 1: Use regex extractor for base extraction
  const regexResult = regexExtract(ocrText)

  // Step 2: Map regex results to schema fields
  // Always extract expiry date (required for all categories)
  result.expiryDate = regexResult.expiryDate
  result.originalText = regexResult.originalText
  result.confidence = regexResult.confidence

  // Map category-specific fields
  if (category === 'warranty') {
    result.productName = regexResult.productName
    result.brand = regexResult.companyName // Brand = Company Name for warranty
  } else if (category === 'insurance') {
    result.provider = regexResult.companyName // Provider = Company Name for insurance
    // Try to extract policy type from text
    result.policyType = extractPolicyType(ocrText)
  } else if (category === 'amc') {
    result.serviceProvider = regexResult.companyName
    result.productName = regexResult.productName
  } else if (category === 'subscription') {
    result.serviceName = regexResult.productName // Service Name = Product Name for subscription
  } else if (category === 'medicine') {
    result.medicineName = regexResult.productName // Medicine Name = Product Name for medicine
    result.batchNo = extractBatchNumber(ocrText)
    result.manufacturer = regexResult.companyName
  } else if (category === 'other') {
    // For "other" category, ONLY extract expiry date and document type
    result.documentType = guessDocumentType(ocrText)
    // Explicitly set all other fields to null
    result.productName = null
    result.brand = null
    // Note: companyName is not part of SchemaExtractedData interface
    // It's only used as a source from regexResult and mapped to category-specific fields
  }

  // Step 3: Sanitize - remove any forbidden data
  const sanitized = sanitizeExtractedData(
    result as Record<string, string | null>,
    category
  )

  // Step 4: Calculate confidence based on required fields
  const requiredFields = schema.requiredFields
  const filledRequiredFields = requiredFields.filter(
    (field) => sanitized[field] && sanitized[field]!.trim().length > 0
  )

  // Confidence: 90% if all required fields filled, 70% if expiry date only, 40% if nothing
  if (filledRequiredFields.length === requiredFields.length) {
    result.confidence = 90
  } else if (result.expiryDate) {
    result.confidence = 70
  } else {
    result.confidence = 40
  }

  // Merge sanitized data back
  Object.assign(result, sanitized)

  return result
}

/**
 * Extract policy type from insurance document text
 */
function extractPolicyType(text: string): string | null {
  const lower = text.toLowerCase()
  const policyTypes = [
    'health insurance',
    'life insurance',
    'term insurance',
    'motor insurance',
    'vehicle insurance',
    'car insurance',
    'bike insurance',
    'travel insurance',
  ]

  for (const type of policyTypes) {
    if (lower.includes(type)) {
      return type
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }
  }

  return null
}

/**
 * Extract batch number from medicine document
 */
function extractBatchNumber(text: string): string | null {
  // Look for "Batch No:" or "Batch Number:" followed by alphanumeric
  const batchPattern = /batch\s*(?:no|number)[:\-]?\s*([A-Z0-9]+)/i
  const match = text.match(batchPattern)
  return match ? match[1].trim() : null
}

/**
 * Guess document type for "other" category
 */
function guessDocumentType(text: string): string | null {
  const lower = text.toLowerCase()

  // Driving License detection (most common)
  if (
    lower.includes('driving licence') ||
    lower.includes('driving license') ||
    lower.includes('driving licence') ||
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

  return 'Document'
}

