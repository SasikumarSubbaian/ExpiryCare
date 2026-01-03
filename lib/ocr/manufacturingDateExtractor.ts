/**
 * Manufacturing Date Extraction
 * For Medicine category only
 * Handles various MFG date formats with OCR error correction
 */

export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export interface ManufacturingDateResult {
  value: string | null // YYYY-MM-DD format
  confidence: ConfidenceLevel
  sourceKeyword: string | null
  rawValue?: string // Original extracted value
}

/**
 * Month abbreviations map
 */
const monthMap: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
}

/**
 * Normalize OCR text to handle common OCR errors
 * STEP 1: TEXT NORMALIZATION (MANDATORY)
 */
function normalizeOCRText(text: string): string {
  let normalized = text.toUpperCase()
  
  // Replace common OCR errors
  // MF0, MFO, MF6, MFC, MF9 → MFG (9 is common OCR error for G)
  normalized = normalized.replace(/MF[0O6C9]/g, 'MFG')
  
  // O → 0 when near numbers (but be careful not to break words)
  normalized = normalized.replace(/(\d)O(\d)/g, '$10$2')
  normalized = normalized.replace(/(\d)O([^A-Za-z])/g, '$10$2')
  normalized = normalized.replace(/([^A-Za-z])O(\d)/g, '$10$2')
  
  // | → 1 (pipe to one)
  normalized = normalized.replace(/\|/g, '1')
  
  // , → . (comma to period in dates)
  normalized = normalized.replace(/,/g, '.')
  
  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ')
  
  // Replace newlines with space
  normalized = normalized.replace(/\n/g, ' ')
  
  return normalized.trim()
}

/**
 * Standardize date to ISO format (YYYY-MM-DD)
 * STEP 5: DATE STANDARDIZATION (CRITICAL)
 */
