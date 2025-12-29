import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { correctHandwriting, createCorrectionError } from '@/lib/ai/correctHandwriting'
import type { HandwritingCorrectionError } from '@/lib/ai/correctHandwriting'

export const runtime = 'nodejs'

/**
 * API endpoint for handwriting error correction
 * POST /api/ai/correct-handwriting
 * 
 * Body: {
 *   rawText: string,
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
      return NextResponse.json<HandwritingCorrectionError>(
        createCorrectionError('Unauthorized', 'API_ERROR', 'User must be authenticated'),
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { rawText, provider = 'openai' } = body

    // Validate input
    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json<HandwritingCorrectionError>(
        createCorrectionError('Invalid input', 'API_ERROR', 'rawText is required and must be a string'),
        { status: 400 }
      )
    }

    if (rawText.trim().length === 0) {
      return NextResponse.json(
        {
          cleanedText: '',
          detectedDates: [],
          confidence: 0,
        },
        { status: 200 }
      )
    }

    // Run correction with timeout
    const timeout = 15000 // 15 seconds
    const correctionPromise = correctHandwriting(rawText, provider)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Correction timeout')), timeout)
    )

    const result = await Promise.race([correctionPromise, timeoutPromise])

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[Correct Handwriting API] Error:', error)

    if (error.message?.includes('timeout')) {
      return NextResponse.json<HandwritingCorrectionError>(
        createCorrectionError('Request timeout', 'TIMEOUT', 'Correction took too long'),
        { status: 408 }
      )
    }

    return NextResponse.json<HandwritingCorrectionError>(
      createCorrectionError(
        'Correction failed',
        'API_ERROR',
        error.message || 'Unknown error'
      ),
      { status: 500 }
    )
  }
}

