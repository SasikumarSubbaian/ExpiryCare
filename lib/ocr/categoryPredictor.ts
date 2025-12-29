import type { Category } from './categorySchemas'

/**
 * Category Prediction Service
 * Uses rule-based logic to predict document category from OCR text
 */

type CategoryScore = {
  category: Category
  score: number
  keywords: string[]
}

/**
 * Category-specific keywords for prediction
 */
const categoryKeywords: Record<Category, string[]> = {
  warranty: [
    'warranty',
    'guarantee',
    'warrant',
    'manufacturer',
    'product',
    'serial',
    'purchase date',
    'valid till',
    'warranty period',
  ],
  insurance: [
    'insurance',
    'policy',
    'coverage',
    'premium',
    'insurer',
    'policy number',
    'policy holder',
    'sum assured',
    'policy expiry',
    'renewal',
  ],
  amc: [
    'amc',
    'annual maintenance',
    'maintenance contract',
    'service contract',
    'amc valid',
    'service provider',
    'maintenance period',
  ],
  subscription: [
    'subscription',
    'renewal',
    'membership',
    'plan',
    'billing cycle',
    'next renewal',
    'auto renew',
    'subscription ends',
  ],
  medicine: [
    'medicine',
    'medication',
    'drug',
    'prescription',
    'mfg date',
    'exp date',
    'batch',
    'use before',
    'best before',
    'pharmaceutical',
  ],
  other: [], // Default category, no specific keywords
}

/**
 * Predicts document category from OCR text
 */
export function predictCategory(ocrText: string): Category {
  const text = ocrText.toLowerCase()
  const scores: CategoryScore[] = []

  // Calculate score for each category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'other') continue // Skip "other" for scoring

    let score = 0
    const matchedKeywords: string[] = []

    for (const keyword of keywords) {
      // Count occurrences (case-insensitive)
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      const matches = text.match(regex)
      if (matches) {
        score += matches.length
        matchedKeywords.push(keyword)
      }
    }

    scores.push({
      category: category as Category,
      score,
      keywords: matchedKeywords,
    })
  }

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score)

  // If highest score is 0 or very low, default to "other"
  if (scores.length === 0 || scores[0].score < 2) {
    return 'other'
  }

  // Return category with highest score
  return scores[0].category
}

/**
 * Get prediction confidence (0-1)
 */
export function getPredictionConfidence(ocrText: string, predictedCategory: Category): number {
  const text = ocrText.toLowerCase()
  const keywords = categoryKeywords[predictedCategory] || []

  if (keywords.length === 0) return 0.5 // Default confidence for "other"

  let matches = 0
  for (const keyword of keywords) {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    if (regex.test(text)) {
      matches++
    }
  }

  // Confidence based on percentage of keywords matched
  return Math.min(matches / keywords.length, 1.0)
}

