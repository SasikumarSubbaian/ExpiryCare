/**
 * Category-based field configuration
 * Single source of truth for manual entry and OCR extraction
 */

export type Category = 'warranty' | 'insurance' | 'amc' | 'subscription' | 'medicine' | 'other'

export interface CategoryField {
  key: string
  label: string
  required: boolean
  editableLabel?: boolean
}

export const CATEGORY_FIELDS: Record<Category, CategoryField[]> = {
  warranty: [
    { key: 'companyName', label: 'Company Name', required: true },
    { key: 'productName', label: 'Product Name', required: true },
    { key: 'purchaseDate', label: 'Purchase Date', required: false },
    { key: 'expiryDate', label: 'Expiry Date', required: true },
  ],
  insurance: [
    { key: 'providerName', label: 'Insurance Provider', required: true },
    { key: 'policyNumber', label: 'Policy Number', required: true },
    { key: 'policyType', label: 'Policy Type', required: false },
    { key: 'expiryDate', label: 'Policy Expiry Date', required: true },
  ],
  amc: [
    { key: 'serviceProvider', label: 'Service Provider', required: true },
    { key: 'productName', label: 'Product / Appliance', required: true },
    { key: 'expiryDate', label: 'AMC Expiry Date', required: true },
  ],
  subscription: [
    { key: 'serviceName', label: 'Service Name', required: true },
    { key: 'planType', label: 'Plan Type', required: false },
    { key: 'expiryDate', label: 'Renewal Date', required: true },
  ],
  medicine: [
    { key: 'medicineName', label: 'Medicine Name', required: true },
    { key: 'manufacturer', label: 'Manufacturer', required: false },
    { key: 'batchNumber', label: 'Batch Number', required: false },
    { key: 'expiryDate', label: 'Expiry Date', required: true },
  ],
  other: [
    {
      key: 'customField1',
      label: 'Field 1 (e.g. Company Name)',
      required: false,
      editableLabel: true,
    },
    {
      key: 'customField2',
      label: 'Field 2 (e.g. Product Name)',
      required: false,
      editableLabel: true,
    },
    {
      key: 'customField3',
      label: 'Field 3 (optional)',
      required: false,
      editableLabel: true,
    },
    { key: 'expiryDate', label: 'Expiry Date', required: true },
  ],
}

/**
 * Get fields for a category
 */
export function getCategoryFields(category: Category): CategoryField[] {
  return CATEGORY_FIELDS[category] || []
}

/**
 * Check if a field is required for a category
 */
export function isFieldRequired(category: Category, fieldKey: string): boolean {
  const fields = getCategoryFields(category)
  const field = fields.find((f) => f.key === fieldKey)
  return field?.required || false
}

