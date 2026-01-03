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
  // 🔧 CRITICAL FIX: MM/YY or MM-YY (e.g., 08/25, 12/26) - 2-digit year
  /(\d{1,2})[-\/](\d{2})(?!\d)/g,
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
  // 🔧 CRITICAL: Clean the date string first (remove extra spaces)
  const cleanDateStr = dateStr.trim().replace(/\s+/g, '')
  
  // 🔧 CRITICAL: Try DD/MM/YYYY or DD-MM-YYYY (most common in Indian documents)
  // Handle both 2-digit and 4-digit years
  const ddmmyyyy = cleanDateStr.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/)
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10)
    const month = parseInt(ddmmyyyy[2], 10)
    let year = parseInt(ddmmyyyy[3], 10)
    
    // Handle 2-digit years: 00-50 = 2000-2050, 51-99 = 1951-1999
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year
    }
    
    // Validate: month 1-12, day 1-31, year reasonable (1900-2100)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return { day, month, year }
    }
  }

  // Try YYYY-MM-DD or YYYY/MM/DD
  const yyyymmdd = cleanDateStr.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/)
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10)
    const month = parseInt(yyyymmdd[2], 10)
    const day = parseInt(yyyymmdd[3], 10)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { day, month, year }
    }
  }

  // Try MMM YYYY (e.g., AUG 2024) - keep original for this one as spaces are needed
  const mmmYYYY = dateStr.trim().match(/^([A-Z]{3})\s+(\d{4})$/)
  if (mmmYYYY) {
    const month = monthMap[mmmYYYY[1]]
    const year = parseInt(mmmYYYY[2], 10)
    if (month) {
      return { day: null, month, year }
    }
  }

  // Try MM/YYYY or MM-YYYY
  const mmYYYY = cleanDateStr.match(/^(\d{1,2})[-\/](\d{4})$/)
  if (mmYYYY) {
    const month = parseInt(mmYYYY[1], 10)
    const year = parseInt(mmYYYY[2], 10)
    if (month >= 1 && month <= 12) {
      return { day: null, month, year }
    }
  }

  // 🔧 CRITICAL FIX: Try MM/YY or MM-YY (2-digit year, e.g., 08/25 = August 2025)
  const mmYY = cleanDateStr.match(/^(\d{1,2})[-\/](\d{2})$/)
  if (mmYY) {
    const month = parseInt(mmYY[1], 10)
    let year = parseInt(mmYY[2], 10)
    // Convert 2-digit year: 00-50 = 2000-2050, 51-99 = 1951-1999
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year
    }
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      return { day: null, month, year }
    }
  }

  // Try YYYY only
  const yyyy = cleanDateStr.match(/^(\d{4})$/)
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
 * 🔧 ENHANCED: Handles "Valid Till", "Valid Until", and all other expiry keywords
 */
