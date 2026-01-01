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
 * Category-specific keywords with weights for prediction
 * Higher weight = stronger indicator
 */
const categoryKeywords: Record<Category, Array<{ keyword: string; weight: number }>> = {
  warranty: [
    { keyword: 'warranty', weight: 10 },
    { keyword: 'invoice', weight: 8 },
    { keyword: 'purchase date', weight: 7 },
    { keyword: 'imei', weight: 6 },
    { keyword: 'serial no', weight: 6 },
    { keyword: 'guarantee', weight: 8 },
    { keyword: 'valid till', weight: 7 },
  ],
  insurance: [
    { keyword: 'policy', weight: 10 },
    { keyword: 'insurance', weight: 10 },
    { keyword: 'sum insured', weight: 8 },
    { keyword: 'premium', weight: 7 },
    { keyword: 'policy number', weight: 9 },
    { keyword: 'coverage', weight: 6 },
  ],
  medicine: [
    { keyword: 'tablet', weight: 8 },
    { keyword: 'capsule', weight: 8 },
    { keyword: 'mg', weight: 6 },
    { keyword: 'dosage', weight: 7 },
    { keyword: 'manufactured', weight: 6 },
    { keyword: 'expiry', weight: 7 },
    { keyword: 'vitamin', weight: 9 },
    { keyword: 'chewable', weight: 9 },
    { keyword: 'medicine', weight: 10 },
    { keyword: 'medication', weight: 9 },
    { keyword: 'pharma', weight: 7 },
  ],
  subscription: [
    { keyword: 'valid till', weight: 8 },
    { keyword: 'subscription', weight: 10 },
    { keyword: 'renewal', weight: 8 },
    { keyword: 'plan', weight: 6 },
    { keyword: 'membership', weight: 7 },
  ],
  amc: [
    { keyword: 'annual maintenance', weight: 10 },
    { keyword: 'amc', weight: 10 },
    { keyword: 'service valid', weight: 8 },
    { keyword: 'maintenance contract', weight: 9 },
  ],
  other: [
    { keyword: 'driving licence', weight: 10 },
    { keyword: 'driving license', weight: 10 },
    { keyword: 'dl no', weight: 9 },
    { keyword: 'date of issue', weight: 7 },
    { keyword: 'valid till', weight: 7 },
    { keyword: 'union of india', weight: 8 },
    { keyword: 'transport department', weight: 8 },
    { keyword: 'transport authority', weight: 8 },
  ],
}

/**
 * Predicts document category from OCR text
 * Uses keyword weight scoring for human-like prediction
 */
export function predictCategory(ocrText: string): Category {
  const t = ocrText.toLowerCase()
  
  // PRIORITY: Check for driving licence first (high confidence)
  // Enhanced detection with more keywords
  const drivingLicenseKeywords = [
    'driving licence', 'driving license', 'dl no', 'dl no.', 'dl number',
    'date of issue', 'valid till', 'union of india', 'transport department',
    'transport authority', 'rto', 'regional transport office'
  ]
  
  const drivingLicenseScore = drivingLicenseKeywords.filter(kw => t.includes(kw)).length
  if (drivingLicenseScore >= 2) {
    return 'other' // Driving licence is "other" category
  }
  
  // Calculate scores for each category
  const scores: Record<Category, number> = {
    warranty: 0,
    insurance: 0,
    medicine: 0,
    subscription: 0,
    amc: 0,
    other: 0,
  }
  
  // Score each category based on keyword matches
  for (const category of Object.keys(categoryKeywords) as Category[]) {
    const keywords = categoryKeywords[category]
    for (const { keyword, weight } of keywords) {
      if (t.includes(keyword.toLowerCase())) {
        scores[category] += weight
      }
    }
  }
  
  // Find category with highest score
  let maxScore = 0
  let predictedCategory: Category = 'other'
  
  for (const category of Object.keys(scores) as Category[]) {
    if (scores[category] > maxScore) {
      maxScore = scores[category]
      predictedCategory = category
    }
  }
  
  // Threshold: if score is too low, default to "other"
  const threshold = 10
  if (maxScore < threshold) {
    return 'other'
  }
  
  return predictedCategory
}

/**
 * Get prediction confidence (0-1)
 * Based on weighted keyword scores
 */
export function getPredictionConfidence(ocrText: string, predictedCategory: Category): number {
  const text = ocrText.toLowerCase()
  const keywords = categoryKeywords[predictedCategory] || []

  if (keywords.length === 0) return 0.4 // Default confidence for "other"

  let totalWeight = 0
  let matchedWeight = 0
  
  for (const { keyword, weight } of keywords) {
    totalWeight += weight
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    if (regex.test(text)) {
      matchedWeight += weight
    }
  }

  // Confidence based on weighted percentage
  if (totalWeight === 0) return 0.4
  
  const confidence = matchedWeight / totalWeight
  
  // Normalize to 0-1 range, minimum 0.3
  return Math.max(Math.min(confidence, 1.0), 0.3)
}