function standardizeDate(input: string): string | null {
  const cleaned = input.trim().replace(/\s+/g, '')
  
  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY (e.g., 15-03-2023)
  const ddmmyyyy = cleaned.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/)
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10)
    const month = parseInt(ddmmyyyy[2], 10)
    const year = parseInt(ddmmyyyy[3], 10)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  
  // Pattern 2: MM/YYYY or MM-YYYY (e.g., 02/2024 or 12/2025) → 2024-02-01 or 2025-12-01
  // 🔧 CRITICAL: Handle both 1-digit and 2-digit months (e.g., 12/2025)
  const mmyyyy = cleaned.match(/^(\d{1,2})[\/\-](\d{4})$/)
  if (mmyyyy) {
    const month = parseInt(mmyyyy[1], 10)
    const year = parseInt(mmyyyy[2], 10)
    if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-01`
    }
  }
  
  // Pattern 3: MM/YY or MM-YY (e.g., 08-22) → 2022-08-01
  const mmyy = cleaned.match(/^(\d{2})[\/\-](\d{2})$/)
  if (mmyy) {
    const month = parseInt(mmyy[1], 10)
    let year2Digit = parseInt(mmyy[2], 10)
    // Convert 2-digit year: 00-50 = 2000-2050, 51-99 = 1951-1999
    const year = year2Digit < 50 ? 2000 + year2Digit : 1900 + year2Digit
    if (month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-01`
    }
  }
  
  // Pattern 4: MMM YYYY (e.g., JAN 2024) → 2024-01-01
  const mmmYYYY = cleaned.match(/^([A-Z]{3,9})\s+(\d{4})$/)
  if (mmmYYYY) {
    const monthName = mmmYYYY[1]
    const month = monthMap[monthName]
    const year = parseInt(mmmYYYY[2], 10)
    if (month && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-01`
    }
  }
  
  // Pattern 5: YYYY only (e.g., 2023) → 2023-01-01
  const yyyy = cleaned.match(/^(\d{4})$/)
  if (yyyy) {
    const year = parseInt(yyyy[1], 10)
    if (year >= 1900 && year <= 2100) {
      return `${year}-01-01`
    }
  }
  
  return null
}

/**
 * Extract manufacturing date from OCR text
 * STEP 4: IMPLEMENTATION (PRODUCTION-READY)
 */
export function extractManufacturingDate(rawText: string): ManufacturingDateResult {
  if (!rawText || rawText.trim().length === 0) {
    return {
      value: null,
      confidence: 'Low',
      sourceKeyword: null,
    }
  }

  // STEP 1: Normalize text
  const text = normalizeOCRText(rawText)

  // STEP 2: Primary Patterns (Most Common)
  const MFG_PATTERNS = [
    // Pattern 1: MFG: 02/2024 or 02-2024
    /MFG(?:\.| DATE| DT)?\s*[:\-]?\s*(\d{2}[\/\-]\d{4})/i,
    
    // Pattern 2: MFG.Dt.12/2025 (with dot after MFG and Dt) - HIGHEST PRIORITY for this format
    /MFG\.?\s*DT\.?\s*(\d{1,2}[\/\-]\d{4})/i,
    
    // Pattern 2.5: MFG.Dt.12/25 (with dot, 2-digit year)
    /MFG\.?\s*DT\.?\s*(\d{1,2}[\/\-]\d{2})/i,
    
    // Pattern 3: MFG: JAN 2024
    /MFG(?:\.| DATE| DT)?\s*[:\-]?\s*([A-Z]{3,9}\s+\d{4})/i,
    
    // Pattern 4: MFG: 15-03-2023
    /MFG(?:\.| DATE| DT)?\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    
    // Pattern 5: Manufactured on 2023
    /MANUFACTURED\s*(ON)?\s*[:\-]?\s*(\d{4})/i,
    
    // Pattern 6: MFD: JAN 2024
    /MFD\s*[:\-]?\s*([A-Z]{3,9}\s+\d{4})/i,
    
    // Pattern 7: Mfg Dt: 15-03-2023
    /Mfg\s+DT\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
    
    // Pattern 8: Mfg.: 02/2024
    /Mfg\.\s*[:\-]?\s*(\d{2}[\/\-]\d{4})/i,
    
    // Pattern 9: Date of Mfg: 15-03-2023
    /DATE\s+OF\s+MFG\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
  ]

  // Try primary patterns
  for (const pattern of MFG_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      // Extract date string (could be in match[1] or match[2] depending on pattern)
      const dateStr = match[1] || match[2]
      if (dateStr) {
        const standardized = standardizeDate(dateStr)
        if (standardized) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[ManufacturingDateExtractor] Found MFG date:', dateStr, '->', standardized)
          }
          return {
            value: standardized,
            confidence: 'High',
            sourceKeyword: 'MFG',
            rawValue: dateStr,
          }
        }
      }
    }
  }

  // STEP 3: Fallback Pattern - MFG MM-YY EXP MM-YY
  // Many strips print: MFG 08-22 EXP 07-24 or "Mfg. Date:\n...\n08/25 EXP"
  // 🔧 CRITICAL: Handle "08/25 EXP" format where date BEFORE EXP is manufacturing date
  const fallbackPattern = /MFG\s*(\d{2}[\/\-]\d{2})\s*EXP/i
  const fallbackMatch = text.match(fallbackPattern)
  if (fallbackMatch && fallbackMatch[1]) {
    const standardized = standardizeDate(fallbackMatch[1])
    if (standardized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ManufacturingDateExtractor] Found MFG from fallback pattern:', fallbackMatch[1], '->', standardized)
      }
      return {
        value: standardized,
        confidence: 'Medium',
        sourceKeyword: 'MFG',
        rawValue: fallbackMatch[1],
      }
    }
  }
  
  // 🔧 CRITICAL FIX: Handle "MM/YY EXP" format where date appears before EXP
  // REAL-WORLD: "Mfg. Date:\nRP0942USP 3.2RS/U\n08/25 EXP" - "08/25" is MFG date
  // Look for date pattern that appears before "EXP" keyword (within context of Mfg Date)
  const mfgDateBeforeExpPattern = /(?:MFG|Mfg|MFG\.?\s*DATE|Mfg\.?\s*Date)[\s\S]{0,100}?(\d{1,2}[\/\-]\d{2})\s*EXP/i
  const mfgDateBeforeExpMatch = rawText.match(mfgDateBeforeExpPattern)
  if (mfgDateBeforeExpMatch && mfgDateBeforeExpMatch[1]) {
    const dateStr = mfgDateBeforeExpMatch[1].trim()
    const standardized = standardizeDate(dateStr)
    if (standardized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[ManufacturingDateExtractor] Found MFG date before EXP:', dateStr, '->', standardized)
      }
      return {
        value: standardized,
        confidence: 'High',
        sourceKeyword: 'MFG',
        rawValue: dateStr,
      }
    }
  }
  
  // 🔧 ADDITIONAL: Look for "MM/YY" pattern near "Mfg. Date:" keyword (multiline)
  // Pattern: "Mfg. Date:\n...\n08/25" (date on line after Mfg Date)
  const mfgMultilinePattern = /Mfg\.?\s*(?:Date|Dt)?\s*[:\-]?[\s\S]{0,50}?(\d{1,2}[\/\-]\d{2})(?![\s\S]{0,20}?EXP)/i
  const mfgMultilineMatch = rawText.match(mfgMultilinePattern)
  if (mfgMultilineMatch && mfgMultilineMatch[1]) {
    const dateStr = mfgMultilineMatch[1].trim()
    // Make sure it's not the expiry date (expiry would be after EXP keyword)
    const dateIndex = rawText.indexOf(dateStr)
    const expIndex = rawText.toUpperCase().indexOf('EXP')
    // If date appears before EXP or EXP doesn't exist, it's likely MFG date
    if (expIndex === -1 || dateIndex < expIndex) {
      const standardized = standardizeDate(dateStr)
      if (standardized) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[ManufacturingDateExtractor] Found MFG date (multiline):', dateStr, '->', standardized)
        }
        return {
          value: standardized,
          confidence: 'High',
          sourceKeyword: 'MFG',
          rawValue: dateStr,
        }
      }
    }
  }

  // No match found
  return {
    value: null,
    confidence: 'Low',
    sourceKeyword: null,
  }
}
