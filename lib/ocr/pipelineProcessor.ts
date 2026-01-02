/**
 * OCR Pipeline Processor
 * Integrates category prediction, field extraction, and schema mapping
 */

import { predictCategory, getPredictionConfidence } from './categoryPredictor'
import { getCategoryFields } from './categoryFieldSchemas'
import {
  extractExpiryDateField,
  extractMedicineName,
  extractCompanyName,
  extractProductName,
  extractPolicyNumber,
  extractInsuranceProvider,
  extractDocumentName,
  extractIssuer,
} from './fieldExtractors'
import { sanitizeOCRText } from './sanitizeOCRText'
import { extractByCategory } from './extractors'
import { extractDrivingLicenseFields } from './fieldExtractors'
import { getFieldsForCategory } from './categoryFieldMap'
import type { Category } from './categorySchemas'
import type { ExtractedField, OCRResult } from './ocrPipeline'

/**
 * Process OCR text through the human-like pipeline
 */
export function processOCRText(ocrText: string, userSelectedCategory?: string | null): OCRResult {
  // CRITICAL: Use ORIGINAL text for category detection (not sanitized)
  // Sanitization removes important keywords needed for detection
  const originalText = ocrText || ''
  
  // Sanitize text to remove PII (only for field extraction, not category detection)
  const sanitizedText = originalText ? sanitizeOCRText(originalText) : ''
  
  // Predict or use user-selected category
  // Use ORIGINAL text for category prediction to preserve keywords
  const validCategories: Category[] = ['warranty', 'insurance', 'amc', 'medicine', 'subscription', 'other']
  const userCategory = userSelectedCategory && validCategories.includes(userSelectedCategory as Category)
    ? (userSelectedCategory as Category)
    : null
  
  const category = userCategory || predictCategory(originalText) // Use original text
  const confidence = getPredictionConfidence(originalText, category) // Use original text
  
  // Get field definitions for this category
  const fieldDefinitions = getCategoryFields(category)
  
  // Extract fields based on category
  const fields: Record<string, ExtractedField> = {}
  
  // Always extract expiry date first (required)
  // FALLBACK MODE: If expiry date not detected, add empty field (user must edit)
  const expiryField = extractExpiryDateField(sanitizedText)
  if (expiryField) {
    fields.expiryDate = expiryField
  } else {
    // Add empty expiry date field - user must enter manually
    fields.expiryDate = {
      label: 'Expiry Date',
      value: '',
      confidence: 0,
      required: true,
    }
  }
  
  // Extract category-specific fields
  for (const fieldDef of fieldDefinitions) {
    // Skip expiry date (already extracted)
    if (fieldDef.key === 'expiryDate') continue
    
    let extractedField: ExtractedField | null = null
    
    switch (fieldDef.key) {
      case 'medicineName':
        if (category === 'medicine') {
          extractedField = extractMedicineName(sanitizedText)
        }
        break
      case 'companyName':
        extractedField = extractCompanyName(sanitizedText, category)
        break
      case 'productName':
        if (category === 'warranty') {
          extractedField = extractProductName(sanitizedText)
        }
        break
      case 'policyNumber':
        if (category === 'insurance') {
          extractedField = extractPolicyNumber(sanitizedText)
        }
        break
      case 'provider':
        if (category === 'insurance') {
          extractedField = extractInsuranceProvider(sanitizedText)
        }
        break
      case 'documentName':
        if (category === 'other') {
          extractedField = extractDocumentName(sanitizedText)
        }
        break
      case 'issuer':
        if (category === 'other') {
          extractedField = extractIssuer(sanitizedText)
        }
        break
      case 'holderName':
        if (category === 'other') {
          // Extract holder name for licenses (optional, low confidence threshold)
          const holderPatterns = [
            /(?:name|holder|name of holder)\s*:?\s*([A-Za-z\s]{2,40})/i,
          ]
          for (const pattern of holderPatterns) {
            const match = sanitizedText.match(pattern)
            if (match && match[1]) {
              const value = match[1].trim()
              if (value.length >= 2 && value.length <= 40) {
                extractedField = {
                  label: 'Holder Name',
                  value,
                  confidence: 55,
                  required: false,
                }
                break
              }
            }
          }
        }
        break
      case 'serviceName':
        if (category === 'subscription') {
          // Extract from legacy extractor if available
          const legacyExtracted = extractByCategory(sanitizedText, category)
          if (legacyExtracted.serviceName) {
            extractedField = {
              label: 'Service Name',
              value: legacyExtracted.serviceName,
              confidence: 60,
              required: true,
            }
          }
        }
        break
      case 'serviceType':
        if (category === 'amc') {
          const legacyExtracted = extractByCategory(sanitizedText, category)
          if (legacyExtracted.serviceType) {
            extractedField = {
              label: 'Service Type',
              value: legacyExtracted.serviceType,
              confidence: 60,
              required: true,
            }
          }
        }
        break
      case 'providerName':
        if (category === 'amc') {
          const legacyExtracted = extractByCategory(sanitizedText, category)
          if (legacyExtracted.providerName) {
            extractedField = {
              label: 'Provider Name',
              value: legacyExtracted.providerName,
              confidence: 60,
              required: true,
            }
          }
        }
        break
    }
    
    // ALWAYS add field if required, even with low confidence
    // For optional fields, only add if confidence >= 50%
    if (extractedField) {
      // Add field regardless of confidence (UI will show confidence badge)
      fields[fieldDef.key] = extractedField
    } else if (fieldDef.required) {
      // Add empty required field - user must enter manually
      fields[fieldDef.key] = {
        label: fieldDef.label,
        value: '',
        confidence: 0,
        required: true,
      }
    }
  }
  
  // Special handling for driving license - extract all fields
  // Use ORIGINAL text (not sanitized) for better extraction
  const lowerText = originalText.toLowerCase()
  const isDrivingLicense = category === 'other' && 
    (lowerText.includes('driving licence') || lowerText.includes('driving license') || 
     lowerText.includes('dl no') || lowerText.includes('dl number'))
  
  if (isDrivingLicense) {
    // Extract all Driving License fields using original text
    const dlFields = extractDrivingLicenseFields(originalText)
    
    // Merge extracted fields
    for (const [key, field] of Object.entries(dlFields)) {
      fields[key] = field
    }
    
    // Ensure required fields exist (even if empty) - use lowercase "other"
    const requiredFields = getFieldsForCategory('other')
    for (const fieldKey of requiredFields) {
      if (!fields[fieldKey]) {
        // Add empty required field
        const label = fieldKey
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim()
        fields[fieldKey] = {
          label,
          value: '',
          confidence: 0,
          required: fieldKey === 'expiryDate' || fieldKey === 'documentName',
        }
      }
    }
  }
  
  // ALWAYS return OCRResult - never return null or throw
  // Ensure category is always valid
  const safeCategory: Category = category || 'other'
  const safeConfidence = Math.max(0, Math.min(100, Math.round(confidence * 100)))
  
  return {
    category: safeCategory,
    confidence: safeConfidence,
    fields, // May be empty - that's OK, UI will show empty fields
    rawText: sanitizedText.substring(0, 1000), // Limit raw text
  }
}

