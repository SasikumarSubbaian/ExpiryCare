/**
 * Sanitize OCR Text
 * Removes confidential/PII data from OCR text before processing
 * CRITICAL: Never extract, display, or store PII
 */

/**
 * Sanitizes OCR text by removing PII patterns
 * - PAN numbers (A-Z]{5}\d{4}[A-Z])
 * - Aadhaar numbers (12 digits)
 * - DOB patterns
 * - Address patterns
 * - Phone numbers
 * - Email addresses
 */
export function sanitizeOCRText(text: string): string {
  let sanitized = text

  // Remove PAN numbers (format: ABCDE1234F)
  sanitized = sanitized.replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '')

  // Remove Aadhaar numbers (12 digits, may have spaces/dashes)
  sanitized = sanitized.replace(/\b\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/g, '')
  sanitized = sanitized.replace(/\b\d{12}\b/g, '')

  // Remove DOB patterns
  sanitized = sanitized.replace(/\bDOB[:\s]+.*/gi, '')
  sanitized = sanitized.replace(/\bDATE\s+OF\s+BIRTH[:\s]+.*/gi, '')
  sanitized = sanitized.replace(/\bBIRTH\s+DATE[:\s]+.*/gi, '')

  // Remove Address patterns
  sanitized = sanitized.replace(/\bADDRESS[:\s]+.*/gi, '')
  sanitized = sanitized.replace(/\bRESIDENTIAL\s+ADDRESS[:\s]+.*/gi, '')
  sanitized = sanitized.replace(/\bPERMANENT\s+ADDRESS[:\s]+.*/gi, '')

  // Remove Phone numbers (Indian formats)
  sanitized = sanitized.replace(/\b\+?91[\s-]?\d{10}\b/g, '')
  sanitized = sanitized.replace(/\b\d{10}\b/g, '') // Simple 10-digit numbers

  // Remove Email addresses
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '')

  // Remove License numbers (common patterns)
  sanitized = sanitized.replace(/\b[A-Z]{2}\d{2}\d{4}\d{7}\b/g, '') // DL format
  sanitized = sanitized.replace(/\bLICENSE\s+NO[:\s]+.*/gi, '')
  sanitized = sanitized.replace(/\bDL\s+NO[:\s]+.*/gi, '')

  // Remove Passport numbers
  sanitized = sanitized.replace(/\b[A-Z]\d{7}\b/g, '') // Passport format
  sanitized = sanitized.replace(/\bPASSPORT\s+NO[:\s]+.*/gi, '')

  // Remove Blood Group
  sanitized = sanitized.replace(/\bBLOOD\s+GROUP[:\s]+.*/gi, '')
  sanitized = sanitized.replace(/\bB[+\-]?\b/gi, '')

  // Remove Name patterns (if they appear in specific contexts)
  // Only remove if clearly labeled as name
  sanitized = sanitized.replace(/\bNAME[:\s]+[A-Z\s]{3,30}/gi, '')
  sanitized = sanitized.replace(/\bFULL\s+NAME[:\s]+[A-Z\s]{3,30}/gi, '')
  sanitized = sanitized.replace(/\bCUSTOMER\s+NAME[:\s]+[A-Z\s]{3,30}/gi, '')
  sanitized = sanitized.replace(/\bPATIENT\s+NAME[:\s]+[A-Z\s]{3,30}/gi, '')

  // Clean up multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  return sanitized
}

