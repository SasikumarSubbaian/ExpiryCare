// Text Normalization for OCR Accuracy
// Fixes common OCR errors and normalizes text for better extraction

/**
 * Common OCR confusion patterns
 * O (letter) → 0 (zero)
 * l (lowercase L) → 1 (one)
 * I (uppercase i) → 1 (one) in certain contexts
 * S → 5
 * Z → 2
 */
const OCR_FIXES: Array<{ pattern: RegExp; replacement: string; context?: string }> = [
  // Fix dates: "O8/2024" → "08/2024" (O in date context is likely 0)
  { pattern: /(\d{1,2})[Oo](\d{2,4})/g, replacement: '$10$2', context: 'date' },
  { pattern: /[Oo](\d{1,2})[\/\-](\d{2,4})/g, replacement: '0$1/$2', context: 'date' },
  
  // Fix month names: "AUG O8" → "AUG 08"
  { pattern: /([A-Z]{3,9})\s+[Oo](\d)/g, replacement: '$1 0$2', context: 'month-year' },
  
  // Fix standalone zeros: "2O24" → "2024" (in year context)
  { pattern: /(\d)[Oo](\d{2,3})\b/g, replacement: '$10$2', context: 'year' },
  
  // Fix lowercase L in dates: "l/2024" → "1/2024"
  { pattern: /^[lI](\d{1,2})[\/\-](\d{2,4})/g, replacement: '1$1/$2', context: 'date-start' },
  { pattern: /(\d{1,2})[\/\-][lI](\d{2,4})/g, replacement: '$1/1$2', context: 'date' },
]

/**
 * Normalize OCR text
 * - Convert to uppercase for consistency
 * - Fix common OCR errors
 * - Remove noisy lines
 * - Normalize whitespace
 */
export function normalizeOcrText(rawText: string): string {
  if (!rawText || rawText.trim().length === 0) {
    return ''
  }

  let normalized = rawText

  // Step 1: Fix common OCR confusion patterns
  for (const fix of OCR_FIXES) {
    normalized = normalized.replace(fix.pattern, fix.replacement)
  }

  // Step 2: Remove noisy lines (very short lines, single characters, etc.)
  const lines = normalized.split('\n')
  const cleanedLines = lines.filter((line) => {
    const trimmed = line.trim()
    // Remove lines that are:
    // - Empty
    // - Single character (likely OCR noise)
    // - Only special characters
    // - Very short (less than 2 chars) unless it's a date pattern
    if (trimmed.length === 0) return false
    if (trimmed.length === 1 && !/\d/.test(trimmed)) return false
    if (/^[^\w\d]{1,3}$/.test(trimmed)) return false
    return true
  })

  normalized = cleanedLines.join('\n')

  // Step 3: Normalize whitespace
  normalized = normalized
    .replace(/\s+/g, ' ') // Multiple spaces → single space
    .replace(/\n\s*\n/g, '\n') // Multiple newlines → single newline
    .trim()

  // Step 4: Convert to uppercase for consistency (dates, keywords)
  // But preserve case for product names and other text
  normalized = normalized.toUpperCase()

  // Step 5: Fix common date format issues
  // "EXP: O8/2024" → "EXP: 08/2024"
  normalized = normalized.replace(/(EXP|EXPIRY|VALID|TILL|USE|BEFORE)[:\-]?\s*[O0](\d)/g, '$1: 0$2')

  return normalized
}

/**
 * Remove noisy characters and lines
 */
export function removeNoisyLines(text: string): string {
  const lines = text.split('\n')
  const cleaned = lines.filter((line) => {
    const trimmed = line.trim()
    
    // Remove empty lines
    if (trimmed.length === 0) return false
    
    // Remove lines with only special characters
    if (/^[^\w\d\s]{2,}$/.test(trimmed)) return false
    
    // Remove very short lines (unless they contain numbers - might be dates)
    if (trimmed.length < 2 && !/\d/.test(trimmed)) return false
    
    return true
  })

  return cleaned.join('\n')
}

/**
 * Extract clean text blocks (removes OCR artifacts)
 */
export function extractCleanTextBlocks(text: string): string[] {
  const normalized = normalizeOcrText(text)
  const lines = normalized.split('\n')
  
  const blocks: string[] = []
  let currentBlock = ''

  for (const line of lines) {
    const trimmed = line.trim()
    
    // If line is meaningful (has alphanumeric content)
    if (trimmed.length > 0 && /[\w\d]/.test(trimmed)) {
      currentBlock += (currentBlock ? ' ' : '') + trimmed
    } else if (currentBlock.length > 0) {
      // End of block
      blocks.push(currentBlock)
      currentBlock = ''
    }
  }

  // Add last block
  if (currentBlock.length > 0) {
    blocks.push(currentBlock)
  }

  return blocks.filter((block) => block.length > 0)
}

