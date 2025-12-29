// Category-Aware Field Schemas
// Single source of truth for fields allowed per category
// Privacy-first: Never extract confidential data

export type CategoryKey =
  | 'warranty'
  | 'insurance'
  | 'amc'
  | 'subscription'
  | 'medicine'
  | 'other'

export interface CategorySchema {
  requiredFields: string[]
  optionalFields: string[]
  forbiddenPatterns: RegExp[]
  displayName: string
  description: string
}

export const CATEGORY_SCHEMAS: Record<CategoryKey, CategorySchema> = {
  warranty: {
    requiredFields: ['expiryDate', 'productName', 'brand'],
    optionalFields: ['warrantyPeriod', 'serialNumber'],
    forbiddenPatterns: [
      /aadhaar/i,
      /dob/i,
      /date\s+of\s+birth/i,
      /father/i,
      /mother/i,
      /pan\s+card/i,
      /address/i,
    ],
    displayName: 'Warranty',
    description: 'Product warranty documents',
  },

  insurance: {
    requiredFields: ['expiryDate', 'policyType', 'provider'],
    optionalFields: ['policyNumber'],
    forbiddenPatterns: [
      /aadhaar/i,
      /pan\s+card/i,
      /pan\s+no/i,
      /address/i,
      /dob/i,
      /date\s+of\s+birth/i,
      /father/i,
      /mother/i,
      /nominee/i,
    ],
    displayName: 'Insurance',
    description: 'Insurance policy documents',
  },

  amc: {
    requiredFields: ['expiryDate', 'serviceProvider', 'productName'],
    optionalFields: ['contractNumber', 'serviceType'],
    forbiddenPatterns: [
      /phone/i,
      /mobile/i,
      /email/i,
      /address/i,
      /aadhaar/i,
      /pan/i,
    ],
    displayName: 'AMC',
    description: 'Annual Maintenance Contract',
  },

  subscription: {
    requiredFields: ['expiryDate', 'serviceName'],
    optionalFields: ['plan', 'subscriptionId'],
    forbiddenPatterns: [
      /card\s+number/i,
      /card\s+no/i,
      /upi/i,
      /account\s+number/i,
      /bank/i,
      /cvv/i,
    ],
    displayName: 'Subscription',
    description: 'Service subscriptions',
  },

  medicine: {
    requiredFields: ['expiryDate', 'medicineName'],
    optionalFields: ['batchNo', 'manufacturer'],
    forbiddenPatterns: [
      /patient/i,
      /doctor/i,
      /prescription/i,
      /diagnosis/i,
      /disease/i,
    ],
    displayName: 'Medicine',
    description: 'Medicine expiry tracking',
  },

  other: {
    requiredFields: ['expiryDate'],
    optionalFields: ['documentType'],
    forbiddenPatterns: [
      /aadhaar/i,
      /pan\s+card/i,
      /pan\s+no/i,
      /dob/i,
      /date\s+of\s+birth/i,
      /father/i,
      /mother/i,
      /wife/i,
      /husband/i,
      /address/i,
      /permanent\s+address/i,
      /current\s+address/i,
      /voter\s+id/i,
      /passport/i,
      /ration\s+card/i,
      // Note: Driving license name/DOB are blocked, but document type is allowed
      /name/i, // Block name extraction for privacy
      /son\s+of/i,
      /daughter\s+of/i,
    ],
    displayName: 'Other',
    description: 'Other documents (expiry date only)',
  },
}

// Field display labels
export const FIELD_LABELS: Record<string, string> = {
  expiryDate: 'Expiry Date',
  productName: 'Product Name',
  brand: 'Brand',
  warrantyPeriod: 'Warranty Period',
  serialNumber: 'Serial Number',
  policyType: 'Policy Type',
  provider: 'Provider',
  policyNumber: 'Policy Number',
  serviceProvider: 'Service Provider',
  contractNumber: 'Contract Number',
  serviceType: 'Service Type',
  serviceName: 'Service Name',
  plan: 'Plan',
  subscriptionId: 'Subscription ID',
  medicineName: 'Medicine Name',
  batchNo: 'Batch Number',
  manufacturer: 'Manufacturer',
  documentType: 'Document Type',
}

// Get schema for a category
export function getCategorySchema(category: CategoryKey): CategorySchema {
  return CATEGORY_SCHEMAS[category] || CATEGORY_SCHEMAS.other
}

// Check if a field is allowed for a category
export function isFieldAllowed(
  field: string,
  category: CategoryKey
): boolean {
  const schema = getCategorySchema(category)
  return (
    schema.requiredFields.includes(field) ||
    schema.optionalFields.includes(field)
  )
}

// Check if text contains forbidden patterns
export function containsForbiddenData(
  text: string,
  category: CategoryKey
): boolean {
  const schema = getCategorySchema(category)
  return schema.forbiddenPatterns.some((pattern) => pattern.test(text))
}

// Sanitize extracted data by removing forbidden patterns
export function sanitizeExtractedData(
  data: Record<string, string | null>,
  category: CategoryKey
): Record<string, string | null> {
  const schema = getCategorySchema(category)
  const sanitized: Record<string, string | null> = {}

  for (const [key, value] of Object.entries(data)) {
    // Only include allowed fields
    if (!isFieldAllowed(key, category)) {
      continue
    }

    // Check if value contains forbidden patterns
    if (value && containsForbiddenData(value, category)) {
      // Remove forbidden data
      continue
    }

    sanitized[key] = value
  }

  return sanitized
}

