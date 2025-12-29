import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseExpiryData, createParseError } from '@/lib/ai/parseExpiryData'
import type { ExpiryDataInput, ExpiryDataOutput, ParseError } from '@/lib/ai/types'

export const runtime = 'nodejs'

/**
 * AI Parsing API Route
 * 
 * Converts OCR raw text into structured expiry data
 * Uses OpenAI or Gemini AI for intelligent parsing
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<ParseError>(
        {
          error: 'Unauthorized',
          code: 'AUTH_ERROR',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { rawText, category }: ExpiryDataInput = body

    // Validate input
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json<ParseError>(
        {
          error: 'rawText is required and must be a string',
          code: 'INVALID_RESPONSE',
        },
        { status: 400 }
      )
    }

    if (rawText.trim().length === 0) {
      return NextResponse.json<ExpiryDataOutput>(
        {
          productName: null,
          expiryDate: null,
          manufacturingDate: null,
          batchNumber: null,
          confidenceScore: 0,
          detectedLabels: [],
        },
        { status: 200 }
      )
    }

    // Validate category if provided
    const validCategories = [
      'medicine',
      'food',
      'warranty',
      'insurance',
      'subscription',
    ]
    const validatedCategory =
      category && validCategories.includes(category)
        ? category
        : undefined

    console.log(
      `[AI Parse] Processing text (${rawText.length} chars), category: ${validatedCategory || 'none'}`
    )

    // Parse expiry data using AI
    try {
      const result = await parseExpiryData({
        rawText: rawText.trim(),
        category: validatedCategory,
      })

      console.log(`[AI Parse] Success - Confidence: ${result.confidenceScore}%`)
      console.log(`[AI Parse] Extracted:`, {
        productName: result.productName ? 'Yes' : 'No',
        expiryDate: result.expiryDate || 'No',
        manufacturingDate: result.manufacturingDate || 'No',
        batchNumber: result.batchNumber || 'No',
        labels: result.detectedLabels,
      })

      return NextResponse.json<ExpiryDataOutput>(result, { status: 200 })
    } catch (parseError: any) {
      console.error('[AI Parse] Error:', parseError)

      const error = createParseError(parseError)

      // Determine error code based on error message
      if (parseError.message?.includes('authentication')) {
        error.code = 'AUTH_ERROR'
      } else if (parseError.message?.includes('rate limit')) {
        error.code = 'RATE_LIMIT'
      } else if (parseError.message?.includes('JSON parse')) {
        error.code = 'JSON_PARSE_ERROR'
      }

      return NextResponse.json<ParseError>(error, { status: 500 })
    }
  } catch (error: any) {
    console.error('[AI Parse] Unexpected error:', error)
    return NextResponse.json<ParseError>(
      {
        error: 'Internal server error',
        code: 'API_ERROR',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

