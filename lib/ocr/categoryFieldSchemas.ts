/**
 * Category Field Schemas - Dynamic Field Definitions
 * Defines which fields to extract and display per category
 */

export interface FieldDefinition {
  key: string
  label: string
  required: boolean
}

export const CATEGORY_SCHEMAS: Record<string, FieldDefinition[]> = {
  warranty: [
    { key: 'productName', label: 'Product Name', required: true },
    { key: 'companyName', label: 'Company Name', required: true },
    { key: 'purchaseDate', label: 'Purchase Date', required: false },
    { key: 'expiryDate', label: 'Expiry Date', required: true },
  ],
  medicine: [
    { key: 'medicineName', label: 'Medicine Name', required: true },
    { key: 'companyName', label: 'Manufacturer', required: true },
    { key: 'expiryDate', label: 'Expiry Date', required: true },
  ],
  insurance: [
    { key: 'policyNumber', label: 'Policy Number', required: true },
    { key: 'provider', label: 'Insurance Provider', required: true },
    { key: 'expiryDate', label: 'Policy Expiry Date', required: true },
  ],
  subscription: [
    { key: 'serviceName', label: 'Service Name', required: true },
    { key: 'planType', label: 'Plan Type', required: false },
    { key: 'expiryDate', label: 'Expiry Date', required: true },
  ],
  amc: [
    { key: 'serviceType', label: 'Service Type', required: true },
    { key: 'providerName', label: 'Provider Name', required: true },
    { key: 'expiryDate', label: 'Expiry Date', required: true },
  ],
  other: [
    { key: 'documentName', label: 'Document Name', required: true },
    { key: 'issuer', label: 'Issued By', required: false },
    { key: 'expiryDate', label: 'Expiry Date', required: true },
  ],
}

/**
 * Get field definitions for a category
 */
export function getCategoryFields(category: string): FieldDefinition[] {
  return CATEGORY_SCHEMAS[category.toLowerCase()] || CATEGORY_SCHEMAS.other
}

/**
 * Check if field is required for category
 */
export function isFieldRequired(category: string, fieldKey: string): boolean {
  const fields = getCategoryFields(category)
  const field = fields.find(f => f.key === fieldKey)
  return field?.required || false
}
