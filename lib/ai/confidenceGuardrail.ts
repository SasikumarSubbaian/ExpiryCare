// Confidence Guardrail - Validates confidence scores and flags fields requiring user confirmation

import type { ReasoningEngineOutput } from './reasoningEngine'

/**
 * Confidence thresholds for different fields
 */
const CONFIDENCE_THRESHOLDS = {
  expiry: 70,      // Expiry date requires 70%+ confidence
  company: 60,    // Company name requires 60%+ confidence
  product: 50,    // Product name requires 50%+ confidence
  category: 50,   // Category requires 50%+ confidence
} as const

/**
 * Field names for validation
 */
const FIELD_NAMES = {
  expiryDate: 'expiryDate',
  companyName: 'companyName',
  productName: 'productName',
  itemCategory: 'itemCategory',
} as const

/**
 * Validation result for confidence guardrail
 */
export interface ConfidenceValidationResult {
  requiresUserConfirmation: boolean
  weakFields: string[]
  fieldStatus: {
    expiryDate: {
      needsConfirmation: boolean
      confidence: number
      threshold: number
    }
    companyName: {
      needsConfirmation: boolean
      confidence: number
      threshold: number
    }
    productName: {
      needsConfirmation: boolean
      confidence: number
      threshold: number
    }
    itemCategory: {
      needsConfirmation: boolean
      confidence: number
      threshold: number
    }
  }
}

/**
 * Validate confidence scores and identify fields requiring user confirmation
 * 
 * Rules:
 * - If expiryConfidence < 70: Mark expiryDate as "needs confirmation"
 * - If companyConfidence < 60: Allow manual entry
 * - Never auto-save low-confidence fields
 * 
 * @param output - Reasoning engine output
 * @returns Validation result with weak fields
 */
export function validateConfidence(
  output: ReasoningEngineOutput
): ConfidenceValidationResult {
  const weakFields: string[] = []
  const fieldStatus: ConfidenceValidationResult['fieldStatus'] = {
    expiryDate: {
      needsConfirmation: false,
      confidence: output.expiryConfidence,
      threshold: CONFIDENCE_THRESHOLDS.expiry,
    },
    companyName: {
      needsConfirmation: false,
      confidence: output.companyConfidence,
      threshold: CONFIDENCE_THRESHOLDS.company,
    },
    productName: {
      needsConfirmation: false,
      confidence: 0, // Product name doesn't have confidence in output, treat as low
      threshold: CONFIDENCE_THRESHOLDS.product,
    },
    itemCategory: {
      needsConfirmation: false,
      confidence: 0, // Category doesn't have confidence in output, treat as low
      threshold: CONFIDENCE_THRESHOLDS.category,
    },
  }

  // Check expiry date confidence
  // Rule: If expiryConfidence < 70, mark expiryDate as "needs confirmation"
  if (output.expiryDate && output.expiryConfidence < CONFIDENCE_THRESHOLDS.expiry) {
    fieldStatus.expiryDate.needsConfirmation = true
    weakFields.push(FIELD_NAMES.expiryDate)
  }

  // Check company name confidence
  // Rule: If companyConfidence < 60, allow manual entry (mark as needs confirmation)
  if (output.companyName && output.companyConfidence < CONFIDENCE_THRESHOLDS.company) {
    fieldStatus.companyName.needsConfirmation = true
    weakFields.push(FIELD_NAMES.companyName)
  }

  // Check product name (if present but confidence is low)
  // Note: Product name doesn't have explicit confidence, but if it's null or empty,
  // we don't mark it as weak. Only mark if it exists but seems unreliable.
  if (output.productName) {
    // Since productName doesn't have confidence, we infer from context
    // If expiry and company are both low confidence, product is likely weak too
    if (
      (output.expiryConfidence < CONFIDENCE_THRESHOLDS.expiry) ||
      (output.companyConfidence < CONFIDENCE_THRESHOLDS.company)
    ) {
      fieldStatus.productName.needsConfirmation = true
      weakFields.push(FIELD_NAMES.productName)
    }
  }

  // Check item category (if present but confidence is low)
  // Similar to product name, infer from other fields
  if (output.itemCategory) {
    if (
      (output.expiryConfidence < CONFIDENCE_THRESHOLDS.expiry) ||
      (output.companyConfidence < CONFIDENCE_THRESHOLDS.company)
    ) {
      fieldStatus.itemCategory.needsConfirmation = true
      weakFields.push(FIELD_NAMES.itemCategory)
    }
  }

  // Determine if user confirmation is required
  const requiresUserConfirmation = weakFields.length > 0

  return {
    requiresUserConfirmation,
    weakFields,
    fieldStatus,
  }
}

/**
 * Check if a field should be auto-saved
 * 
 * @param fieldName - Name of the field
 * @param output - Reasoning engine output
 * @returns true if field can be auto-saved, false if requires confirmation
 */
export function canAutoSave(
  fieldName: keyof typeof FIELD_NAMES,
  output: ReasoningEngineOutput
): boolean {
  const validation = validateConfidence(output)
  return !validation.weakFields.includes(FIELD_NAMES[fieldName])
}

/**
 * Get confidence threshold for a field
 */
export function getConfidenceThreshold(fieldName: keyof typeof FIELD_NAMES): number {
  switch (fieldName) {
    case 'expiryDate':
      return CONFIDENCE_THRESHOLDS.expiry
    case 'companyName':
      return CONFIDENCE_THRESHOLDS.company
    case 'productName':
      return CONFIDENCE_THRESHOLDS.product
    case 'itemCategory':
      return CONFIDENCE_THRESHOLDS.category
    default:
      return 50
  }
}

