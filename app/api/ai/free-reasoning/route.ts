// Free AI Reasoning Engine using Hugging Face Inference API
// No OpenAI, no paid APIs - 100% free for MVP
// Uses standard inference API endpoint (works with Read token)
// Falls back to regex extraction if AI fails

import { NextResponse } from 'next/server'
import { regexExtract } from '@/lib/ocr'

export async function POST(req: Request) {
  let ocrText = ''
  try {
    const body = await req.json()
    ocrText = body.ocrText || ''

    // Validate input
    if (!ocrText || typeof ocrText !== 'string' || ocrText.trim().length < 20) {
      return NextResponse.json(
        {
          error: 'OCR text too short or invalid',
          extracted: null,
          needsManualEntry: true,
        },
        { status: 200 } // Return 200 to allow manual entry
      )
    }

    // Check for Hugging Face API key
    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      console.warn('[Free AI] Hugging Face API key not configured')
      return NextResponse.json(
        {
          extracted: null,
          needsManualEntry: true,
          error: 'AI service not configured',
        },
        { status: 200 } // Return 200 to allow manual entry
      )
    }

    // Construct prompt for structured extraction
    const prompt = `Extract structured data from OCR text.

Rules:
- "expiry", "exp", "valid upto", "warranty till", "valid until" = expiryDate
- Convert dates to YYYY-MM-DD format (e.g., DD/MM/YYYY -> YYYY-MM-DD)
- If unsure, return null
- confidence from 0-100

Return ONLY JSON, no markdown, no code blocks.

Schema:
{
  "expiryDate": string | null,
  "companyName": string | null,
  "productName": string | null,
  "category": "Warranty" | "Medicine" | "Insurance" | "Other",
  "confidence": number
}

OCR TEXT:
"""
${ocrText.substring(0, 2000)}
"""
`

    // Call Hugging Face Inference API (using standard endpoint)
    // Note: router.huggingface.co requires special permissions, using inference API directly
    const response = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-base',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 256,
            return_full_text: false,
          },
        }),
      }
    )

    // Handle Hugging Face response
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Free AI] Hugging Face API error:', response.status, errorText)
      
      // Handle 410 - deprecated endpoint
      if (response.status === 410) {
        console.error('[Free AI] Endpoint deprecated - this model may not be available on free tier')
        return NextResponse.json(
          {
            extracted: null,
            needsManualEntry: true,
            error: 'This model is not available on the free Inference API. Please use manual entry or try a different model.',
          },
          { status: 200 }
        )
      }
      
      // Handle 403 - permission error
      if (response.status === 403) {
        console.error('[Free AI] Permission denied - check API key has Read permission')
        return NextResponse.json(
          {
            extracted: null,
            needsManualEntry: true,
            error: 'API key does not have inference permissions. Please check your Hugging Face token has "Read" permission.',
          },
          { status: 200 }
        )
      }
      
      // If model is loading, return manual entry
      if (response.status === 503) {
        return NextResponse.json(
          {
            extracted: null,
            needsManualEntry: true,
            error: 'AI model is loading, please try again in a moment',
          },
          { status: 200 }
        )
      }

      // For other errors, fallback to regex extraction
      console.log('[Free AI] AI unavailable, falling back to regex extraction')
      try {
        const regexData = regexExtract(ocrText)
        return NextResponse.json({
          extracted: regexData,
          needsManualEntry: regexData.confidence < 60 || !regexData.expiryDate,
          fallback: 'regex',
        })
      } catch (regexError) {
        return NextResponse.json(
          {
            extracted: null,
            needsManualEntry: true,
            error: 'AI service temporarily unavailable',
          },
          { status: 200 }
        )
      }
    }

    const result = await response.json()

    // Extract generated text from response
    let outputText = ''
    if (Array.isArray(result) && result[0]?.generated_text) {
      outputText = result[0].generated_text
    } else if (result.generated_text) {
      outputText = result.generated_text
    } else if (typeof result === 'string') {
      outputText = result
    }

    if (!outputText || outputText.trim().length === 0) {
      console.warn('[Free AI] Empty response from Hugging Face, falling back to regex')
      try {
        const regexData = regexExtract(ocrText)
        return NextResponse.json({
          extracted: regexData,
          needsManualEntry: regexData.confidence < 60 || !regexData.expiryDate,
          fallback: 'regex',
        })
      } catch (regexError) {
        return NextResponse.json(
          {
            extracted: null,
            needsManualEntry: true,
          },
          { status: 200 }
        )
      }
    }

    // Try to extract JSON from response
    let extracted: any = null
    try {
      // Try to find JSON object in the response
      const jsonMatch = outputText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[0])
      } else {
        // If no JSON found, try parsing the whole response
        extracted = JSON.parse(outputText)
      }
    } catch (parseError) {
      console.warn('[Free AI] Failed to parse JSON from response, falling back to regex:', outputText)
      try {
        const regexData = regexExtract(ocrText)
        return NextResponse.json({
          extracted: regexData,
          needsManualEntry: regexData.confidence < 60 || !regexData.expiryDate,
          fallback: 'regex',
        })
      } catch (regexError) {
        return NextResponse.json(
          {
            extracted: null,
            needsManualEntry: true,
            error: 'Failed to parse AI response',
          },
          { status: 200 }
        )
      }
    }

    // Validate and normalize extracted data
    const normalized = {
      expiryDate: extracted.expiryDate || null,
      companyName: extracted.companyName || null,
      productName: extracted.productName || null,
      category: ['Warranty', 'Medicine', 'Insurance', 'Other'].includes(extracted.category)
        ? extracted.category
        : 'Other',
      confidence: typeof extracted.confidence === 'number'
        ? Math.max(0, Math.min(100, extracted.confidence))
        : 50, // Default to medium confidence if not provided
    }

    // Normalize expiry date format if present
    if (normalized.expiryDate) {
      try {
        // Try to convert common date formats to ISO
        const dateStr = normalized.expiryDate.trim()
        // Handle DD/MM/YYYY or DD-MM-YYYY
        const ddmmyyyy = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy
          normalized.expiryDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
        // Handle MM/YYYY or MM-YYYY
        const mmyyyy = dateStr.match(/(\d{1,2})[\/\-](\d{4})/)
        if (mmyyyy && !ddmmyyyy) {
          const [, month, year] = mmyyyy
          normalized.expiryDate = `${year}-${month.padStart(2, '0')}-01`
        }
      } catch (dateError) {
        // If date parsing fails, keep original value
        console.warn('[Free AI] Date normalization failed:', normalized.expiryDate)
      }
    }

    // Determine if manual entry is needed
    const needsManualEntry = normalized.confidence < 60 || !normalized.expiryDate

    return NextResponse.json({
      extracted: normalized,
      needsManualEntry,
    })
  } catch (error: any) {
    console.error('[Free AI] Fatal Error:', error)
    
    // Fallback to regex extraction if AI completely fails
    try {
      console.log('[Free AI] Falling back to regex extraction')
      const regexData = regexExtract(ocrText)
      
      return NextResponse.json({
        extracted: regexData,
        needsManualEntry: regexData.confidence < 60 || !regexData.expiryDate,
        fallback: 'regex', // Indicate this is regex fallback
      })
    } catch (regexError) {
      console.error('[Free AI] Regex fallback also failed:', regexError)
      
      // Always return 200 to allow manual entry
      return NextResponse.json(
        {
          extracted: null,
          needsManualEntry: true,
          error: error.message || 'Free AI reasoning failed',
        },
        { status: 200 }
      )
    }
  }
}
