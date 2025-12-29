// Regex + Heuristics Engine for OCR Text Extraction
// Universal Expiry Date Extraction - Supports ALL real-world formats
// Fallback when AI is unavailable or for faster extraction
// No API calls needed - 100% free and instant

export type ExtractedData = {
  expiryDate: string | null
  originalText: string | null // Original date text found in OCR
  companyName: string | null
  productName: string | null
  category: 'Warranty' | 'Medicine' | 'Insurance' | 'Other'
  confidence: number
  source: 'regex' // Track extraction source
}

// Comprehensive expiry date patterns for Indian and international formats
// ORDER MATTERS: More specific patterns first, "Valid Till" prioritized over "Date of Issue"
const EXPIRY_PATTERNS = [
  // Pattern 0: "Valid Till: DD/MM/YYYY" or "Valid Till: DD-MM-YYYY" (HIGHEST PRIORITY for licenses)
  // This must come FIRST to prioritize "Valid Till" over "Date of Issue"
  /valid\s+till[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  
  // Pattern 0b: "Valid Till: AUG 2024" or "Valid Till: SEP 2026"
  /valid\s+till[:\-]?\s*([a-z]{3,9})\s+(\d{2,4})/i,
  
  // Pattern 1: "Expiry Date: DD/MM/YYYY" or "EXP: DD-MM-YYYY"
  /exp(?:iry)?\s*date[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  
  // Pattern 2: "Expiry Date: AUG 2024" or "EXP: SEP 2026" or "EXP: AUG 24" (2-digit year)
  // More flexible: handles "Expiry Date:" with colon, space variations, case insensitive
  // Handles: "Expiry Date: AUG 2025", "Expiry Date : AUG 2025", "EXP DATE: AUG 2025"
  // Also handles OCR errors: "Expiry Date" might be read as "Expiry Date" or "Exp Date" or "Expiry Dote"
  /exp(?:iry)?\s*date\s*[:\-]?\s*([a-z]{3,9})\s+(\d{2,4})/i,
  
  // Pattern 2b: Alternative format - "Expiry Date AUG 2025" (without colon, more flexible spacing)
  /exp(?:iry)?\s*date\s+([a-z]{3,9})\s+(\d{2,4})/i,
  
  // Pattern 2c: Very flexible - just look for month-year after "exp" or "expiry" keyword (handles OCR errors)
  // This catches cases where "Expiry Date:" might be read incorrectly by OCR
  /(?:exp|expiry)[\s\w]{0,20}([a-z]{3,9})\s+(\d{4})\b/i,
  
  // Pattern 2b: Alternative format - "Expiry Date AUG 2025" (without colon)
  /exp(?:iry)?\s*date\s+([a-z]{3,9})\s+(\d{2,4})/i,
  
  // Pattern 3: "Use Before: AUG 2024" or "Valid Till Sep 2026" or "Best Before: JAN 2025" (supports 2-digit year)
  /(use\s+before|valid\s+till|best\s+before|valid\s+until|valid\s+upto)[:\-]?\s*([a-z]{3,9}\s+\d{2,4})/i,
  
  // Pattern 4: "Use Before: DD/MM/YYYY" or "Valid Till: 31-12-2025"
  /(use\s+before|valid\s+till|best\s+before|valid\s+until|valid\s+upto)[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
  
  // Pattern 5: Standalone month-year "AUG 2024" or "SEP 2026" or "AUG 24" (near expiry keywords, supports 2-digit year)
  /(?:exp|expiry|valid|warranty|best\s+before|use\s+by)[\s\w]*?([a-z]{3,9})\s+(\d{2,4})/i,
  
  // Pattern 6: MM/YYYY format "08/2024" or "12-2025" or "EXP: 07/27" (2-digit year)
  // Handles both "EXP: 07/27" and "EXP 07/27" and "EXP\n07/27" (multiline)
  /(?:exp|expiry|valid|warranty|best\s+before|use\s+by)[:\-]?\s*(\d{1,2})[\/\-](\d{2,4})/i,
  
  // Pattern 6b: "EXP" on one line, "07/27" on next line (handles multiline OCR output)
  /(?:exp|expiry)[:\-]?\s*\n\s*(\d{1,2})[\/\-](\d{2,4})/i,
  
  // Pattern 7: YYYY-MM format "2024-08"
  /(?:exp|expiry|valid|warranty|best\s+before|use\s+by)[\s\w]*?(\d{4})[\/\-](\d{2})/i,
  
  // Pattern 8: "Mfg: SEP 2022 | Exp: AUG 2024" or "Exp: AUG 24" (extract only expiry, supports 2-digit year)
  /(?:exp|expiry)[:\-]?\s*([a-z]{3,9})\s+(\d{2,4})/i,
  
  // Pattern 9: DD MMM YYYY format "31 AUG 2024" or "15 SEP 2026" (with or without keyword)
  /(\d{1,2})\s+([a-z]{3,9})\s+(\d{4})/i,
  
  // Pattern 10: Generic date formats (fallback) - DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  /(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{2}[\/\-]\d{2}\b)/g,
  
  // Pattern 11: Standalone month-year anywhere in text (more flexible, supports 2-digit year)
  /\b([a-z]{3,9})\s+(\d{2,4})\b/i,
  
  // Pattern 12: Standalone MM/YYYY or MM-YYYY anywhere in text (including 2-digit year like 07/27)
  /\b(\d{1,2})[\/\-](\d{2,4})\b/,
]

const EXPIRY_KEYWORDS = [
  'expiry',
  'exp',
  'valid upto',
  'valid until',
  'warranty till',
  'warranty upto',
  'valid up to',
  'expires on',
  'expires',
  'best before',
  'use by',
  'use before',
  'valid till',
]

// Keywords that indicate manufacturing/issue date (should be excluded)
// Any word starting with 'M' followed by date-related keywords is likely manufacturing
// Also includes "Date of Issue" which is NOT expiry date
const MANUFACTURING_KEYWORDS = [
  'mfg',
  'manufacturing',
  'manufacture',
  'mfg date',
  'manufacturing date',
  'made on',
  'produced',
  'medi', // MEDI: 05/2028 (manufacturing date)
  'mfg:',
  'manufacturing:',
  'made:',
  'date of issue', // Date of Issue is NOT expiry date
  'issued on',
  'issue date',
  'date issued',
]

export function regexExtract(text: string): ExtractedData {
  const lower = text.toLowerCase()
  let confidence = 0
  let expiryDate: string | null = null
  let originalText: string | null = null
  let foundWithKeyword = false

  // Security: Only log metadata, not actual text content (may contain personal data)
  console.log('[RegexExtract] Processing text, length:', text.length)

  // SPECIAL HANDLING: Look for "EXP" keyword and find MM/YY date nearby (handles multiline)
  // This handles cases like "EXP\n07/27" or "EXP 07/27" where they might be on separate lines
  const expKeywordMatch = text.match(/\b(exp|expiry)\b/gi)
  if (expKeywordMatch) {
    for (const expMatch of expKeywordMatch) {
      const expIndex = text.toLowerCase().indexOf(expMatch.toLowerCase(), 0)
      if (expIndex !== -1) {
        // Look for MM/YY pattern within 50 characters after "EXP" (including newlines)
        const searchStart = expIndex + expMatch.length
        const searchEnd = Math.min(text.length, searchStart + 50)
        const searchText = text.substring(searchStart, searchEnd)
        
        // Find MM/YY pattern (e.g., "07/27", "08/25")
        const mmYyMatch = searchText.match(/\b(\d{1,2})[\/\-](\d{2})\b/)
        if (mmYyMatch) {
          const month = parseInt(mmYyMatch[1])
          let year = parseInt(mmYyMatch[2])
          
          // Convert 2-digit year to 4-digit (07/27 → 2027, 08/25 → 2025)
          const yearNow = new Date().getFullYear()
          const currentCentury = Math.floor(yearNow / 100) * 100
          year = currentCentury + year
          // If year is in the past (more than 10 years ago), assume next century
          if (year < yearNow - 10) {
            year += 100
          }
          
          // Check if this is near a manufacturing keyword (skip if it is)
          const contextStart = Math.max(0, expIndex - 30)
          const contextEnd = Math.min(text.length, searchStart + mmYyMatch[0].length + 30)
          const context = text.substring(contextStart, contextEnd).toLowerCase()
          
          const isManufacturingDate = MANUFACTURING_KEYWORDS.some(keyword => context.includes(keyword)) ||
            /\b[mM][a-zA-Z]{2,}:\s*\d/.test(context) ||
            /\bmfg\.?\s*date/i.test(context) ||
            /date\s+of\s+issue/i.test(context) // Explicitly exclude "Date of Issue"
          
          if (!isManufacturingDate && month >= 1 && month <= 12) {
            // Found valid expiry date near "EXP" keyword
            expiryDate = monthYearToLastDate(month.toString(), year)
            originalText = `${mmYyMatch[1]}/${mmYyMatch[2]}`
            confidence = 90 // High confidence: found "EXP" keyword + date
            foundWithKeyword = true
            // Security: Don't log personal data
            console.log('[RegexExtract] Found EXP date via special handling')
            break // Use first valid match
          }
        }
      }
    }
  }

  // If we already found a date with keyword, skip pattern matching
  if (expiryDate && foundWithKeyword) {
    // Continue to extract other fields (company, product, category)
  } else {
    // Try each pattern in order (most specific first)
    // Use a Set to track processed matches to avoid duplicates
    const processedMatches = new Set<string>()
  
  for (const pattern of EXPIRY_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern, 'gi'))
    
    for (const match of matches) {
      const fullMatch = match[0]
      const groups = match.slice(1).filter(Boolean) // Remove undefined groups
      
      // Skip if we've already processed this exact match
      const matchKey = `${fullMatch}-${match.index}`
      if (processedMatches.has(matchKey)) {
        continue
      }
      processedMatches.add(matchKey)
      
      // Check if match is near an expiry keyword (higher confidence)
      // CRITICAL: Exclude manufacturing dates
      const matchIndex = match.index || 0
      const context = text.substring(
        Math.max(0, matchIndex - 50),
        Math.min(text.length, matchIndex + fullMatch.length + 50)
      ).toLowerCase()
      
      // Skip if this is a manufacturing/issue date
      // Check for manufacturing keywords AND words starting with 'M' followed by colon (e.g., "MEDI:", "MFG:")
      // Also check for "Date of Issue" which should NEVER be used as expiry date
      const isManufacturingDate = MANUFACTURING_KEYWORDS.some(keyword => context.includes(keyword)) ||
        /\b[mM][a-zA-Z]{2,}:\s*\d/.test(context) || // Pattern: "MEDI:", "MFG:", "Mfg:", etc. followed by date
        /date\s+of\s+issue/i.test(context) // Explicitly exclude "Date of Issue"
      if (isManufacturingDate) {
        // Security: Don't log personal data
        continue // Skip this match, it's a manufacturing/issue date
      }
      
      const hasKeyword = EXPIRY_KEYWORDS.some(keyword => context.includes(keyword))
      
      if (hasKeyword) {
        foundWithKeyword = true
      }

      // Extract date based on pattern type
      let extractedDate: string | null = null
      let extractedOriginal: string | null = null

      // Pattern 1 & 4: DD/MM/YYYY or DD-MM-YYYY
      if (groups.length === 1 && /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(groups[0])) {
        extractedDate = normalizeDate(groups[0])
        extractedOriginal = groups[0]
      }
      // Pattern 2, 3, 5, 8, 11: Month Year (AUG 2024 or AUG 24)
      // Handle both cases: groups[0] = month, groups[1] = year OR groups[0] = "month year" as one string
      if (groups.length === 2) {
        // Case 1: Separate month and year groups
        if (/^[a-z]{3,9}$/i.test(groups[0]) && /^\d{2,4}$/.test(groups[1])) {
          const month = groups[0]
          let year = parseInt(groups[1])
          // Handle 2-digit year (24 -> 2024, 25 -> 2025, etc.)
          if (year < 100) {
            const currentYear = new Date().getFullYear()
            const currentCentury = Math.floor(currentYear / 100) * 100
            year = currentCentury + year
            // If year seems too far in past, assume next century
            if (year < currentYear - 10) {
              year += 100
            }
          }
          extractedDate = monthYearToLastDate(month, year)
          extractedOriginal = `${month} ${groups[1]}`
        }
        // Case 2: Combined "month year" string (from old Pattern 2 format)
        else if (/^[a-z]{3,9}\s+\d{2,4}$/i.test(groups[0])) {
          const parts = groups[0].split(/\s+/)
          if (parts.length === 2) {
            const month = parts[0]
            let year = parseInt(parts[1])
            if (year < 100) {
              const currentYear = new Date().getFullYear()
              const currentCentury = Math.floor(currentYear / 100) * 100
              year = currentCentury + year
              if (year < currentYear - 10) {
                year += 100
              }
            }
            extractedDate = monthYearToLastDate(month, year)
            extractedOriginal = groups[0]
          }
        }
      }
      // Pattern 6: MM/YYYY or MM/YY (including 00/YYYY which means December, and 2-digit years like 07/27)
      else if (groups.length === 2 && /^\d{1,2}$/.test(groups[0]) && /^\d{2,4}$/.test(groups[1])) {
        const month = parseInt(groups[0])
        let year = parseInt(groups[1])
        
        // Handle 2-digit year (e.g., "07/27" → July 2027)
        if (year < 100) {
          const yearNow = new Date().getFullYear()
          const currentCentury = Math.floor(yearNow / 100) * 100
          year = currentCentury + year
          // If year is in the past (more than 10 years ago), assume next century
          if (year < yearNow - 10) {
            year += 100
          }
        }
        
        // Handle month 00 as December (last month of year)
        if (month === 0) {
          extractedDate = monthYearToLastDate('12', year) // 00/2028 → 31-12-2028
          extractedOriginal = `${groups[0]}/${groups[1]}`
        } else if (month >= 1 && month <= 12) {
          extractedDate = monthYearToLastDate(month.toString(), year)
          extractedOriginal = `${groups[0]}/${groups[1]}`
        }
      }
      // Pattern 7: YYYY-MM
      else if (groups.length === 2 && /^\d{4}$/.test(groups[0]) && /^\d{1,2}$/.test(groups[1])) {
        const year = parseInt(groups[0])
        const month = parseInt(groups[1])
        if (month >= 1 && month <= 12) {
          extractedDate = monthYearToLastDate(month.toString(), year)
          extractedOriginal = `${groups[0]}-${groups[1]}`
        }
      }
      // Pattern 9: DD MMM YYYY
      else if (groups.length === 3 && /^\d{1,2}$/.test(groups[0]) && /^[a-z]{3,9}$/i.test(groups[1]) && /^\d{4}$/.test(groups[2])) {
        const day = parseInt(groups[0])
        const month = groups[1]
        const year = parseInt(groups[2])
        extractedDate = normalizeDate(`${day} ${month} ${year}`)
        extractedOriginal = `${groups[0]} ${groups[1]} ${groups[2]}`
      }
      // Pattern 10: Generic date formats
      else if (groups.length === 1 && /^\d/.test(groups[0])) {
        extractedDate = normalizeDate(groups[0])
        extractedOriginal = groups[0]
      }
      // Pattern 11: Standalone month-year (AUG 2024) - more flexible
      else if (groups.length === 2 && /^[a-z]{3,9}$/i.test(groups[0]) && /^\d{4}$/.test(groups[1])) {
        const month = groups[0]
        const year = parseInt(groups[1])
        extractedDate = monthYearToLastDate(month, year)
        extractedOriginal = `${month} ${year}`
      }
      // Pattern 12: Standalone MM/YYYY or MM/YY (including 00/YYYY which means December, and 2-digit years like 07/27)
      else if (groups.length === 2 && /^\d{1,2}$/.test(groups[0]) && /^\d{2,4}$/.test(groups[1])) {
        const month = parseInt(groups[0])
        let year = parseInt(groups[1])
        
        // Handle 2-digit year (e.g., "07/27" → July 2027)
        if (year < 100) {
          const yearNow = new Date().getFullYear()
          const currentCentury = Math.floor(yearNow / 100) * 100
          year = currentCentury + year
          // If year is in the past (more than 10 years ago), assume next century
          if (year < yearNow - 10) {
            year += 100
          }
        }
        
        // Handle month 00 as December (last month of year)
        if (month === 0) {
          extractedDate = monthYearToLastDate('12', year) // 00/2028 → 31-12-2028
          extractedOriginal = `${groups[0]}/${groups[1]}`
        } else if (month >= 1 && month <= 12) {
          extractedDate = monthYearToLastDate(month.toString(), year)
          extractedOriginal = `${groups[0]}/${groups[1]}`
        }
      }

      // Validate extracted date
      if (extractedDate && isValidDate(extractedDate)) {
        // CRITICAL: Only accept if it's not a manufacturing date
        // If we already found a date with expiry keyword, prefer that one
        if (expiryDate && hasKeyword && !foundWithKeyword) {
          // Keep the existing expiry date that has keyword
        } else {
          expiryDate = extractedDate
          originalText = extractedOriginal || fullMatch
          
          // Assign confidence based on context
          if (hasKeyword) {
            confidence = 90 // High confidence: keyword + date found
            // CRITICAL: If we found "Valid Till" or "Expiry Date", use it immediately and stop searching
            if (originalText && (context.includes('valid till') || context.includes('expiry date'))) {
              // Security: Don't log personal data
              break // Use this match immediately
            }
            // For other expiry dates with keywords, also break (they're reliable)
            break // Use first match with expiry keyword (highest priority)
          } else {
            confidence = 70 // Medium confidence: date found without keyword
            // Don't break yet - continue looking for one with keyword
          }
        }
      }
    }
    
    if (expiryDate && foundWithKeyword) break // Found a valid date with keyword, stop searching
  }
  } // End of else block for pattern matching (only runs if special handling didn't find a date)

  // If no date found with patterns, try to infer from any future dates
  if (!expiryDate) {
    // Try standalone month-year patterns first (more likely to be expiry)
    const monthYearPattern = /\b([a-z]{3,9})\s+(\d{4})\b/gi
    const monthYearMatches = Array.from(text.matchAll(monthYearPattern))
    
    for (const match of monthYearMatches) {
      const month = match[1]
      let year = parseInt(match[2])
      const yearNow = new Date().getFullYear()
      const matchIndex = match.index || 0
      
      // Check context to exclude manufacturing dates
      const context = text.substring(
        Math.max(0, matchIndex - 50),
        Math.min(text.length, matchIndex + match[0].length + 50)
      ).toLowerCase()
      
      // Skip if this is a manufacturing date
      // Check for manufacturing keywords AND words starting with 'M' followed by colon (e.g., "MEDI:", "MFG:")
      const isManufacturingDate = MANUFACTURING_KEYWORDS.some(keyword => context.includes(keyword)) ||
        /\b[mM][a-zA-Z]{2,}:\s*\d/.test(context) // Pattern: "MEDI:", "MFG:", "Mfg:", etc. followed by date
      if (isManufacturingDate) {
        continue
      }
      
      // Handle 2-digit year
      if (year < 100) {
        const currentCentury = Math.floor(yearNow / 100) * 100
        year = currentCentury + year
        if (year < yearNow - 10) {
          year += 100
        }
      }
      
      // Prefer future years or current year (expiry dates are usually in future)
      if (year >= yearNow - 1 && year <= yearNow + 10) {
        const extracted = monthYearToLastDate(month, year)
        if (isValidDate(extracted)) {
          expiryDate = extracted
          originalText = `${month} ${match[2]}`
          confidence = 50 // Medium-low confidence: inferred month-year
          break
        }
      }
    }
    
    // If still no date, try MM/YYYY or MM/YY format (including 00/YYYY and 2-digit years like 07/27)
    if (!expiryDate) {
      const mmyyyyPattern = /\b(\d{1,2})[\/\-](\d{2,4})\b/g
      const mmyyyyMatches = Array.from(text.matchAll(mmyyyyPattern))
      const yearNow = new Date().getFullYear()
      
      for (const match of mmyyyyMatches) {
        const month = parseInt(match[1])
        let year = parseInt(match[2])
        
        // Handle 2-digit year (e.g., "07/27" → July 2027)
        if (year < 100) {
          const currentCentury = Math.floor(yearNow / 100) * 100
          year = currentCentury + year
          // If year is in the past (more than 10 years ago), assume next century
          if (year < yearNow - 10) {
            year += 100
          }
        }
        
        // Check context to exclude manufacturing dates
        const matchIndex = match.index || 0
        const context = text.substring(
          Math.max(0, matchIndex - 30),
          Math.min(text.length, matchIndex + match[0].length + 30)
        ).toLowerCase()
        
        // Skip if this is a manufacturing date
        const isManufacturingDate = MANUFACTURING_KEYWORDS.some(keyword => context.includes(keyword)) ||
          /\b[mM][a-zA-Z]{2,}:\s*\d/.test(context)
        if (isManufacturingDate) {
          continue
        }
        
        // Handle month 00 as December (last month of year)
        if (month === 0 && year >= yearNow - 1 && year <= yearNow + 10) {
          const extracted = monthYearToLastDate('12', year) // 00/2028 → 31-12-2028
          if (isValidDate(extracted)) {
            expiryDate = extracted
            originalText = `${match[1]}/${match[2]}`
            confidence = 50 // Medium-low confidence: inferred MM/YYYY
            break
          }
        } else if (month >= 1 && month <= 12 && year >= yearNow - 1 && year <= yearNow + 10) {
          const extracted = monthYearToLastDate(month.toString(), year)
          if (isValidDate(extracted)) {
            expiryDate = extracted
            originalText = `${match[1]}/${match[2]}`
            confidence = 50 // Medium-low confidence: inferred MM/YYYY
            break
          }
        }
      }
    }
    
    // Last resort: try generic date patterns
    if (!expiryDate) {
      const genericDatePattern = /(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{2}[\/\-]\d{2}\b)/g
      const allDates = text.match(genericDatePattern)
      
      if (allDates && allDates.length > 0) {
        // Try to find the most likely expiry date (future date)
        for (const dateStr of allDates) {
          const normalized = normalizeDate(dateStr)
          if (isValidDate(normalized)) {
            const date = new Date(normalized)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            if (date > today) {
              expiryDate = normalized
              originalText = dateStr
              confidence = 40 // Low confidence: inferred from future date
              break
            }
          }
        }
        
        // If no future date, use the last date found (very low confidence)
        if (!expiryDate && allDates.length > 0) {
          const lastDate = allDates[allDates.length - 1]
          const normalized = normalizeDate(lastDate)
          if (isValidDate(normalized)) {
            expiryDate = normalized
            originalText = lastDate
            confidence = 30 // Very low confidence: inferred from any date
          }
        }
      }
    }
  }

  // Extract company name (look for capitalized words, likely company names)
  // Exclude common product-related words
  const companyPatterns = [
    /([A-Z][a-zA-Z\s&.-]+(?:Pvt|Ltd|Inc|Corp|GmbH|LLC|\bCo\b|\bGroup\b|\bPharma\b|\bHealthcare\b)\.?)/g, // Common company suffixes
    /(?:company|brand|manufacturer|made by|marketed by)[\s:]+([A-Z][a-zA-Z\s&.-]+)/i,
  ]

  let companyName: string | null = null
  let companyConfidence = 0
  for (const pattern of companyPatterns) {
    const match = text.match(pattern)
    if (match?.[0]) {
      companyName = match[0].replace(/^(?:company|brand|manufacturer|made by|marketed by)[\s:]+/i, '').trim()
      if (companyName.length > 2 && companyName.length < 100) {
        companyConfidence = 80
        break
      }
    }
  }
  if (!companyName) {
    // Look for capitalized words but exclude product names and common words
    const allCapMatches = text.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/g)
    if (allCapMatches) {
      // Filter out common non-company words
      const excludeWords = ['BATCH', 'MANUFACTURER', 'STORE', 'PROTECT', 'EXPIRY', 'DATE', 'EXP', 'VALID', 'TILL', 'USE', 'BEFORE', 'BEST', 'MEDICINE', 'TABLET', 'CAPSULE']
      for (const match of allCapMatches) {
        const words = match.split(/\s+/)
        const isExcluded = words.some(w => excludeWords.includes(w.toUpperCase()))
        if (!isExcluded && match.length > 2 && match.length < 50) {
          companyName = match
          companyConfidence = 50
          break
        }
      }
    }
  }

  // Extract product name (look for product-related keywords or prominent capitalized phrases)
  // Priority: Multi-word product names like "NUTRITIONAL SUPPLEMENT" > "Medicine 250" > batch numbers
  let productName: string | null = null
  
  // Pattern 1: Multi-word product names (e.g., "NUTRITIONAL SUPPLEMENT", "NUTRITIONAL SUEPLEMENT") - HIGHEST PRIORITY
  // Look for 2-3 word capitalized phrases that are NOT batch numbers, dates, or common words
  const multiWordProductPattern = /([A-Z][A-Z\s]{5,30}(?:\s+[A-Z][A-Z\s]+){1,2})/g
  const multiWordMatches = Array.from(text.matchAll(multiWordProductPattern))
  for (const match of multiWordMatches) {
    const candidate = match[0].trim()
    // Exclude common non-product words, batch numbers, dates
    const excludeWords = ['BATCH', 'MANUFACTURER', 'STORE', 'PROTECT', 'EXPIRY', 'DATE', 'EXP', 'VALID', 'TILL', 'USE', 'BEFORE', 'BEST', 'COOL', 'DRY', 'PLACE', 'LIGHT', 'SRCT', 'MEDI', 'MFG']
    const isExcluded = excludeWords.some(w => candidate.toUpperCase().includes(w))
    // Exclude if it looks like a batch number (contains numbers and short)
    const looksLikeBatch = /\d{6,}/.test(candidate) && candidate.length < 20
    // Exclude if it's a date format
    const looksLikeDate = /\d{1,2}[\/\-]\d{2,4}/.test(candidate)
    if (!isExcluded && !looksLikeBatch && !looksLikeDate && candidate.length > 8 && candidate.length < 50) {
      productName = candidate
      console.log('[RegexExtract] Found product name (multi-word):', productName)
      break
    }
  }
  
  // Pattern 2: "Medicine 250", "Tablet 500", etc. (word + number) - SECOND PRIORITY
  if (!productName) {
    const productNumberPattern = /([A-Z][a-zA-Z]+)\s+(\d+)/i
    const productNumberMatch = text.match(productNumberPattern)
    if (productNumberMatch) {
      const candidate = `${productNumberMatch[1]} ${productNumberMatch[2]}`
      // Exclude batch numbers (long numbers)
      if (productNumberMatch[2].length < 4) {
        productName = candidate
        console.log('[RegexExtract] Found product name (word+number):', productName)
      }
    }
  }
  
  // Pattern 3: Look for prominent capitalized phrases (but not company names or common words)
  if (!productName) {
    const productPatterns = [
      /(?:product|item|model|name)[\s:]+([A-Z][a-zA-Z0-9\s\-]+)/i,
      // Look for capitalized words followed by numbers (e.g., "Medicine 250")
      /([A-Z][a-z]+\s+\d+)/,
    ]

    for (const pattern of productPatterns) {
      const match = text.match(pattern)
      if (match?.[0]) {
        const candidate = match[0].replace(/^(?:product|item|model|name)[\s:]+/i, '').trim()
        // Exclude common non-product words
        const excludeWords = ['BATCH', 'MANUFACTURER', 'STORE', 'PROTECT', 'EXPIRY', 'DATE', 'EXP', 'VALID', 'TILL', 'USE', 'BEFORE', 'BEST']
        const isExcluded = excludeWords.some(w => candidate.toUpperCase().includes(w))
        if (!isExcluded && candidate.length > 3 && candidate.length < 100) {
          productName = candidate
          console.log('[RegexExtract] Found product name (pattern):', productName)
          break
        }
      }
    }
  }
  
  // Fallback: if no specific product name, use the first meaningful line
  if (!productName) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
    for (const line of lines) {
      // Skip lines that are clearly not product names
      if (!line.match(/^(BATCH|MANUFACTURER|STORE|PROTECT|EXPIRY|DATE|EXP|VALID|TILL|USE|BEFORE|BEST)/i)) {
        if (line.length > 5 && line.length < 100) {
          productName = line
          break
        }
      }
    }
  }

  // Determine category
  let category: ExtractedData['category'] = 'Other'
  if (lower.includes('warranty') || lower.includes('guarantee')) {
    category = 'Warranty'
    confidence += 10
  } else if (
    lower.includes('tablet') ||
    lower.includes('capsule') ||
    lower.includes('medicine') ||
    lower.includes('medication') ||
    lower.includes('pharma')
  ) {
    category = 'Medicine'
    confidence += 10
  } else if (lower.includes('insurance') || lower.includes('policy') || lower.includes('premium')) {
    category = 'Insurance'
    confidence += 10
  }

  // Cap confidence at 90 (regex can be very reliable with keywords)
  confidence = Math.min(confidence, 90)

  return {
    expiryDate,
    originalText,
    companyName,
    productName,
    category,
    confidence,
    source: 'regex',
  }
}

