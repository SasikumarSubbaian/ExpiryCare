// Enhanced Expiry Date Detection
// Supports all real-world formats with high accuracy

export interface ExpiryDetectionResult {
  expiryDate: string | null // YYYY-MM-DD format
  originalText: string | null // Original matched text
  confidence: number // 0-100
  sourceKeyword: string | null // Which keyword triggered detection
  format: string | null // Detected format (e.g., "MM/YYYY", "AUG 2024")
}

// Master keyword list for expiry detection
const EXPIRY_KEYWORDS = [
  'subscription ends on',
  'plan valid till',
  'membership valid up to',
  'membership expiry',
  'next renewal date',
  'renewal due on',
  'billing cycle ends',
  'access valid till',
  'expiry date',
  'exp date',
  'exp',
  'valid till',
  'valid until',
  'valid upto',
  'valid up to',
  'warranty till',
  'warranty upto',
  'expires on',
  'expires',
  'best before',
  'use by',
  'use before',
]

// Month name mappings
const MONTH_NAMES: Record<string, number> = {
  'JAN': 0, 'JANUARY': 0,
  'FEB': 1, 'FEBRUARY': 1,
  'MAR': 2, 'MARCH': 2,
  'APR': 3, 'APRIL': 3,
  'MAY': 4,
  'JUN': 5, 'JUNE': 5,
  'JUL': 6, 'JULY': 6,
  'AUG': 7, 'AUGUST': 7,
  'SEP': 8, 'SEPTEMBER': 8, 'SEPT': 8,
  'OCT': 9, 'OCTOBER': 9,
  'NOV': 10, 'NOVEMBER': 10,
  'DEC': 11, 'DECEMBER': 11,
}

/**
 * Convert month-year to last day of month
 * "AUG 2024" → "2024-08-31"
 * "08/2024" → "2024-08-31"
 * "00/2028" → "2028-12-31" (special case for Indian products)
 */
export function monthYearToLastDate(month: string | number, year: string | number): string {
  let monthNum: number
  let yearNum: number

  // Parse month
  if (typeof month === 'string') {
    const monthUpper = month.toUpperCase().trim()
    monthNum = MONTH_NAMES[monthUpper] ?? parseInt(monthUpper, 10) - 1
  } else {
    monthNum = month - 1
  }

  // Handle special case: "00" or "0" month → December
  if (monthNum < 0 || monthNum === 0 && month === '00') {
    monthNum = 11 // December
  }

  // Ensure valid month range
  if (monthNum < 0 || monthNum > 11) {
    monthNum = 11 // Default to December
  }

  // Parse year
  if (typeof year === 'string') {
    yearNum = parseInt(year, 10)
    // Handle 2-digit years
    if (yearNum < 100) {
      if (yearNum < 50) {
        yearNum += 2000 // 00-49 → 2000-2049
      } else {
        yearNum += 1900 // 50-99 → 1950-1999
      }
    }
  } else {
    yearNum = year
  }

  // Get last day of month
  const lastDay = new Date(yearNum, monthNum + 1, 0).getDate()

  // Format as YYYY-MM-DD
  const monthStr = String(monthNum + 1).padStart(2, '0')
  return `${yearNum}-${monthStr}-${String(lastDay).padStart(2, '0')}`
}

/**
 * Enhanced expiry date detection with multiple format support
 */
