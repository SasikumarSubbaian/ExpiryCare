/**
 * Category → Dynamic Field Map
 * Defines which fields to extract and display per category
 */

export const CATEGORY_FIELDS: Record<string, string[]> = {
  'Driving License': [
    'documentName',
    'documentProvider',
    'licenseNumber',
    'holderName',
    'dateOfBirth',
    'dateOfIssue',
    'expiryDate',
    'bloodGroup',
  ],
  'Warranty': [
    'productName',
    'companyName',
    'purchaseDate',
    'expiryDate',
  ],
  'Insurance': [
    'policyNumber',
    'provider',
    'policyHolder',
    'expiryDate',
  ],
  'Medicine': [
    'medicineName',
    'companyName',
    'brandName',
    'expiryDate',
  ],
  'Subscription': [
    'serviceName',
    'planType',
    'expiryDate',
  ],
  'AMC': [
    'serviceType',
    'providerName',
    'expiryDate',
  ],
  'Other': [
    'documentName',
    'documentProvider',
    'expiryDate',
  ],
}

/**
 * Get fields for a category (case-insensitive)
 */
export function getFieldsForCategory(category: string): string[] {
  // Normalize category name
  const normalized = category
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  // Try exact match first
  if (CATEGORY_FIELDS[normalized]) {
    return CATEGORY_FIELDS[normalized]
  }
  
  // Try case-insensitive match
  const lowerCategory = category.toLowerCase()
  for (const [key, fields] of Object.entries(CATEGORY_FIELDS)) {
    if (key.toLowerCase() === lowerCategory) {
      return fields
    }
  }
  
  // Check for "driving license" variations
  if (lowerCategory.includes('driving') || lowerCategory.includes('license') || lowerCategory.includes('licence')) {
    return CATEGORY_FIELDS['Driving License']
  }
  
  // Default to Other
  return CATEGORY_FIELDS['Other']
}