/**
 * Convert month-year to last day of that month
 * Example: "AUG 2024" → "2024-08-31"
 * Example: "08 2024" → "2024-08-31"
 */
function monthYearToLastDate(month: string | number, year: number): string {
  let monthIndex: number
  
  if (typeof month === 'string') {
    // Handle month names (AUG, AUGUST, etc.)
    const monthNames = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ]
    const monthLower = month.toLowerCase().substring(0, 3)
    monthIndex = monthNames.findIndex(m => m === monthLower)
    
    if (monthIndex === -1) {
      // Try parsing as number
      monthIndex = parseInt(month) - 1
    }
  } else {
    monthIndex = month - 1
  }
  
  if (monthIndex < 0 || monthIndex > 11) {
    // Invalid month, default to last day of December
    monthIndex = 11
  }
  
  // Get last day of the month
  const lastDay = new Date(year, monthIndex + 1, 0)
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
}

/**
 * Normalize various date formats to YYYY-MM-DD
 */
function normalizeDate(raw: string): string {
  // Handle DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy
    const fullYear = year.length === 2 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Handle YYYY-MM-DD or YYYY/MM/DD
  const yyyymmdd = raw.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Handle DD MMM YYYY (e.g., "31 AUG 2024")
  const ddmmyyyy2 = raw.match(/(\d{1,2})\s+([a-z]{3,9})\s+(\d{4})/i)
  if (ddmmyyyy2) {
    const [, day, month, year] = ddmmyyyy2
    const monthIndex = getMonthIndex(month)
    if (monthIndex !== -1) {
      const lastDay = new Date(parseInt(year), monthIndex + 1, 0)
      const actualDay = Math.min(parseInt(day), lastDay.getDate())
      return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`
    }
  }

  // Handle MM/YYYY or MM-YYYY (convert to last day of month)
  // Special case: 00/YYYY means December (last month of year)
  const mmyyyy = raw.match(/(\d{1,2})[\/\-](\d{4})/)
  if (mmyyyy) {
    const [, monthStr, yearStr] = mmyyyy
    const month = parseInt(monthStr)
    const year = parseInt(yearStr)
    // If month is 00, convert to December (12)
    if (month === 0) {
      return monthYearToLastDate('12', year) // 00/2028 → 31-12-2028
    }
    return monthYearToLastDate(month, year)
  }

  // Handle month name + year (e.g., "AUG 2024")
  const monthYear = raw.match(/([a-z]{3,9})\s+(\d{4})/i)
  if (monthYear) {
    const [, month, year] = monthYear
    return monthYearToLastDate(month, parseInt(year))
  }

  // Try standard Date parsing as fallback
  try {
    const d = new Date(raw.replace(/-/g, '/'))
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0]
    }
  } catch {
    // Ignore parsing errors
  }

  // Return original if all parsing fails
  return raw
}

/**
 * Get month index from month name (0-11)
 */
function getMonthIndex(month: string): number {
  const monthNames = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ]
  const monthLower = month.toLowerCase().substring(0, 3)
  return monthNames.findIndex(m => m === monthLower)
}

/**
 * Validate if a date string is in valid YYYY-MM-DD format
 */
function isValidDate(dateString: string): boolean {
  if (!dateString || dateString.length !== 10) return false
  
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString
}

