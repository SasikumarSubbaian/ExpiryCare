// Example usage of AI parsing service
// This file is for reference only - not imported in production

import { parseExpiryData } from './parseExpiryData'

/**
 * Example 1: Medicine label
 */
async function exampleMedicine() {
  const result = await parseExpiryData({
    rawText: 'Paracetamol 500mg EXP: 31/12/2024 BATCH: ABC123',
    category: 'medicine',
  })

  console.log('Medicine Example:', result)
  // Expected:
  // {
  //   productName: "Paracetamol 500mg",
  //   expiryDate: "2024-12-31",
  //   manufacturingDate: null,
  //   batchNumber: "ABC123",
  //   confidenceScore: 95,
  //   detectedLabels: ["EXP", "BATCH"]
  // }
}

/**
 * Example 2: Food product
 */
async function exampleFood() {
  const result = await parseExpiryData({
    rawText: 'Best Before: 20/03/2024 MFG: 20/03/2023',
    category: 'food',
  })

  console.log('Food Example:', result)
  // Expected:
  // {
  //   productName: null,
  //   expiryDate: "2024-03-20",
  //   manufacturingDate: "2023-03-20",
  //   batchNumber: null,
  //   confidenceScore: 95,
  //   detectedLabels: ["BEST BEFORE", "MFG"]
  // }
}

/**
 * Example 3: Warranty card
 */
async function exampleWarranty() {
  const result = await parseExpiryData({
    rawText: 'Warranty Card Valid until 15-06-2025',
    category: 'warranty',
  })

  console.log('Warranty Example:', result)
  // Expected:
  // {
  //   productName: null,
  //   expiryDate: "2025-06-15",
  //   manufacturingDate: null,
  //   batchNumber: null,
  //   confidenceScore: 90,
  //   detectedLabels: ["VALID UNTIL"]
  // }
}

/**
 * Example 4: Ambiguous text (should return nulls)
 */
async function exampleAmbiguous() {
  const result = await parseExpiryData({
    rawText: 'Some random text without clear expiry information',
    category: null,
  })

  console.log('Ambiguous Example:', result)
  // Expected:
  // {
  //   productName: null,
  //   expiryDate: null,
  //   manufacturingDate: null,
  //   batchNumber: null,
  //   confidenceScore: 0,
  //   detectedLabels: []
  // }
}

