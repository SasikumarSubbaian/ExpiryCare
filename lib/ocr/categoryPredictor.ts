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
    'tablet',
    'tablets',
    'capsule',
    'capsules',
    'vitamin',
    'vitamins',
    'chewable',
    'mg',
    'ml',
    'pharma',
    'pharmaceuticals',
    'manufactured',
    'mfg',
  ],
  other: [], // Default category, no specific keywords
}

/**
 * Predicts document category from OCR text
 * Rule-based prediction with simple keyword matching
 */
export function predictCategory(ocrText: string): Category {
  const t = ocrText.toLowerCase()

  // Medicine detection - PRIORITIZE with enhanced keywords and scoring
  // Check for medicine keywords first (highest priority)
  const medicineKeywords = [
    'vitamin', 'tablet', 'tablets', 'capsule', 'capsules', 'chewable',
    'medicine', 'medication', 'drug', 'pharma', 'pharmaceutical',
    'mg', 'ml', 'mfg', 'exp date', 'batch', 'use before', 'best before',
    'prescription', 'pharmaceuticals'
  ]
  
  const medicineScore = medicineKeywords.filter(keyword => t.includes(keyword)).length
  
  // If we have strong medicine indicators, prioritize medicine
  if (medicineScore >= 2 || t.includes('vitamin') || t.includes('chewable') || 
      (t.includes('tablet') && (t.includes('vitamin') || t.includes('chewable')))) {
    return 'medicine'
  }

  // Insurance detection
  if (t.includes('policy') || t.includes('insurance') || 
      t.includes('premium') || t.includes('coverage')) {
    return 'insurance'
  }

  // Warranty detection
  if (t.includes('warranty') || t.includes('guarantee') || 
      t.includes('valid till') || t.includes('purchase date')) {
    return 'warranty'
  }

  // Subscription detection
  if (t.includes('subscription') || t.includes('renewal') || 
      t.includes('membership') || t.includes('plan')) {
    return 'subscription'
  }

  // AMC detection
  if (t.includes('amc') || t.includes('maintenance') || 
      t.includes('service contract') || t.includes('service provider')) {
    return 'amc'
  }

  // Default to Other
  return 'other'
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

