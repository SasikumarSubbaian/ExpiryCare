import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  extractHandwritingExpiry,
  createExpiryError,
} from '@/lib/ai/extractHandwritingExpiry'
import type { HandwritingExpiryError } from '@/lib/ai/extractHandwritingExpiry'

export const runtime = 'nodejs'

/**
 * API endpoint for handwriting expiry extraction
 * POST /api/ai/extract-handwriting-expiry
 * 
 * Body: {
 *   cleanedText: string,
 *   provider?: 'openai' | 'gemini'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<HandwritingExpiryError>(
        createExpiryError('Unauthorized', 'API_ERROR', 'User must be authenticated'),
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { cleanedText, provider = 'openai' } = body

    // Validate input
    if (!cleanedText || typeof cleanedText !== 'string') {
      return NextResponse.json<HandwritingExpiryError>(
        createExpiryError(
          'Invalid input',
          'API_ERROR',
          'cleanedText is required and must be a string'
        ),
        { status: 400 }
      )
    }

    if (cleanedText.trim().length === 0) {
      return NextResponse.json(
        {
          expiryDate: null,
          reasoningConfidence: 0,
          reasoning: 'Empty text provided',
          detectedDates: [],
        },
        { status: 200 }
      )
    }

    // Run extraction with timeout
    const timeout = 15000 // 15 seconds
    const extractionPromise = extractHandwritingExpiry(cleanedText, provider)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Extraction timeout')), timeout)
    )

    const result = await Promise.race([extractionPromise, timeoutPromise])

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[Extract Handwriting Expiry API] Error:', error)

    if (error.message?.includes('timeout')) {
      return NextResponse.json<HandwritingExpiryError>(
        createExpiryError('Request timeout', 'TIMEOUT', 'Extraction took too long'),
        { status: 408 }
      )
    }

    return NextResponse.json<HandwritingExpiryError>(
      createExpiryError(
        'Extraction failed',
        'API_ERROR',
        error.message || 'Unknown error'
      ),
      { status: 500 }
    )
  }
}