export function extractExpiryDate(ocrText: string): ExpiryDateResult {
  const text = ocrText.toUpperCase()
  let bestMatch: {
    date: string
    keyword: string | null
    distance: number
    confidence: ConfidenceLevel
  } | null = null

  // 🔧 CRITICAL FIX: First, try direct pattern matching for "Valid Till" with date
  // Handle multiple formats: "Valid Till: 27-08-2038", "Valid Till 27-08-2038", "Valid Till\n27-08-2038"
  // Use multiline and more flexible patterns to handle OCR variations
  const validTillPatterns = [
    // Pattern 1: "Valid Till: 27-08-2038" or "Valid Till 27-08-2038" (same line)
    /VALID\s+TILL\s*[:\-]?\s*(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/i,
    // Pattern 2: "Valid Till" on one line, date on next line (multiline)
    /VALID\s+TILL[:\-]?\s*\n\s*(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/im,
    // Pattern 3: "Valid Till" followed by date within 50 chars (more lenient)
    /VALID\s+TILL[:\-]?\s*[\s\S]{0,50}?(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/i,
    // Pattern 4: Handle OCR errors - "ValidTill" (no space) or "ValidTil" (missing L)
    /VALID\s*TIL[L]?\s*[:\-]?\s*(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/i,
    // Pattern 5: Very flexible - "Valid" + "Till" separated, date nearby
    /VALID[\s\S]{0,10}TIL[L]?[\s\S]{0,30}?(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/i,
  ]
  
  for (const pattern of validTillPatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const dateStr = match[1].trim().replace(/\s+/g, '') // Remove all spaces
      const parsed = parseDate(dateStr)
      if (parsed) {
        const normalized = normalizeDate(parsed.day, parsed.month, parsed.year)
        if (normalized) {
          // Log for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.log('[ExpiryExtractor] Found Valid Till:', dateStr, '->', normalized)
          }
          return {
            value: normalized,
            confidence: 'High',
            sourceKeyword: 'valid till',
            rawValue: dateStr,
          }
        }
      }
    }
  }

  // Also try "Valid Until" patterns (similar flexibility)
  const validUntilPatterns = [
    /VALID\s+UNTIL\s*[:\-]?\s*(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/i,
    /VALID\s+UNTIL[:\-]?\s*\n\s*(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/im,
    /VALID\s+UNTIL[:\-]?\s*[\s\S]{0,50}?(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/i,
    /VALID\s*UNTIL[:\-]?\s*(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/i,
    /VALID[\s\S]{0,10}UNTIL[\s\S]{0,30}?(\d{1,2}\s*[-\/]\s*\d{1,2}\s*[-\/]\s*\d{2,4})/i,
  ]
  
  for (const pattern of validUntilPatterns) {
    const match = ocrText.match(pattern)
    if (match && match[1]) {
      const dateStr = match[1].trim().replace(/\s+/g, '')
      const parsed = parseDate(dateStr)
      if (parsed) {
        const normalized = normalizeDate(parsed.day, parsed.month, parsed.year)
        if (normalized) {
          // Log for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.log('[ExpiryExtractor] Found Valid Until:', dateStr, '->', normalized)
          }
          return {
            value: normalized,
            confidence: 'High',
            sourceKeyword: 'valid until',
            rawValue: dateStr,
          }
        }
      }
    }
  }

  // 🔧 CRITICAL FIX: Pattern for "MM/YY EXP" or "MM-YY EXP" format (e.g., "08/25 EXP")
  // This is common on product packaging
  const expPatterns = [
    // Pattern 1: "08/25 EXP" or "08-25 EXP" (same line)
    /(\d{1,2})[-\/](\d{2})\s+EXP/i,
    // Pattern 2: "EXP 08/25" or "EXP 08-25"
    /EXP\s+(\d{1,2})[-\/](\d{2})/i,
    // Pattern 3: "08/25 EXP" with optional colon or other separators
    /(\d{1,2})[-\/](\d{2})\s*[:\-]?\s*EXP/i,
    // Pattern 4: Multiline - "EXP" on one line, date on next
    /EXP[:\-]?\s*\n\s*(\d{1,2})[-\/](\d{2})/im,
    // Pattern 5: Date before "EXP" within 20 chars
    /(\d{1,2})[-\/](\d{2})[\s\S]{0,20}?EXP/i,
  ]

  for (const pattern of expPatterns) {
    const match = ocrText.match(pattern)
    if (match) {
      // Extract month and year from match
      let month: number, year: number
      if (match[1] && match[2]) {
        month = parseInt(match[1], 10)
        let year2Digit = parseInt(match[2], 10)
        // Convert 2-digit year: 00-50 = 2000-2050, 51-99 = 1951-1999
        year = year2Digit < 50 ? 2000 + year2Digit : 1900 + year2Digit
      } else {
        continue
      }

      if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        const normalized = normalizeDate(null, month, year) // Month-only, use last day of month
        if (normalized) {
          // Log for debugging (only in development)
          if (process.env.NODE_ENV === 'development') {
            console.log('[ExpiryExtractor] Found EXP format:', `${month}/${year % 100}`, '->', normalized)
          }
          return {
            value: normalized,
            confidence: 'High',
            sourceKeyword: 'exp',
            rawValue: `${month}/${year % 100}`,
          }
        }
      }
    }
  }

  // 🔧 CRITICAL: Search for expiry keywords with nearby dates
  // This includes "Valid Till", "Valid Until", "Expiry Date", etc.
  // 🔧 ENHANCED: Prioritize "Valid Till" and "Valid Until" for better matching
  const prioritizedKeywords = [
    'valid till',
    'valid until',
    ...expiryKeywords.filter(k => k !== 'valid till' && k !== 'valid until')
  ]
  
  for (const keyword of prioritizedKeywords) {
    const keywordUpper = keyword.toUpperCase()
    // 🔧 FIX: Use case-insensitive search with word boundaries for better matching
    const keywordRegex = new RegExp(`\\b${keywordUpper.replace(/\s+/g, '\\s+')}\\b`, 'i')
    const keywordMatch = text.match(keywordRegex)
    
    if (!keywordMatch) continue
    
    const keywordIndex = keywordMatch.index!
    const keywordLength = keywordMatch[0].length

    // 🔧 ENHANCED: Extract larger context around keyword (400 characters) for "Valid Till"
    // This handles cases where date might be on a different line
    const contextSize = (keyword === 'valid till' || keyword === 'valid until') ? 200 : 150
    const start = Math.max(0, keywordIndex - contextSize)
    const end = Math.min(text.length, keywordIndex + keywordLength + contextSize)
    const context = text.substring(start, end)

    // Find dates in context
    for (const pattern of datePatterns) {
      const matches = Array.from(context.matchAll(pattern))
      for (const match of matches) {
        let dateStr = match[0].trim()
        
        // 🔧 CRITICAL FIX: Handle MM/YY format from datePatterns
        // If pattern matched MM/YY (2-digit year), we need to convert it
        if (match.length >= 3 && match[2] && match[2].length === 2 && !match[3]) {
          // This is MM/YY format - convert to full year
          const month = parseInt(match[1], 10)
          let year2Digit = parseInt(match[2], 10)
          if (month >= 1 && month <= 12) {
            const year = year2Digit < 50 ? 2000 + year2Digit : 1900 + year2Digit
            if (year >= 2000 && year <= 2100) {
              dateStr = `${month}/${year2Digit}` // Keep original format for parsing
            }
          }
        }

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

        // 🔧 ENHANCED: Determine confidence based on keyword type and distance
        let confidence: ConfidenceLevel = 'Medium'
        
        // High confidence keywords (explicit expiry indicators)
        const highConfidenceKeywords = ['valid till', 'valid until', 'expiry date', 'expires on', 'expiration date']
        if (highConfidenceKeywords.includes(keyword.toLowerCase()) && distance < 80) {
          confidence = 'High'
        } else if (distance < 50 && keyword) {
          confidence = 'High'
        } else if (distance < 100) {
          confidence = 'Medium'
        } else {
          confidence = 'Low'
        }

        // If month-only or year-only, reduce confidence slightly
        if (parsed.day === null) {
          confidence = confidence === 'High' ? 'Medium' : confidence
        }

        // Keep best match (closest to keyword, highest confidence)
        if (
          !bestMatch ||
          (confidence === 'High' && bestMatch.confidence !== 'High') ||
          (confidence === bestMatch.confidence && distance < bestMatch.distance) ||
          (bestMatch.confidence !== 'High' && confidence === 'High')
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

  // 🔧 ENHANCED FALLBACK: If no keyword match, try searching for "Valid" or "Till" separately
  // This handles cases where OCR might have split "Valid Till" across lines or with errors
  if (!bestMatch) {
    const validIndex = text.indexOf('VALID')
    const tillIndex = text.indexOf('TILL')
    
    if (validIndex !== -1 || tillIndex !== -1) {
      const searchIndex = validIndex !== -1 ? validIndex : tillIndex
      const start = Math.max(0, searchIndex - 100)
      const end = Math.min(text.length, searchIndex + 200)
      const context = text.substring(start, end)
      
      for (const pattern of datePatterns) {
        const matches = Array.from(context.matchAll(pattern))
        for (const match of matches) {
          const dateStr = match[0].trim()

          // Skip if likely not expiry
          if (isLikelyNotExpiry(dateStr, context)) {
            continue
          }

          const parsed = parseDate(dateStr)
          if (!parsed) continue

          // Medium confidence if we found "Valid" or "Till" nearby
          bestMatch = {
            date: dateStr,
            keyword: 'valid till',
            distance: Math.abs(context.indexOf(dateStr) - (searchIndex - start)),
            confidence: 'Medium',
          }
          break
        }
        if (bestMatch) break
      }
    }
  }

  // If still no match, try to find any date (lower confidence)
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

