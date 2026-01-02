/**
 * Category Re-evaluator
 * Re-evaluates category based on extractedData keys when OCR returns "other"
 */

export function reevaluateCategoryFromExtractedData(extractedData: any): string {
  if (!extractedData || typeof extractedData !== 'object') {
    return 'other'
  }

  // Check for license signals
  const hasLicenseNumber = extractedData.licenseNumber?.value || extractedData.dlNumber?.value
  const hasDateOfBirth = extractedData.dateOfBirth?.value || extractedData.dob?.value
  const hasDateOfIssue = extractedData.dateOfIssue?.value || extractedData.issueDate?.value
  
  if (hasLicenseNumber || (hasDateOfBirth && hasDateOfIssue)) {
    return 'other' // License is categorized as "other" but with license fields
  }

  // Check for medicine signals
  const hasExpiryDate = extractedData.expiryDate?.value
  const hasProductName = extractedData.productName?.value || extractedData.medicineName?.value
  const hasBatchNumber = extractedData.batchNumber?.value
  
  if (hasExpiryDate && hasProductName) {
    // Check if it's medicine (has batch number or medicine-specific fields)
    if (hasBatchNumber || extractedData.medicineName?.value) {
      return 'medicine'
    }
    // Could be warranty if has purchase date
    if (extractedData.purchaseDate?.value) {
      return 'warranty'
    }
    // Default to medicine if has product name and expiry
    return 'medicine'
  }

  // Check for warranty signals
  const hasPurchaseDate = extractedData.purchaseDate?.value
  
  if (hasExpiryDate && hasPurchaseDate) {
    return 'warranty'
  }

  // Default to other
  return 'other'
}
