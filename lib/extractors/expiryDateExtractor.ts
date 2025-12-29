// Expiry Date Extractor - Universal Primary Field
// Extracts expiry dates from OCR text with high confidence
// Supports all real-world date formats
// Enhanced with improved detection and confidence scoring

import { detectExpiryDate as enhancedDetectExpiryDate } from '../ocr/expiryDetection'

export interface ExpiryDateResult {
  value: string | null // YYYY-MM-DD format
  confidence: 'High' | 'Medium' | 'Low'
  sourceKeyword: string | null // Which keyword was found
  originalText: string | null // Original date text from OCR
  confidenceScore?: number // Numeric score 0-100 for auto-fill decisions
}

// Master keyword list for expiry date detection
// Includes subscription-specific keywords
const EXPIRY_KEYWORDS = [
  // Standard expiry keywords
  'expiry',
  'exp',
  'expires',
  'expires on',
  'expiry date',
  'exp date',
  
  // Valid till/until keywords
  'valid till',
  'valid until',
  'valid upto',
  'valid up to',
  'valid through',
  
  // Subscription-specific keywords (NEW)
  'subscription ends on',
  'plan valid till',
  'membership valid up to',
  'membership expiry',
  'next renewal date',
  'renewal due on',
  'billing cycle ends',
  'access valid till',
  'renewal date',
  'expires on',
  
  // Warranty keywords
  'warranty till',
  'warranty upto',
  'warranty expires',
  
  // Other keywords
  'best before',
  'use before',
  'use by',
  'valid for',
]

// Keywords that indicate NON-expiry dates (must be excluded)
const NON_EXPIRY_KEYWORDS = [
  'date of issue',
  'issued on',
  'issue date',
  'date issued',
  'mfg date',
  'manufacturing date',
  'manufactured on',
  'made on',
  'produced on',
  'date of birth',
  'dob',
  'birth date',
  'born on',
]

/**
 * Normalize date string to YYYY-MM-DD format
 * Handles all common date formats
 */
function normalizeDate(dateStr: string): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null

  const trimmed = dateStr.trim()

  // Format 1: DD-MM-YYYY or DD/MM/YYYY (e.g., "27-08-2038", "31/12/2025")
  const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy
    const dayNum = parseInt(day)
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      // Validate day for the month
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate()
      if (dayNum <= daysInMonth) {
        return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`
      }
    }
  }

  // Format 2: DD-MM-YY or DD/MM/YY (2-digit year, e.g., "27-08-38")
  const ddmmyy = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/)
  if (ddmmyy) {
    const [, day, month, year] = ddmmyy
    const dayNum = parseInt(day)
    const monthNum = parseInt(month)
    let yearNum = parseInt(year)
    
    // Convert 2-digit year to 4-digit
    const currentYear = new Date().getFullYear()
    const currentCentury = Math.floor(currentYear / 100) * 100
    yearNum = currentCentury + yearNum
    
    // If year is in the past (more than 10 years ago), assume next century
    if (yearNum < currentYear - 10) {
      yearNum += 100
    }
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate()
      if (dayNum <= daysInMonth) {
        return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`
      }
    }
  }

  // Format 3: YYYY-MM-DD (e.g., "2025-12-31")
  const yyyymmdd = trimmed.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/)
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd
    return `${year}-${month}-${day}`
  }

  // Format 4: MMM YYYY (e.g., "DEC 2025", "AUG 2024")
  const monthYear = trimmed.match(/^([a-z]{3,9})\s+(\d{4})$/i)
  if (monthYear) {
    const [, monthName, year] = monthYear
    const monthIndex = getMonthIndex(monthName)
    if (monthIndex !== -1) {
      const lastDay = new Date(parseInt(year), monthIndex + 1, 0).getDate()
      return `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
    }
  }

  // Format 5: MM-YY or MM/YY (e.g., "08-24", "12/25")
  const mmyy = trimmed.match(/^(\d{1,2})[\/\-](\d{2})$/)
  if (mmyy) {
    const [, month, year] = mmyy
    const monthNum = parseInt(month)
    let yearNum = parseInt(year)
    
    // Convert 2-digit year
    const currentYear = new Date().getFullYear()
    const currentCentury = Math.floor(currentYear / 100) * 100
    yearNum = currentCentury + yearNum
    if (yearNum < currentYear - 10) {
      yearNum += 100
    }
    
    if (monthNum >= 1 && monthNum <= 12) {
      const lastDay = new Date(yearNum, monthNum, 0).getDate()
      return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
    }
  }

  // Format 6: MM/YYYY (e.g., "08/2024", "12/2025")
  const mmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{4})$/)
  if (mmyyyy) {
    const [, month, year] = mmyyyy
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)
    
    if (monthNum >= 1 && monthNum <= 12) {
      const lastDay = new Date(yearNum, monthNum, 0).getDate()
      return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
    }
  }

  // Format 7: DD.MM.YY (e.g., "15.03.26" - with dots)
  const ddmmyyDot = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/)
  if (ddmmyyDot) {
    const [, day, month, year] = ddmmyyDot
    const dayNum = parseInt(day)
    const monthNum = parseInt(month)
    let yearNum = parseInt(year)
    
    const currentYear = new Date().getFullYear()
    const currentCentury = Math.floor(currentYear / 100) * 100
    yearNum = currentCentury + yearNum
    if (yearNum < currentYear - 10) {
      yearNum += 100
    }
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate()
      if (dayNum <= daysInMonth) {
        return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`
      }
    }
  }

  return null
}

/**
 * Get month index from month name (JAN=0, FEB=1, etc.)
 */
function getMonthIndex(monthName: string): number {
  const months = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ]
  const lower = monthName.toLowerCase().substring(0, 3)
  return months.indexOf(lower)
}

