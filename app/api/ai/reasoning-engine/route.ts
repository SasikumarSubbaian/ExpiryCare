// AI Reasoning Engine API Route - Browser OCR Version
// Accepts rawText only (OCR runs in browser)
// Extracts structured data from OCR text with confidence scores

import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Lazy initialization - only create client when needed (at runtime, not build time)
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const rawText = body?.rawText
    const fileMeta = body?.fileMeta || {}

    // Validate input - must have at least 10 characters
    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json(
        { error: 'Empty or invalid OCR text' },
        { status: 400 }
      )
    }

    // Call OpenAI with structured prompt
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for ExpiryCare. Extract structured data from OCR text.

Return ONLY valid JSON in this format:
{
  "title": string | null,
  "companyName": string | null,
  "expiryDate": string | null (ISO format YYYY-MM-DD),
  "expirySourceLabel": string | null (e.g., "Valid Until", "Warranty Period", "Expires On", "Best Before"),
  "confidenceScore": number (0-1, where 1.0 = 100% confident)
}

Rules:
- Extract title/product name if clearly present
- Extract company name if present
- Extract expiry date and convert to ISO format (YYYY-MM-DD)
- Extract expiry source label (the keyword/phrase that indicates expiry: "Valid Until", "Warranty Period", etc.)
- confidenceScore: 0.0-1.0 scale (0.0 = not confident, 1.0 = very confident)
- Never invent data - only extract what is present
- If unsure, set value as null and confidenceScore to 0
- Handle Indian date formats: DD/MM/YYYY, DD-MM-YYYY, MM/YYYY
- "Valid up to Date" = expiryDate with expirySourceLabel = "Valid Until"`,
        },
        {
          role: 'user',
          content: `Extract structured data from this OCR text:\n\n${rawText}`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content

    if (!content) {
      throw new Error('Empty AI response')
    }

    // Safe JSON parsing
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (parseError) {
      console.error('[Reasoning Engine] JSON parse error:', parseError)
      // Return safe fallback
      return NextResponse.json(
        {
          title: null,
          companyName: null,
          expiryDate: null,
          expirySourceLabel: null,
          confidenceScore: 0,
          validation: {
            requiresUserConfirmation: true,
            weakFields: ['expiryDate'],
          },
        },
        { status: 200 }
      )
    }

    // Validate and normalize response
    const result = {
      title: parsed.title || null,
      companyName: parsed.companyName || null,
      expiryDate: parsed.expiryDate || null,
      expirySourceLabel: parsed.expirySourceLabel || null,
      confidenceScore: typeof parsed.confidenceScore === 'number' 
        ? Math.max(0, Math.min(1, parsed.confidenceScore)) 
        : 0,
    }

    // Add validation
    const requiresUserConfirmation = 
      (result.expiryDate && result.confidenceScore < 0.7) ||
      !result.expiryDate

    const weakFields: string[] = []
    if (result.expiryDate && result.confidenceScore < 0.7) {
      weakFields.push('expiryDate')
    }
    if (result.companyName && result.confidenceScore < 0.6) {
      weakFields.push('companyName')
    }

    return NextResponse.json({
      ...result,
      validation: {
        requiresUserConfirmation,
        weakFields,
      },
    })
  } catch (error: any) {
    console.error('[AI Reasoning Engine] Error:', error)

    // Return safe error response - never throw
    return NextResponse.json(
      {
        error: error.message || 'AI processing failed',
        title: null,
        companyName: null,
        expiryDate: null,
        expirySourceLabel: null,
        confidenceScore: 0,
        validation: {
          requiresUserConfirmation: true,
          weakFields: ['expiryDate'],
        },
      },
      { status: 500 }
    )
  }
}
