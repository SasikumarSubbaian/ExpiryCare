// Master Extraction Engine
// Category-aware, privacy-first, production-ready
// Entry point for all extraction operations

import { extractWarrantyFields } from './categoryExtractors'
import { extractInsuranceFields } from './categoryExtractors'
import { extractAMCFields } from './categoryExtractors'
import { extractSubscriptionFields } from './categoryExtractors'
import { extractMedicineFields } from './categoryExtractors'
import { extractOtherFields } from './categoryExtractors'
import type { ExtractedFields } from './categoryExtractors'

export type Category = 'Warranty' | 'Insurance' | 'AMC' | 'Subscription' | 'Medicine' | 'Other'

export interface ExtractionResult {
  expiryDate: {
    value: string | null
    confidence: 'High' | 'Medium' | 'Low'
    sourceKeyword: string | null
  }
  productName?: string | null
  companyName?: string | null
  additionalFields?: Record<string, string>
  extractionWarnings?: string[]
}

/**
 * Master extraction function
 * Routes to category-specific extractors based on predicted category
 */
export function extractByCategory(
  ocrText: string,
  category: Category
): ExtractionResult {
  if (!ocrText || ocrText.trim().length < 10) {
    return {
      expiryDate: {
        value: null,
        confidence: 'Low',
        sourceKeyword: null,
      },
    }
  }

  let extracted: ExtractedFields

  // Route to category-specific extractor
  switch (category) {
    case 'Warranty':
      extracted = extractWarrantyFields(ocrText)
      break
    case 'Insurance':
      extracted = extractInsuranceFields(ocrText)
      break
    case 'AMC':
      extracted = extractAMCFields(ocrText)
      break
    case 'Subscription':
      extracted = extractSubscriptionFields(ocrText)
      break
    case 'Medicine':
      extracted = extractMedicineFields(ocrText)
      break
    case 'Other':
    default:
      extracted = extractOtherFields(ocrText)
      break
  }

  // Convert to standard format
  return {
    expiryDate: {
      value: extracted.expiryDate.value,
      confidence: extracted.expiryDate.confidence,
      sourceKeyword: extracted.expiryDate.sourceKeyword,
    },
    productName: extracted.productName,
    companyName: extracted.companyName,
    additionalFields: extracted.additionalFields,
    extractionWarnings: extracted.extractionWarnings,
  }
}

/**
 * Check if expiry date is in the past (expired)
 */
export function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  
  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return expiry < today
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  
  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