/**
 * Convert OCRResult to legacy format for backward compatibility
 */
export function convertToLegacyFormat(result: OCRResult): any {
  const categoryConfidence = result.confidence >= 70 ? 'High' : result.confidence >= 40 ? 'Medium' : 'Low'
  
  const legacyData: any = {
    category: result.category,
    categoryConfidence,
    categoryConfidencePercentage: result.confidence,
    expiryDate: result.fields.expiryDate ? {
      value: result.fields.expiryDate.value,
      confidence: result.fields.expiryDate.confidence >= 70 ? 'High' : result.fields.expiryDate.confidence >= 40 ? 'Medium' : 'Low',
      sourceKeyword: null,
    } : { value: null, confidence: 'Low' as const, sourceKeyword: null },
  }
  
  // Map all fields to legacy format
  for (const [key, field] of Object.entries(result.fields)) {
    if (key === 'expiryDate') continue
    
    const confidenceLevel = field.confidence >= 70 ? 'High' : field.confidence >= 40 ? 'Medium' : 'Low'
    
    // Map field keys to legacy format
    let legacyKey = key
    if (key === 'provider' && result.category === 'insurance') {
      // Keep as 'provider' for insurance
      legacyKey = 'provider'
    } else if (key === 'documentName') {
      legacyKey = 'documentType' // Map to documentType for backward compatibility
    }
    
    legacyData[legacyKey] = {
      value: field.value,
      confidence: confidenceLevel,
      confidencePercentage: field.confidence,
    }
  }
  
  return legacyData
}
