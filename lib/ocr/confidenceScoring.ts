/**
 * Confidence Scoring Utility
 * Calculates confidence levels for extracted fields based on extraction quality
 */

export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export interface ConfidenceScore {
  level: ConfidenceLevel
  percentage: number // 0-100
}

/**
 * Calculate confidence based on percentage (0-100)
 * - High: ≥70%
 * - Medium: 40-69%
 * - Low: <40%
 */
export function calculateConfidence(percentage: number): ConfidenceLevel {
  if (percentage >= 70) return 'High'
  if (percentage >= 40) return 'Medium'
  return 'Low'
}

/**
 * Calculate confidence for extracted text field
 * Based on:
 * - Match quality (exact match, partial match, fuzzy match)
 * - Context proximity (distance from keyword)
 * - Pattern strength (strong pattern vs weak pattern)
 */
export function scoreTextExtraction(
  extractedValue: string | null,
  matchQuality: 'exact' | 'partial' | 'fuzzy' | 'none',
  keywordDistance: number = Infinity,
  patternStrength: 'strong' | 'medium' | 'weak' = 'medium'
): ConfidenceScore {
  if (!extractedValue || extractedValue.trim().length === 0) {
    return { level: 'Low', percentage: 0 }
  }

  let percentage = 50 // Base score

  // Adjust based on match quality
  switch (matchQuality) {
    case 'exact':
      percentage += 30
      break
    case 'partial':
      percentage += 15
      break
    case 'fuzzy':
      percentage += 5
      break
    case 'none':
      percentage -= 20
      break
  }

  // Adjust based on keyword distance (closer = higher confidence)
  if (keywordDistance < 50) {
    percentage += 20
  } else if (keywordDistance < 100) {
    percentage += 10
  } else if (keywordDistance < 200) {
    percentage += 5
  } else {
    percentage -= 10
  }

  // Adjust based on pattern strength
  switch (patternStrength) {
    case 'strong':
      percentage += 10
      break
    case 'medium':
      // No change
      break
    case 'weak':
      percentage -= 10
      break
  }

  // Clamp to 0-100
  percentage = Math.max(0, Math.min(100, percentage))

  return {
    level: calculateConfidence(percentage),
    percentage: Math.round(percentage),
  }
}

/**
 * Calculate confidence for expiry date extraction
 * Uses the existing expiry date confidence logic
 */
export function scoreExpiryDate(
  expiryDate: { value: string | null; confidence: ConfidenceLevel; sourceKeyword: string | null } | null
): ConfidenceScore {
  if (!expiryDate || !expiryDate.value) {
    return { level: 'Low', percentage: 0 }
  }

  // Map existing confidence levels to percentages
  switch (expiryDate.confidence) {
    case 'High':
      return { level: 'High', percentage: 85 }
    case 'Medium':
      return { level: 'Medium', percentage: 55 }
    case 'Low':
      return { level: 'Low', percentage: 25 }
    default:
      return { level: 'Low', percentage: 25 }
  }
}

/**
 * Calculate confidence for category prediction
 * Based on keyword matches and prediction confidence
 */
export function scoreCategoryPrediction(
  predictedCategory: string,
  keywordMatches: number,
  totalKeywords: number,
  predictionConfidence: number // 0-1 from categoryPredictor
): ConfidenceScore {
  if (keywordMatches === 0 && predictionConfidence < 0.3) {
    return { level: 'Low', percentage: 20 }
  }

  // Combine keyword match ratio and prediction confidence
  const keywordRatio = totalKeywords > 0 ? keywordMatches / totalKeywords : 0
  const combinedScore = (keywordRatio * 0.6 + predictionConfidence * 0.4) * 100

  return {
    level: calculateConfidence(combinedScore),
    percentage: Math.round(combinedScore),
  }
}

