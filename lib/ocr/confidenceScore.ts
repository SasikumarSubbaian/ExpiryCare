/**
 * Confidence Scoring Utility
 * Calculates overall confidence score for OCR extraction based on keywords and dates
 */

import { EXPIRY_KEYWORDS } from './expiryKeywords'
import { extractDates } from './dateExtractor'

/**
 * Calculates confidence score (0-100) for OCR extraction
 * Based on:
 * - Keyword matches (expiry-related keywords found)
 * - Date extraction (number of dates found)
 * - Text quality indicators
 */
export function calculateConfidence(
  text: string,
  extractedDates: string[]
): number {
  let score = 0
  const lowerText = text.toLowerCase()

  // Keyword matching: +10 points per keyword found (max 50 points)
  let keywordMatches = 0
  EXPIRY_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      keywordMatches++
    }
  })
  
  // Cap keyword contribution at 50 points
  score += Math.min(keywordMatches * 10, 50)

  // Date extraction: +30 for 2+ dates, +15 for 1 date
  if (extractedDates.length >= 2) {
    score += 30
  } else if (extractedDates.length === 1) {
    score += 15
  }

  // Text quality: bonus for reasonable text length (10-30 points)
  const textLength = text.trim().length
  if (textLength > 100) {
    score += 10 // Good amount of text
  }
  if (textLength > 500) {
    score += 10 // Substantial text
  }
  if (textLength > 1000) {
    score += 10 // Very substantial text
  }

  // Penalty for very short text
  if (textLength < 50) {
    score -= 20
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * Determines if OCR result needs manual review
 * Returns true if confidence < 70%
 */
export function needsReview(confidence: number): boolean {
  return confidence < 70
}
