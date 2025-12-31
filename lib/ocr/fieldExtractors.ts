/**
 * Field Extractors - Human-like Extraction Logic
 * Uses proximity search and context-aware extraction
 */

import { extractExpiryDate, type ExpiryDateResult } from './expiryExtractor'
import type { ExtractedField } from './ocrPipeline'

/**
 * Extract value near a label (within 3 lines)
 */
export function extractNearLabel(
  text: string,
  label: string,
  maxDistance: number = 3
): string | null {
  const lines = text.split('\n')
  const lowerText = text.toLowerCase()
  const lowerLabel = label.toLowerCase()
  
  // Find label position
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(lowerLabel)) {
      // Look for value in same line or next few lines
      for (let j = i; j < Math.min(i + maxDistance, lines.length); j++) {
        const line = lines[j].trim()
        // Remove label from line
        const value = line.replace(new RegExp(lowerLabel, 'gi'), '').trim()
        // Remove common separators
        const cleanValue = value.replace(/^[:-\s]+/, '').trim()
        
        if (cleanValue.length > 0 && cleanValue.length < 100) {
          return cleanValue
        }
      }
    }
  }
  
  return null
}

/**
 * Calculate confidence score for extracted field
 */
export function calculateFieldConfidence(
  value: string | null,
  hasKeywordNearby: boolean,
  hasDateFormat: boolean,
  positionScore: number
): number {
  if (!value || value.trim().length === 0) {
    return 0
  }
  
  let confidence = 30 // Base confidence
  
  if (hasDateFormat) {
    confidence += 40
  }
  
  if (hasKeywordNearby) {
    confidence += 30
  }
  
  // Position score (0-30)
  confidence += Math.min(positionScore, 30)
  
  return Math.min(confidence, 100)
}

/**
 * Extract expiry date with enhanced confidence
 */
export function extractExpiryDateField(text: string): ExtractedField | null {
  const result = extractExpiryDate(text)
  
  if (!result.value) {
    return null
  }
  
  // Calculate confidence based on result
  let confidence = 50 // Base
  if (result.confidence === 'High') {
    confidence = 90
  } else if (result.confidence === 'Medium') {
    confidence = 60
  } else {
    confidence = 30
  }
  
  // Boost if keyword found nearby
  if (result.sourceKeyword) {
    confidence = Math.min(confidence + 10, 100)
  }
  
  return {
    label: 'Expiry Date',
    value: result.value,
    confidence,
    required: true,
  }
}

/**
 * Extract medicine name from text
 */
export function extractMedicineName(text: string): ExtractedField | null {
  const lines = text.split('\n')
  
  // Look for medicine name in first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim()
    const lowerLine = line.toLowerCase()
    
    // Skip if line contains expiry/batch/manufacturing keywords
    if (lowerLine.match(/(expiry|date|batch|mfg|manufacturing|store)/i)) {
      continue
    }
    
    // Check if line looks like a product name
    if (line.length >= 3 && line.length <= 60) {
      // Check for medicine indicators
      if (lowerLine.includes('vitamin') || 
          lowerLine.includes('tablet') || 
          lowerLine.includes('capsule') ||
          lowerLine.includes('chewable')) {
        return {
          label: 'Medicine Name',
          value: line,
          confidence: 75,
          required: true,
        }
      }
      
      // Generic product name (lower confidence)
      if (line.match(/^[A-Za-z0-9\s]+$/) && line.length >= 3) {
        return {
          label: 'Medicine Name',
          value: line,
          confidence: 50,
          required: true,
        }
      }
    }
  }
  
  return null
}

/**
 * Extract company/manufacturer name
 */
export function extractCompanyName(text: string, category: string): ExtractedField | null {
  const patterns = [
    /(?:manufacturer|company|made by|by)\s*:?\s*([A-Za-z\s]{2,40})/i,
    /([A-Za-z\s]{2,30}?)(?:\s+(?:pharma|pharmaceuticals|ltd|limited|inc))/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      if (value.length >= 2 && value.length <= 40) {
        return {
          label: category === 'medicine' ? 'Manufacturer' : 'Company Name',
          value,
          confidence: 60,
          required: category === 'medicine',
        }
      }
    }
  }
  
  return null
}

/**
 * Extract product name for warranty
 */
export function extractProductName(text: string): ExtractedField | null {
  const patterns = [
    /(?:product|item|model)\s*:?\s*([A-Za-z0-9\s]{2,50})/i,
    /^([A-Za-z][A-Za-z0-9\s]{2,50}?)(?:\s+warranty|guarantee)/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      if (value.length >= 2 && value.length <= 50) {
        return {
          label: 'Product Name',
          value,
          confidence: 65,
          required: true,
        }
      }
    }
  }
  
  return null
}

/**
 * Extract policy number for insurance
 */
export function extractPolicyNumber(text: string): ExtractedField | null {
  const patterns = [
    /(?:policy\s*(?:no|number|#))\s*:?\s*([A-Z0-9\-\s]{3,30})/i,
    /policy\s+([A-Z0-9\-\s]{3,30})/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      if (value.length >= 3 && value.length <= 30) {
        return {
          label: 'Policy Number',
          value,
          confidence: 70,
          required: true,
        }
      }
    }
  }
  
  return null
}

/**
 * Extract insurance provider
 */
export function extractInsuranceProvider(text: string): ExtractedField | null {
  const patterns = [
    /(?:insurer|insurance\s+company|provider)\s*:?\s*([A-Za-z\s]{2,40})/i,
    /^([A-Za-z][A-Za-z\s]{2,30}?)(?:\s+insurance|life|general)/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      if (value.length >= 2 && value.length <= 40) {
        return {
          label: 'Insurance Provider',
          value,
          confidence: 60,
          required: true,
        }
      }
    }
  }
  
  return null
}

/**
 * Extract document name for Other category
 */
export function extractDocumentName(text: string): ExtractedField | null {
  const lowerText = text.toLowerCase()
  
  // Check for driving license
  if (lowerText.includes('driving licence') || lowerText.includes('driving license')) {
    return {
      label: 'Document Name',
      value: 'Driving Licence',
      confidence: 95,
      required: true,
    }
  }
  
  // Generic document name from first line
  const lines = text.split('\n')
  if (lines.length > 0) {
    const firstLine = lines[0].trim()
    if (firstLine.length >= 3 && firstLine.length <= 50) {
      return {
        label: 'Document Name',
        value: firstLine,
        confidence: 50,
        required: true,
      }
    }
  }
  
  return null
}

/**
 * Extract issuer for Other category
 */
export function extractIssuer(text: string): ExtractedField | null {
  const lowerText = text.toLowerCase()
  
  // Check for driving license
  if (lowerText.includes('driving licence') || lowerText.includes('driving license') || lowerText.includes('dl no')) {
    // Look for transport authority or government
    if (lowerText.includes('transport') || lowerText.includes('rto')) {
      return {
        label: 'Issued By',
        value: 'Transport Authority',
        confidence: 80,
        required: false,
      }
    }
    return {
      label: 'Issued By',
      value: 'Government of India',
      confidence: 70,
      required: false,
    }
  }
  
  // Generic issuer extraction
  const patterns = [
    /(?:issued\s+by|authority|department)\s*:?\s*([A-Za-z\s]{2,40})/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      if (value.length >= 2 && value.length <= 40) {
        return {
          label: 'Issued By',
          value,
          confidence: 55,
          required: false,
        }
      }
    }
  }
  
  return null
}
