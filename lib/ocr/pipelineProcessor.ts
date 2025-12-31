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
import type { Category } from './categorySchemas'
import type { ExtractedField, OCRResult } from './ocrPipeline'

/**
 * Process OCR text through the human-like pipeline
 */
export function processOCRText(ocrText: string, userSelectedCategory?: string | null): OCRResult {
  // Sanitize text to remove PII
  const sanitizedText = sanitizeOCRText(ocrText)
  
  // Predict or use user-selected category
  const validCategories: Category[] = ['warranty', 'insurance', 'amc', 'medicine', 'subscription', 'other']
  const userCategory = userSelectedCategory && validCategories.includes(userSelectedCategory as Category)
    ? (userSelectedCategory as Category)
    : null
  
  const category = userCategory || predictCategory(sanitizedText)
  const confidence = getPredictionConfidence(sanitizedText, category)
  
  // Get field definitions for this category
  const fieldDefinitions = getCategoryFields(category)
  
  // Extract fields based on category
  const fields: Record<string, ExtractedField> = {}
  
  // Always extract expiry date first (required)
  const expiryField = extractExpiryDateField(sanitizedText)
  if (expiryField) {
    fields.expiryDate = expiryField
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
    
    // Only add field if extracted and confidence >= 50%
    if (extractedField && extractedField.confidence >= 50) {
      fields[fieldDef.key] = extractedField
    } else if (fieldDef.required) {
      // Add empty required field with low confidence
      fields[fieldDef.key] = {
        label: fieldDef.label,
        value: '',
        confidence: 0,
        required: true,
      }
    }
  }
  
  // Special handling for driving license
  if (category === 'other' && sanitizedText.toLowerCase().includes('driving licence')) {
    // Auto-fill document name if not extracted
    if (!fields.documentName) {
      fields.documentName = {
        label: 'Document Name',
        value: 'Driving Licence',
        confidence: 95,
        required: true,
      }
    }
    
    // Auto-fill issuer if not extracted
    if (!fields.issuer) {
      fields.issuer = {
        label: 'Issued By',
        value: 'Government of India',
        confidence: 70,
        required: false,
      }
    }
  }
  
  return {
    category,
    confidence: Math.round(confidence * 100), // Convert 0-1 to 0-100
    fields,
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
