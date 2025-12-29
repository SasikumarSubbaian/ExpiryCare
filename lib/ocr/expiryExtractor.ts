/**
 * Expiry Date Extraction
 * Primary and universal field across all categories
 */

export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export interface ExpiryDateResult {
  value: string | null // YYYY-MM-DD format
  confidence: ConfidenceLevel
  sourceKeyword: string | null
  rawValue?: string // Original extracted value
}

/**
 * Master keyword list for expiry date detection
 */
const expiryKeywords = [
  'expiry date',
  'expires on',
  'valid till',
  'valid upto',
  'valid up to',
  'use before',
  'best before',
  'exp',
  'exp dt',
  'bbd',
  'policy expiry',
  'warranty expires',
  'amc valid till',
  'subscription ends on',
  'next renewal date',
  'renewal date',
  'valid until',
  'expiration date',
  'expiry',
  'validity',
  'valid through',
]

/**
 * Date format patterns
 */
const datePatterns = [
  // DD/MM/YYYY or DD-MM-YYYY
  /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/g,
  // YYYY-MM-DD or YYYY/MM/DD
  /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/g,
  // MMM YYYY (e.g., AUG 2024, SEP 2025)
  /([A-Z]{3})\s+(\d{4})/g,
  // MM/YYYY or MM-YYYY
  /(\d{1,2})[-\/](\d{4})/g,
  // YYYY only
  /(\d{4})/g,
]

/**
 * Month abbreviations
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
 * Converts date string to YYYY-MM-DD format
 */
function normalizeDate(
  day: number | null,
  month: number | null,
  year: number
): string | null {
  // If only year provided, use last day of year
  if (day === null && month === null) {
    return `${year}-12-31`
  }

  // If only month and year, use last day of month
  if (day === null && month !== null) {
    const lastDay = new Date(year, month, 0).getDate()
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  }

  // Full date
  if (day !== null && month !== null) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return null
}

/**
 * Parses date from various formats
 */
function parseDate(dateStr: string): { day: number | null; month: number | null; year: number } | null {
  // Try DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = dateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/)
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10)
    const month = parseInt(ddmmyyyy[2], 10)
    let year = parseInt(ddmmyyyy[3], 10)
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { day, month, year }
    }
  }

  // Try YYYY-MM-DD or YYYY/MM/DD
  const yyyymmdd = dateStr.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/)
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10)
    const month = parseInt(yyyymmdd[2], 10)
    const day = parseInt(yyyymmdd[3], 10)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { day, month, year }
    }
  }

  // Try MMM YYYY (e.g., AUG 2024)
  const mmmYYYY = dateStr.match(/^([A-Z]{3})\s+(\d{4})$/)
  if (mmmYYYY) {
    const month = monthMap[mmmYYYY[1]]
    const year = parseInt(mmmYYYY[2], 10)
    if (month) {
      return { day: null, month, year }
    }
  }

  // Try MM/YYYY or MM-YYYY
  const mmYYYY = dateStr.match(/^(\d{1,2})[-\/](\d{4})$/)
  if (mmYYYY) {
    const month = parseInt(mmYYYY[1], 10)
    const year = parseInt(mmYYYY[2], 10)
    if (month >= 1 && month <= 12) {
      return { day: null, month, year }
    }
  }

  // Try YYYY only
  const yyyy = dateStr.match(/^(\d{4})$/)
  if (yyyy) {
    const year = parseInt(yyyy[1], 10)
    if (year >= 2000 && year <= 2100) {
      return { day: null, month: null, year }
    }
  }

  return null
}

/**
 * Checks if date is likely DOB, Issue Date, or MFG Date (not expiry)
 */