/**
 * Extract expiry date from OCR text
 * Primary universal field - must be extracted for all categories
 */
export function extractExpiryDate(ocrText: string): ExpiryDateResult {
  if (!ocrText || ocrText.trim().length < 10) {
    return {
      value: null,
      confidence: 'Low',
      sourceKeyword: null,
      originalText: null,
      confidenceScore: 0,
    }
  }

  // Use enhanced expiry detection (better format support)
  try {
    const enhancedResult = enhancedDetectExpiryDate(ocrText)
    
    if (enhancedResult.expiryDate) {
      // Map numeric confidence to High/Medium/Low
      let confidence: 'High' | 'Medium' | 'Low'
      if (enhancedResult.confidence >= 85) {
        confidence = 'High'
      } else if (enhancedResult.confidence >= 60) {
        confidence = 'Medium'
      } else {
        confidence = 'Low'
      }

      return {
        value: enhancedResult.expiryDate,
        confidence,
        sourceKeyword: enhancedResult.sourceKeyword,
        originalText: enhancedResult.originalText,
        confidenceScore: enhancedResult.confidence,
      }
    }
  } catch (error) {
    // Fallback to original logic if enhanced detection fails
    console.warn('[Expiry Extractor] Enhanced detection failed, using fallback:', error)
  }

  // Fallback to original extraction logic for edge cases
  const lowerText = ocrText.toLowerCase()
  let bestMatch: {
    date: string | null
    confidence: 'High' | 'Medium' | 'Low'
    keyword: string | null
    originalText: string | null
    distance: number
  } | null = null

  // Search for each expiry keyword
  for (const keyword of EXPIRY_KEYWORDS) {
    const keywordIndex = lowerText.indexOf(keyword)
    
    if (keywordIndex === -1) continue

    // Search for date patterns within 50 characters after the keyword
    const searchStart = keywordIndex + keyword.length
    const searchEnd = Math.min(ocrText.length, searchStart + 50)
    const searchText = ocrText.substring(searchStart, searchEnd)

    // Pattern 1: DD-MM-YYYY or DD/MM/YYYY (highest priority)
    const datePattern1 = searchText.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/)
    if (datePattern1) {
      const normalized = normalizeDate(datePattern1[1])
      if (normalized) {
        const distance = keywordIndex
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = {
            date: normalized,
            confidence: 'High', // Keyword + date = High confidence
            keyword,
            originalText: datePattern1[1],
            distance,
          }
        }
      }
    }

    // Pattern 2: MMM YYYY (e.g., "DEC 2025")
    const datePattern2 = searchText.match(/([a-z]{3,9})\s+(\d{4})/i)
    if (datePattern2) {
      const monthYear = `${datePattern2[1]} ${datePattern2[2]}`
      const normalized = normalizeDate(monthYear)
      if (normalized) {
        const distance = keywordIndex
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = {
            date: normalized,
            confidence: 'Medium', // Month-only = Medium confidence
            keyword,
            originalText: monthYear,
            distance,
          }
        }
      }
    }

    // Pattern 3: MM/YYYY or MM-YY
    const datePattern3 = searchText.match(/(\d{1,2}[\/\-]\d{2,4})/)
    if (datePattern3) {
      const normalized = normalizeDate(datePattern3[1])
      if (normalized) {
        const distance = keywordIndex
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = {
            date: normalized,
            confidence: 'Medium', // Month-only = Medium confidence
            keyword,
            originalText: datePattern3[1],
            distance,
          }
        }
      }
    }
  }

  // If no keyword match, try to find standalone dates (lower confidence)
  if (!bestMatch) {
    // Look for date patterns without keywords (fallback)
    const standalonePatterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/, // DD-MM-YYYY
      /([a-z]{3,9})\s+(\d{4})/i, // MMM YYYY
      /(\d{1,2}[\/\-]\d{4})/, // MM/YYYY
    ]

    for (const pattern of standalonePatterns) {
      const match = ocrText.match(pattern)
      if (match) {
        // Check if this date is near a NON-expiry keyword (exclude it)
        const matchIndex = match.index || 0
        const context = ocrText.substring(
          Math.max(0, matchIndex - 30),
          Math.min(ocrText.length, matchIndex + match[0].length + 30)
        ).toLowerCase()

        const isNonExpiry = NON_EXPIRY_KEYWORDS.some(nonKeyword => 
          context.includes(nonKeyword)
        )

        if (!isNonExpiry) {
          const dateStr = match[0]
          const normalized = normalizeDate(dateStr)
          if (normalized) {
            bestMatch = {
              date: normalized,
              confidence: 'Low', // No keyword = Low confidence
              keyword: null,
              originalText: dateStr,
              distance: matchIndex,
            }
            break
          }
        }
      }
    }
  }

  // Validate final date
  if (bestMatch && bestMatch.date) {
    // Check if date is in the past (more than 1 year ago) - might be DOB or issue date
    const dateObj = new Date(bestMatch.date)
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
    
    if (dateObj < oneYearAgo) {
      // Very old date - likely not expiry, reduce confidence
      return {
        value: null,
        confidence: 'Low',
        sourceKeyword: null,
        originalText: null,
        confidenceScore: 0,
      }
    }

    // Map confidence to numeric score
    const confidenceScore = bestMatch.confidence === 'High' ? 90 : bestMatch.confidence === 'Medium' ? 70 : 50

    return {
      value: bestMatch.date,
      confidence: bestMatch.confidence,
      sourceKeyword: bestMatch.keyword,
      originalText: bestMatch.originalText,
      confidenceScore,
    }
  }

  return {
    value: null,
    confidence: 'Low',
    sourceKeyword: null,
    originalText: null,
    confidenceScore: 0,
  }
}

