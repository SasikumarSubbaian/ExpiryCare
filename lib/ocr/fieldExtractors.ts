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

/**
 * Extract Driving License specific fields
 */
export function extractDrivingLicenseFields(text: string): Record<string, ExtractedField> {
  const fields: Record<string, ExtractedField> = {}
  const lowerText = text.toLowerCase()
  
  // License Number: /(DL|DL No|DL No\.)\s*[:\-]?\s*[A-Z0-9]+/
  const licensePatterns = [
    /(?:DL|DL\s+No|DL\s+No\.|DL\s+Number)\s*[:\-]?\s*([A-Z0-9\-\s]{5,20})/i,
    /DL\s*[:\-]?\s*([A-Z0-9\-\s]{5,20})/i,
  ]
  
  for (const pattern of licensePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      if (value.length >= 5 && value.length <= 20) {
        fields.licenseNumber = {
          label: 'License Number',
          value,
          confidence: 90, // Regex exact match
          required: true,
        }
        break
      }
    }
  }
  
  // Holder Name: Line following "Name" OR line above DOB
  const namePatterns = [
    /(?:Name|Name\s+of\s+Holder)\s*[:\-]?\s*([A-Za-z\s]{2,50})/i,
    /Name\s*[:\-]?\s*([A-Za-z\s]{2,50})/i,
  ]
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      if (value.length >= 2 && value.length <= 50 && !value.toLowerCase().includes('date')) {
        fields.holderName = {
          label: 'Holder Name',
          value,
          confidence: 90,
          required: false,
        }
        break
      }
    }
  }
  
  // DOB: /(Date of Birth|DOB)\s*[:\-]?\s*\d{2}-\d{2}-\d{4}/
  const dobPatterns = [
    /(?:Date\s+of\s+Birth|DOB|D\.O\.B\.)\s*[:\-]?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
    /(?:Date\s+of\s+Birth|DOB)\s*[:\-]?\s*(\d{2}\.\d{2}\.\d{4})/i,
  ]
  
  for (const pattern of dobPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      fields.dateOfBirth = {
        label: 'Date of Birth',
        value,
        confidence: 90,
        required: false,
      }
      break
    }
  }
  
  // Issue Date: /(Date of Issue)\s*[:\-]?\s*\d{2}-\d{2}-\d{4}/
  const issuePatterns = [
    /(?:Date\s+of\s+Issue|Issue\s+Date)\s*[:\-]?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
    /(?:Date\s+of\s+Issue|Issue\s+Date)\s*[:\-]?\s*(\d{2}\.\d{2}\.\d{4})/i,
  ]
  
  for (const pattern of issuePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      fields.dateOfIssue = {
        label: 'Date of Issue',
        value,
        confidence: 90,
        required: false,
      }
      break
    }
  }
  
  // Expiry Date: /(Valid Till|Expiry)\s*[:\-]?\s*\d{2}-\d{2}-\d{4}/
  const expiryPatterns = [
    /(?:Valid\s+Till|Expiry|Expiry\s+Date)\s*[:\-]?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
    /(?:Valid\s+Till|Expiry)\s*[:\-]?\s*(\d{2}\.\d{2}\.\d{4})/i,
  ]
  
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const value = match[1].trim()
      fields.expiryDate = {
        label: 'Expiry Date',
        value,
        confidence: 90,
        required: true,
      }
      break
    }
  }
  
  // Document Name: Auto-fill if driving license detected
  if (lowerText.includes('driving licence') || lowerText.includes('driving license')) {
    fields.documentName = {
      label: 'Document Name',
      value: 'Driving Licence',
      confidence: 95,
      required: true,
    }
  }
  
  // Document Provider: If text contains "Union of India" → provider = "Government of India"
  if (lowerText.includes('union of india') || lowerText.includes('government of india')) {
    fields.documentProvider = {
      label: 'Document Provider',
      value: 'Government of India',
      confidence: 90,
      required: false,
    }
  } else if (lowerText.includes('transport') || lowerText.includes('rto')) {
    fields.documentProvider = {
      label: 'Document Provider',
      value: 'Transport Authority',
      confidence: 80,
      required: false,
    }
  }
  
  // Blood Group (optional)
  const bloodGroupPattern = /(?:Blood\s+Group|Blood\s+Type)\s*[:\-]?\s*([A|B|AB|O][\+\-])/i
  const bloodMatch = text.match(bloodGroupPattern)
  if (bloodMatch && bloodMatch[1]) {
    fields.bloodGroup = {
      label: 'Blood Group',
      value: bloodMatch[1].trim(),
      confidence: 90,
      required: false,
    }
  }
  
  return fields
}

