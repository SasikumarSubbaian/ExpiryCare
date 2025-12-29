// Category Prediction - Rule-Based First
// Predicts document category from OCR text
// Privacy-first: Safe defaults for unknown documents

import { CategoryKey } from './categorySchemas'

/**
 * Predict document category from OCR text
 * Rule-based first for predictable, cheap, and fast results
 */
export function predictCategory(text: string): CategoryKey {
  if (!text || text.trim().length < 10) {
    return 'other' // Safe default for insufficient text
  }

  const lowerText = text.toLowerCase()

  // Driving License / License indicators (HIGHEST PRIORITY - check before subscription)
  // Must check before "valid till" to avoid false matches
  if (
    lowerText.includes('driving licence') ||
    lowerText.includes('driving license') ||
    lowerText.includes('driving licence') ||
    lowerText.includes('dl number') ||
    lowerText.includes('dl no') ||
    lowerText.includes('license number') ||
    lowerText.includes('licence number') ||
    (lowerText.includes('union of india') && lowerText.includes('driving')) ||
    (lowerText.includes('valid till') && (lowerText.includes('driving') || lowerText.includes('licence') || lowerText.includes('license')))
  ) {
    return 'other' // Driving license goes to "other" category (privacy-first)
  }

  // Warranty indicators
  if (
    lowerText.includes('warranty') ||
    lowerText.includes('guarantee') ||
    lowerText.includes('warranty period') ||
    lowerText.includes('product warranty')
  ) {
    return 'warranty'
  }

  // Insurance indicators
  if (
    lowerText.includes('insurance') ||
    lowerText.includes('policy') ||
    lowerText.includes('premium') ||
    lowerText.includes('coverage') ||
    lowerText.includes('claim') ||
    lowerText.includes('policy number') ||
    lowerText.includes('policy no')
  ) {
    return 'insurance'
  }

  // AMC indicators
  if (
    lowerText.includes('amc') ||
    lowerText.includes('annual maintenance') ||
    lowerText.includes('maintenance contract') ||
    lowerText.includes('service contract')
  ) {
    return 'amc'
  }

  // Subscription indicators (check AFTER license to avoid false matches)
  // Only match if NOT a license document
  if (
    !lowerText.includes('driving') &&
    !lowerText.includes('licence') &&
    !lowerText.includes('license') &&
    (lowerText.includes('subscription') ||
    lowerText.includes('renewal') ||
    lowerText.includes('plan') ||
    lowerText.includes('membership') ||
    (lowerText.includes('valid till') && !lowerText.includes('union of india')))
  ) {
    return 'subscription'
  }

  // Medicine indicators
  if (
    lowerText.includes('tablet') ||
    lowerText.includes('capsule') ||
    lowerText.includes('medicine') ||
    lowerText.includes('mg') ||
    lowerText.includes('ml') ||
    lowerText.includes('batch no') ||
    lowerText.includes('batch number') ||
    lowerText.includes('mfg date') ||
    lowerText.includes('manufacturing date') ||
    lowerText.includes('expiry date') && (lowerText.includes('tablet') || lowerText.includes('capsule'))
  ) {
    return 'medicine'
  }

  // Default to "other" for unknown documents
  // This is the safest category - only extracts expiry date
  return 'other'
}

/**
 * Get confidence level for category prediction
 * Rule-based predictions are always high confidence
 */
export function getCategoryConfidence(
  category: CategoryKey,
  text: string
): number {
  // Rule-based predictions are reliable
  if (category !== 'other') {
    return 85 // High confidence for rule-based matches
  }

  // "Other" category is a safe default
  // Lower confidence indicates uncertainty
  return 60
}

/**
 * Predict category with confidence
 */
export function predictCategoryWithConfidence(text: string): {
  category: CategoryKey
  confidence: number
} {
  const category = predictCategory(text)
  const confidence = getCategoryConfidence(category, text)

  return { category, confidence }
}

