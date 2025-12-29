// Data Sanitization
// Strips PII and ensures only allowed fields are extracted based on category

import { CategoryKey } from '@/lib/categorySchemas'
import { getCategorySchema } from '@/lib/categorySchemas'

/**
 * PII Patterns to detect and remove
 */
const PII_PATTERNS = [
  // Indian ID numbers
  /\b\d{4}\s?\d{4}\s?\d{4}\b/g, // Aadhaar (12 digits)
  /\b[A-Z]{5}\d{4}[A-Z]\b/g, // PAN
  /\b[A-Z]{2}\d{2}[A-Z]{2}\d{4}\b/g, // Driving License
  
  // Phone numbers (Indian formats)
  /\b[6-9]\d{9}\b/g, // 10-digit mobile
  /\b\+91[6-9]\d{9}\b/g, // +91 format
  /\b0[6-9]\d{9}\b/g, // 0 prefix
  
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Bank account numbers (generic pattern)
  /\b\d{9,18}\b/g, // 9-18 digit numbers (potential account numbers)
  
  // UPI IDs
  /\b[\w.-]+@[\w]+\b/g, // UPI format
]

/**
 * Remove PII from text
 */
export function stripPII(text: string): string {
  let sanitized = text
  
  // Remove PII patterns
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  }
  
  // Remove common PII keywords with their values
  const piiKeywords = [
    /(?:name|full name|fullname)[\s:]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    /(?:father|mother|spouse|wife|husband)[\s:]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/gi,
    /(?:address|residential address)[\s:]*([A-Za-z0-9\s,.-]+)/gi,
    /(?:date of birth|dob|birth date)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
  ]
  
  for (const pattern of piiKeywords) {
    sanitized = sanitized.replace(pattern, (match, value) => {
      return match.replace(value, '[REDACTED]')
    })
  }
  
  return sanitized
}

/**
 * Sanitize extracted data based on category schema
 * Only allows fields defined in the category schema
 */
export function sanitizeExtractedData(
  data: Record<string, any>,
  category: CategoryKey
): Record<string, any> {
  const schema = getCategorySchema(category)
  const sanitized: Record<string, any> = {}
  
  // Only include fields that are in the schema
  const allowedFields = [
    ...schema.requiredFields,
    ...schema.optionalFields,
  ]
  
  for (const field of allowedFields) {
    if (data[field] !== undefined && data[field] !== null) {
      // Strip PII from string values
      if (typeof data[field] === 'string') {
        sanitized[field] = stripPII(data[field])
      } else {
        sanitized[field] = data[field]
      }
    }
  }
  
  // Always include expiryDate if present (universal field)
  if (data.expiryDate) {
    sanitized.expiryDate = data.expiryDate
  }
  
  return sanitized
}

/**
 * Validate that extracted data doesn't contain forbidden patterns
 */
export function validateNoForbiddenData(
  data: Record<string, any>,
  category: CategoryKey
): { valid: boolean; forbiddenFields?: string[] } {
  const schema = getCategorySchema(category)
  const forbiddenFields: string[] = []
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      for (const pattern of schema.forbiddenPatterns) {
        if (pattern.test(value)) {
          forbiddenFields.push(key)
          break
        }
      }
    }
  }
  
  return {
    valid: forbiddenFields.length === 0,
    forbiddenFields: forbiddenFields.length > 0 ? forbiddenFields : undefined,
  }
}

