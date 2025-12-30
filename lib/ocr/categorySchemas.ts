/**
 * Category-aware field schemas
 * Defines which fields are allowed/extracted per category
 * CRITICAL: Never extract or store PII (Personal Identifiable Information)
 */

export type Category = 'warranty' | 'insurance' | 'amc' | 'subscription' | 'medicine' | 'other'

export interface FieldSchema {
  allowed: string[]
  forbidden: string[]
  required?: string[]
}

/**
 * Category-specific field schemas
 * Only extract safe, non-confidential fields
 */
export const categorySchemas: Record<Category, FieldSchema> = {
  warranty: {
    allowed: ['productName', 'companyName', 'expiryDate'],
    forbidden: [
      'invoiceNumber',
      'serialNumber',
      'address',
      'phone',
      'gst',
      'customerName',
      'purchaseDate',
    ],
    required: ['expiryDate'],
  },
  insurance: {
    allowed: ['policyType', 'insurerName', 'expiryDate'],
    forbidden: [
      'policyNumber',
      'vehicleNumber',
      'customerName',
      'dob',
      'address',
      'phone',
      'nominee',
    ],
    required: ['expiryDate'],
  },
  amc: {
    allowed: ['serviceType', 'providerName', 'expiryDate'],
    forbidden: [
      'contractNumber',
      'customerName',
      'address',
      'phone',
      'invoiceNumber',
    ],
    required: ['expiryDate'],
  },
  subscription: {
    allowed: ['serviceName', 'planType', 'expiryDate'],
    forbidden: [
      'accountNumber',
      'customerName',
      'billingAddress',
      'paymentMethod',
      'cardNumber',
    ],
    required: ['expiryDate'],
  },
  medicine: {
    allowed: ['medicineName', 'brandName', 'companyName', 'expiryDate'],
    forbidden: [
      'batchNumber',
      'mfgLicense',
      'patientName',
      'prescriptionNumber',
      'doctorName',
    ],
    required: ['expiryDate'],
  },
  other: {
    // SAFE MODE: Only extract expiry date for "Other" category
    allowed: ['expiryDate', 'documentType'],
    forbidden: [
      'name',
      'idNumber',
      'licenseNumber',
      'address',
      'phone',
      'email',
      'aadhaar',
      'pan',
      'passport',
    ],
    required: ['expiryDate'],
  },
}

/**
 * Get allowed fields for a category
 */
export function getAllowedFields(category: Category): string[] {
  return categorySchemas[category]?.allowed || ['expiryDate']
}

/**
 * Check if a field is allowed for a category
 */
export function isFieldAllowed(category: Category, fieldName: string): boolean {
  const schema = categorySchemas[category]
  if (!schema) return false

  return schema.allowed.includes(fieldName)
}

/**
 * Check if a field is forbidden for a category
 */
export function isFieldForbidden(category: Category, fieldName: string): boolean {
  const schema = categorySchemas[category]
  if (!schema) return true // Default to forbidden if schema not found

  return schema.forbidden.includes(fieldName)
}