export function detectExpiryDate(text: string): ExpiryDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      expiryDate: null,
      originalText: null,
      confidence: 0,
      sourceKeyword: null,
      format: null,
    }
  }

  const upperText = text.toUpperCase()
  let bestMatch: ExpiryDetectionResult | null = null
  let highestConfidence = 0

  // Pattern 1: "Valid Till: DD/MM/YYYY" or "Valid Till: DD-MM-YYYY" (HIGHEST PRIORITY)
  const validTillPattern = /VALID\s+TILL[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i
  const validTillMatch = upperText.match(validTillPattern)
  if (validTillMatch) {
    const day = parseInt(validTillMatch[1], 10)
    const month = parseInt(validTillMatch[2], 10)
    let year = parseInt(validTillMatch[3], 10)
    if (year < 100) year += year < 50 ? 2000 : 1900

    const expiryDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return {
      expiryDate,
      originalText: validTillMatch[0],
      confidence: 95,
      sourceKeyword: 'valid till',
      format: 'DD/MM/YYYY',
    }
  }

  // Pattern 2: "Valid Till: AUG 2024" or "Valid Till: SEP 2026"
  const validTillMonthPattern = /VALID\s+TILL[:\-]?\s*([A-Z]{3,9})\s+(\d{2,4})/i
  const validTillMonthMatch = upperText.match(validTillMonthPattern)
  if (validTillMonthMatch) {
    const expiryDate = monthYearToLastDate(validTillMonthMatch[1], validTillMonthMatch[2])
    return {
      expiryDate,
      originalText: validTillMonthMatch[0],
      confidence: 95,
      sourceKeyword: 'valid till',
      format: 'MMM YYYY',
    }
  }

  // Pattern 3: "Expiry Date: DD/MM/YYYY" or "EXP: DD-MM-YYYY"
  const expiryDatePattern = /EXP(?:IRY)?\s*DATE[:\-]?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i
  const expiryDateMatch = upperText.match(expiryDatePattern)
  if (expiryDateMatch) {
    const day = parseInt(expiryDateMatch[1], 10)
    const month = parseInt(expiryDateMatch[2], 10)
    let year = parseInt(expiryDateMatch[3], 10)
    if (year < 100) year += year < 50 ? 2000 : 1900

    const expiryDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return {
      expiryDate,
      originalText: expiryDateMatch[0],
      confidence: 90,
      sourceKeyword: 'expiry date',
      format: 'DD/MM/YYYY',
    }
  }

  // Pattern 4: "Expiry Date: AUG 2024" or "EXP: SEP 2026"
  const expiryMonthPattern = /EXP(?:IRY)?\s*DATE[:\-]?\s*([A-Z]{3,9})\s+(\d{2,4})/i
  const expiryMonthMatch = upperText.match(expiryMonthPattern)
  if (expiryMonthMatch) {
    const expiryDate = monthYearToLastDate(expiryMonthMatch[1], expiryMonthMatch[2])
    return {
      expiryDate,
      originalText: expiryMonthMatch[0],
      confidence: 90,
      sourceKeyword: 'expiry date',
      format: 'MMM YYYY',
    }
  }

  // Pattern 5: "EXP: 08/2024" or "EXP: 07/27" (2-digit year)
  const expiryMonthYearPattern = /(?:EXP|EXPIRY|VALID|WARRANTY|BEST\s+BEFORE|USE\s+BY)[:\-]?\s*(\d{1,2})[\/\-](\d{2,4})/i
  const expiryMonthYearMatch = upperText.match(expiryMonthYearPattern)
  if (expiryMonthYearMatch) {
    const expiryDate = monthYearToLastDate(expiryMonthYearMatch[1], expiryMonthYearMatch[2])
    return {
      expiryDate,
      originalText: expiryMonthYearMatch[0],
      confidence: 85,
      sourceKeyword: 'exp',
      format: 'MM/YYYY',
    }
  }

  // Pattern 6: Standalone "AUG 2024" near expiry keywords
  for (const keyword of EXPIRY_KEYWORDS) {
    const keywordIndex = upperText.indexOf(keyword.toUpperCase())
    if (keywordIndex !== -1) {
      // Look for month-year within 50 characters after keyword
      const searchText = upperText.substring(keywordIndex, keywordIndex + 50)
      const monthYearPattern = /([A-Z]{3,9})\s+(\d{2,4})/
      const monthYearMatch = searchText.match(monthYearPattern)
      
      if (monthYearMatch) {
        const expiryDate = monthYearToLastDate(monthYearMatch[1], monthYearMatch[2])
        const confidence = keyword.includes('expiry') || keyword.includes('valid till') ? 85 : 70
        
        if (confidence > highestConfidence) {
          bestMatch = {
            expiryDate,
            originalText: monthYearMatch[0],
            confidence,
            sourceKeyword: keyword,
            format: 'MMM YYYY',
          }
          highestConfidence = confidence
        }
      }
    }
  }

  // Pattern 7: Standalone month-year "AUG 2024" (lower confidence)
  if (!bestMatch || highestConfidence < 70) {
    const standalonePattern = /\b([A-Z]{3,9})\s+(\d{4})\b/
    const standaloneMatch = upperText.match(standalonePattern)
    if (standaloneMatch) {
      const expiryDate = monthYearToLastDate(standaloneMatch[1], standaloneMatch[2])
      return {
        expiryDate,
        originalText: standaloneMatch[0],
        confidence: 60,
        sourceKeyword: null,
        format: 'MMM YYYY',
      }
    }
  }

  return bestMatch || {
    expiryDate: null,
    originalText: null,
    confidence: 0,
    sourceKeyword: null,
    format: null,
  }
}

