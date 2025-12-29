// Category-Aware Extraction Engine
// Privacy-first: Category prediction → Schema-based extraction
// Production-ready, no AI inference, no hallucination

import { NextResponse } from 'next/server'
import { predictCategoryWithConfidence } from '@/lib/categoryPredictor'
import { extractBySchema, type SchemaExtractedData } from '@/lib/extractBySchema'
import { getCategorySchema } from '@/lib/categorySchemas'
import { extractByCategory, type Category } from '@/lib/extractors/masterExtractor'
import { regexExtract } from '@/lib/ocr/regexExtractor'

export async function POST(req: Request) {
  let ocrText: string = ''
  try {
    const body = await req.json()
    ocrText = body.ocrText || ''

    // Validate input
    if (!ocrText || typeof ocrText !== 'string' || ocrText.trim().length < 20) {
      return NextResponse.json(
        {
          source: 'schema',
          extracted: null,
          needsManualEntry: true,
          error: 'OCR text too short or invalid',
        },
        { status: 200 }
      )
    }

    // Step 1: Predict category (rule-based, fast, predictable)
    const { category: predictedCategory, confidence: categoryConfidence } = predictCategoryWithConfidence(ocrText)
    // Security: Only log category, not full OCR text
    console.log('[Category-Aware] Predicted category:', predictedCategory, 'Confidence:', categoryConfidence)

    // Step 2: Map category key to Category type (capitalize first letter)
    const categoryMap: Record<string, Category> = {
      warranty: 'Warranty',
      insurance: 'Insurance',
      amc: 'AMC',
      subscription: 'Subscription',
      medicine: 'Medicine',
      other: 'Other',
    }
    const category = categoryMap[predictedCategory] || 'Other'

    // Step 3: Extract fields using master extractor (new production-ready system)
    const masterResult = extractByCategory(ocrText, category)
    
    // Step 4: Convert to legacy format for backward compatibility
    // Map master extractor results to SchemaExtractedData format
    const extracted: SchemaExtractedData = {
      category: predictedCategory, // Use lowercase category key for compatibility
      expiryDate: masterResult.expiryDate.value,
      originalText: masterResult.expiryDate.sourceKeyword || null,
      productName: masterResult.productName || null,
      brand: null,
      warrantyPeriod: null,
      serialNumber: null,
      policyType: masterResult.additionalFields?.policyType || null,
      provider: masterResult.additionalFields?.insurerName || masterResult.companyName || null,
      policyNumber: null,
      serviceProvider: masterResult.additionalFields?.providerName || null,
      contractNumber: null,
      serviceType: masterResult.additionalFields?.serviceType || null,
      serviceName: masterResult.additionalFields?.serviceName || null,
      plan: masterResult.additionalFields?.planType || null,
      subscriptionId: null,
      medicineName: masterResult.additionalFields?.medicineName || null,
      batchNo: null,
      manufacturer: masterResult.additionalFields?.brandName || null,
      documentType: masterResult.additionalFields?.documentType || null,
      confidence: masterResult.expiryDate.confidence === 'High' ? 90 : 
                  masterResult.expiryDate.confidence === 'Medium' ? 70 : 40,
    }
    
    // For warranty category, map companyName to brand
    if (predictedCategory === 'warranty' && masterResult.companyName) {
      extracted.brand = masterResult.companyName
    }
    
    // For medicine category, map additional fields
    if (predictedCategory === 'medicine' && masterResult.additionalFields?.medicineName) {
      extracted.productName = masterResult.additionalFields.medicineName
    }
    
    // For subscription category, map serviceName
    if (predictedCategory === 'subscription' && masterResult.additionalFields?.serviceName) {
      extracted.productName = masterResult.additionalFields.serviceName
    }
    
    // For other category, documentType is already mapped from additionalFields
    
    // Security: Only log extracted fields, not raw OCR text
    console.log('[Category-Aware] Extracted fields:', {
      category: extracted.category,
      expiryDate: extracted.expiryDate,
      confidence: extracted.confidence,
    })

    // Step 5: Get schema to determine required fields
    const schema = getCategorySchema(predictedCategory)
    const requiredFields = schema.requiredFields
    const filledRequiredFields = requiredFields.filter(
      (field) => extracted[field as keyof SchemaExtractedData] && 
      String(extracted[field as keyof SchemaExtractedData]).trim().length > 0
    )

    // Determine if manual entry is needed
    const needsManualEntry = filledRequiredFields.length < requiredFields.length || !extracted.expiryDate

    return NextResponse.json({
      source: 'schema',
      category: predictedCategory, // Return lowercase category key for compatibility
      categoryConfidence,
      extracted,
      needsManualEntry,
      schema: {
        requiredFields,
        optionalFields: schema.optionalFields,
      },
    })
  } catch (error: any) {
    console.error('[Hybrid] Fatal Error:', error)

    // Last resort: try regex extraction
    try {
      const regexResult = regexExtract(ocrText)
      return NextResponse.json({
        source: 'regex',
        extracted: regexResult,
        needsManualEntry: true,
        fallback: 'error',
      })
    } catch (regexError) {
      return NextResponse.json(
        {
          source: 'error',
          extracted: null,
          needsManualEntry: true,
          error: error.message || 'Hybrid reasoning failed',
        },
        { status: 200 }
      )
    }
  }
}

