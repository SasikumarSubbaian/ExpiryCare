/**
 * Category → Dynamic Field Map
 * Defines which fields to extract and display per category
 */

// Category field mapping - supports both lowercase and capitalized names
export const CATEGORY_FIELDS: Record<string, string[]> = {
  // Lowercase keys (from API)
  'other': [
    'documentName',
    'documentProvider',
    'licenseNumber',
    'holderName',
    'dateOfBirth',
    'dateOfIssue',
    'expiryDate',
    'bloodGroup',
  ],
  'warranty': [
    'productName',
    'companyName',
    'purchaseDate',
    'expiryDate',
  ],
  'insurance': [
    'policyNumber',
    'provider',
    'policyHolder',
    'expiryDate',
  ],
  'medicine': [
    'medicineName',
    'companyName',
    'brandName',
    'expiryDate',
    'batchNumber',
  ],
  'subscription': [
    'serviceName',
    'planType',
    'expiryDate',
  ],
  'amc': [
    'serviceType',
    'providerName',
    'expiryDate',
  ],
  // Capitalized keys (for display)
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
    'batchNumber',
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
 * Handles both lowercase API categories and display names
 */
export function getFieldsForCategory(category: string): string[] {
  if (!category) {
    return CATEGORY_FIELDS['other'] || []
  }
  
  const lowerCategory = category.toLowerCase()
  
  // Try exact match first (lowercase)
  if (CATEGORY_FIELDS[lowerCategory]) {
    return CATEGORY_FIELDS[lowerCategory]
  }
  
  // Try exact match (capitalized)
  const normalized = category
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  if (CATEGORY_FIELDS[normalized]) {
    return CATEGORY_FIELDS[normalized]
  }
  
  // Check for "driving license" variations in "other" category
  if (lowerCategory === 'other' && 
      (category.includes('driving') || category.includes('license') || category.includes('licence'))) {
    // Return driving license fields for "other" category when license detected
    return CATEGORY_FIELDS['other'] // Use "other" fields which include license fields
  }
  
  // Try case-insensitive match
  for (const [key, fields] of Object.entries(CATEGORY_FIELDS)) {
    if (key.toLowerCase() === lowerCategory) {
      return fields
    }
  }
  
  // Default to other
  return CATEGORY_FIELDS['other'] || ['expiryDate', 'documentName']
}
