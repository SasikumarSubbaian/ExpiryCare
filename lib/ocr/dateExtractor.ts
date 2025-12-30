/**
 * Date Extraction Utility
 * Extracts all date patterns from text for multi-pass OCR analysis
 */

/**
 * Extracts all date patterns from text
 * Returns array of unique date strings found
 */
export function extractDates(text: string): string[] {
  const patterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g,
    // DD MMM YYYY (e.g., 15 AUG 2024)
    /\b\d{2}\s+[A-Za-z]{3,9}\s+\d{4}\b/g,
    // MMM DD, YYYY (e.g., AUG 15, 2024)
    /\b[A-Za-z]{3,9}\s+\d{2},\s+\d{4}\b/g,
    // YYYY-MM-DD or YYYY/MM/DD
    /\b\d{4}[\/\-]\d{2}[\/\-]\d{2}\b/g,
    // MM/YYYY or MM-YYYY
    /\b\d{2}[\/\-]\d{4}\b/g,
    // YYYY only (if reasonable year)
    /\b(20\d{2})\b/g,
  ]

  const results = new Set<string>()
  
  patterns.forEach((regex) => {
    const matches = text.match(regex)
    matches?.forEach((m) => {
      // Filter out obviously invalid years
      const yearMatch = m.match(/\d{4}/)
      if (yearMatch) {
        const year = parseInt(yearMatch[0], 10)
        if (year >= 2000 && year <= 2100) {
          results.add(m.trim())
        }
      } else {
        results.add(m.trim())
      }
    })
  })

  return Array.from(results)
}