function isLikelyNotExpiry(dateStr: string, context: string): boolean {
  const lowerContext = context.toLowerCase()

  // Check for DOB indicators
  const dobKeywords = ['dob', 'date of birth', 'born', 'birth date']
  if (dobKeywords.some((kw) => lowerContext.includes(kw))) {
    return true
  }

  // Check for issue date indicators
  const issueKeywords = ['issue date', 'issued on', 'date of issue', 'issued']
  if (issueKeywords.some((kw) => lowerContext.includes(kw))) {
    return true
  }

  // Check for MFG date indicators
  const mfgKeywords = ['mfg', 'manufacturing', 'manufactured', 'production date']
  if (mfgKeywords.some((kw) => lowerContext.includes(kw))) {
    return true
  }

  // Check if date is too old (likely DOB or issue date)
  const parsed = parseDate(dateStr)
  if (parsed) {
    const date = new Date(parsed.year, (parsed.month || 1) - 1, parsed.day || 1)
    const yearsAgo = new Date().getFullYear() - date.getFullYear()
    if (yearsAgo > 20) {
      return true // Likely DOB or issue date
    }
  }

  return false
}

/**
 * Extracts expiry date from OCR text
 */
export function extractExpiryDate(ocrText: string): ExpiryDateResult {
  const text = ocrText.toUpperCase()
  let bestMatch: {
    date: string
    keyword: string | null
    distance: number
    confidence: ConfidenceLevel
  } | null = null

  // Search for expiry keywords with nearby dates
  for (const keyword of expiryKeywords) {
    const keywordUpper = keyword.toUpperCase()
    const keywordIndex = text.indexOf(keywordUpper)

    if (keywordIndex === -1) continue

    // Extract context around keyword (200 characters)
    const start = Math.max(0, keywordIndex - 100)
    const end = Math.min(text.length, keywordIndex + keyword.length + 100)
    const context = text.substring(start, end)

      // Find dates in context
      for (const pattern of datePatterns) {
        const matches = Array.from(context.matchAll(pattern))
        for (const match of matches) {
        const dateStr = match[0].trim()

        // Skip if likely not expiry date
        if (isLikelyNotExpiry(dateStr, context)) {
          continue
        }

        // Calculate distance from keyword
        const dateIndex = context.indexOf(dateStr)
        const distance = Math.abs(dateIndex - (keywordIndex - start))

        // Parse date
        const parsed = parseDate(dateStr)
        if (!parsed) continue

        // Determine confidence
        let confidence: ConfidenceLevel = 'Medium'
        if (distance < 50 && keyword) {
          confidence = 'High'
        } else if (distance < 100) {
          confidence = 'Medium'
        } else {
          confidence = 'Low'
        }

        // If month-only or year-only, reduce confidence
        if (parsed.day === null) {
          confidence = confidence === 'High' ? 'Medium' : 'Low'
        }

        // Keep best match (closest to keyword, highest confidence)
        if (
          !bestMatch ||
          (confidence === 'High' && bestMatch.confidence !== 'High') ||
          (confidence === bestMatch.confidence && distance < bestMatch.distance)
        ) {
          bestMatch = {
            date: dateStr,
            keyword,
            distance,
            confidence,
          }
        }
      }
    }
  }

  // If no keyword match, try to find any date (lower confidence)
  if (!bestMatch) {
    for (const pattern of datePatterns) {
      const matches = Array.from(text.matchAll(pattern))
      for (const match of matches) {
        const dateStr = match[0].trim()

        // Skip if likely not expiry
        if (isLikelyNotExpiry(dateStr, text)) {
          continue
        }

        const parsed = parseDate(dateStr)
        if (!parsed) continue

        // Low confidence for dates without keywords
        bestMatch = {
          date: dateStr,
          keyword: null,
          distance: Infinity,
          confidence: 'Low',
        }
        break // Take first reasonable date
      }
    }
  }

  // Convert to normalized format
  if (bestMatch) {
    const parsed = parseDate(bestMatch.date)
    if (parsed) {
      const normalized = normalizeDate(parsed.day, parsed.month, parsed.year)
      if (normalized) {
        return {
          value: normalized,
          confidence: bestMatch.confidence,
          sourceKeyword: bestMatch.keyword,
          rawValue: bestMatch.date,
        }
      }
    }
  }

  return {
    value: null,
    confidence: 'Low',
    sourceKeyword: null,
  }
}

