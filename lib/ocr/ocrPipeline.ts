/**
 * OCR Pipeline - Human-like Document Reading
 * Processes documents like a human reader would
 */

import type { Category } from './categorySchemas'

export interface ExtractedField {
  label: string
  value: string
  confidence: number
  required: boolean
}

export interface OCRResult {
  category: Category
  confidence: number
  fields: Record<string, ExtractedField>
  rawText: string
}

/**
 * Normalize OCR text for processing
 * - Convert to lowercase
 * - Remove symbols except dates and numbers
 * - Preserve structure
 */
export function normalizeOCRText(text: string): string {
  // Convert to lowercase for keyword matching
  let normalized = text.toLowerCase()
  
  // Remove special symbols but keep dates (/, -) and numbers
  normalized = normalized.replace(/[^\w\s\/\-\d]/g, ' ')
  
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

/**
 * Get normalized text for keyword matching
 * Preserves original text for field extraction
 */
export function getNormalizedText(originalText: string): string {
  return normalizeOCRText(originalText)
}
