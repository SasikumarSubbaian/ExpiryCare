// AI Handwriting Error Correction Service
// Post-processes OCR text from handwritten images to correct common mistakes

import type { ExpiryDataInput } from './types'

export interface HandwritingCorrectionResult {
  cleanedText: string
  detectedDates: string[]
  confidence: number // 0-100
}

export interface HandwritingCorrectionError {
  error: string
  code: 'API_ERROR' | 'INVALID_JSON' | 'TIMEOUT' | 'UNKNOWN'
  details?: string
}

/**
 * System prompt for handwriting error correction
 * Focuses on correcting OCR mistakes without inventing text
 */
const SYSTEM_PROMPT = `You are a handwriting OCR error correction specialist. Your task is to correct common OCR mistakes in handwritten text WITHOUT inventing or adding any text that wasn't in the original.

CRITICAL RULES:
1. NEVER invent, add, or guess missing text
2. ONLY correct obvious OCR character mistakes
3. Preserve all original text structure and spacing
4. Return ONLY valid JSON, no explanations

COMMON OCR MISTAKES TO CORRECT:
- O ↔ 0 (letter O vs zero)
- I ↔ 1 (letter I vs one)
- S ↔ 5 (letter S vs five)
- B ↔ 8 (letter B vs eight)
- Z ↔ 2 (letter Z vs two)
- G ↔ 6 (letter G vs six)
- l ↔ 1 (lowercase L vs one)
- r ↔ 7 (lowercase r vs seven)

DATE NORMALIZATION:
- Detect and normalize dates to YYYY-MM-DD format
- Prefer future dates for expiry dates (if ambiguous)
- Handle Indian formats: DD/MM/YYYY, MM/YYYY, DD/MM/YY
- Convert month-only expiry (e.g., 08/26 → 2026-08-31)

EXAMPLES:

Input: "EXPIRY: 01/08/2O25"
Output: {
  "cleanedText": "EXPIRY: 01/08/2025",
  "detectedDates": ["2025-08-01"],
  "confidence": 95
}

Input: "BEST BEF0RE: 15/12/24"
Output: {
  "cleanedText": "BEST BEFORE: 15/12/24",
  "detectedDates": ["2024-12-15"],
  "confidence": 90
}

Input: "MANUFACTURE: 2O/05/2O23"
Output: {
  "cleanedText": "MANUFACTURE: 20/05/2023",
  "detectedDates": ["2023-05-20"],
  "confidence": 92
}

Input: "EXP: 08/26"
Output: {
  "cleanedText": "EXP: 08/26",
  "detectedDates": ["2026-08-31"],
  "confidence": 85
}

Input: "BATCH: A1B2C3"
Output: {
  "cleanedText": "BATCH: A1B2C3",
  "detectedDates": [],
  "confidence": 100
}

Input: "EXPIRY DATE: 3I/12/2O24"
Output: {
  "cleanedText": "EXPIRY DATE: 31/12/2024",
  "detectedDates": ["2024-12-31"],
  "confidence": 88
}

CONFIDENCE SCORING:
- 90-100: High confidence corrections
- 70-89: Medium confidence corrections
- 50-69: Low confidence corrections
- <50: Uncertain, minimal changes

OUTPUT FORMAT (JSON ONLY):
{
  "cleanedText": string,
  "detectedDates": string[],
  "confidence": number
}`

/**
 * Generate user prompt for error correction
 */
function generateUserPrompt(rawText: string): string {
  return `Correct OCR errors in this handwritten text. Only fix obvious character mistakes. Do not add or invent any text.

Raw OCR Text:
${rawText}

Return corrected text, detected dates, and confidence score.`
}

/**
 * Correct handwriting OCR errors using OpenAI
 */
async function correctWithOpenAI(
  rawText: string
): Promise<HandwritingCorrectionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: generateUserPrompt(rawText),
        },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)
    return validateAndNormalizeResult(parsed, rawText)
  } catch (parseError: any) {
    throw new Error(`Invalid JSON from OpenAI: ${parseError.message}`)
  }
}

/**
 * Correct handwriting OCR errors using Gemini
 */
async function correctWithGemini(
  rawText: string
): Promise<HandwritingCorrectionResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\n${generateUserPrompt(rawText)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          response_mime_type: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.candidates?.[0]?.content?.parts?.[0]

  if (!content) {
    throw new Error('No response from Gemini')
  }

  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    return validateAndNormalizeResult(parsed, rawText)
  } catch (parseError: any) {
    throw new Error(`Invalid JSON from Gemini: ${parseError.message}`)
  }
}

/**
 * Validate and normalize correction result
 */
function validateAndNormalizeResult(
  parsed: any,
  originalText: string
): HandwritingCorrectionResult {
  // Validate structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid result structure')
  }

  // Validate cleanedText
  if (typeof parsed.cleanedText !== 'string') {
    throw new Error('cleanedText must be a string')
  }

  // Ensure cleanedText doesn't add text (length check)
  const originalLength = originalText.trim().length
  const cleanedLength = parsed.cleanedText.trim().length

  // Allow slight length difference (corrections), but warn if too different
  if (cleanedLength > originalLength * 1.2) {
    console.warn(
      `[Handwriting Correction] Cleaned text is significantly longer than original. Using original.`
    )
    return {
      cleanedText: originalText,
      detectedDates: parsed.detectedDates || [],
      confidence: Math.max(0, Math.min(100, parsed.confidence || 50)),
    }
  }

  // Validate detectedDates
  const detectedDates = Array.isArray(parsed.detectedDates)
    ? parsed.detectedDates.filter((d: any) => typeof d === 'string')
    : []

  // Validate confidence
  const confidence = Math.max(0, Math.min(100, parsed.confidence || 50))

  return {
    cleanedText: parsed.cleanedText.trim(),
    detectedDates,
    confidence,
  }
}

/**
 * Correct handwriting OCR errors
 * Uses OpenAI or Gemini API with temperature 0
 */
export async function correctHandwriting(
  rawText: string,
  provider: 'openai' | 'gemini' = 'openai'
): Promise<HandwritingCorrectionResult> {
  if (!rawText || rawText.trim().length === 0) {
    return {
      cleanedText: rawText,
      detectedDates: [],
      confidence: 0,
    }
  }

  try {
    console.log(`[Handwriting Correction] Correcting text (${rawText.length} chars) using ${provider}...`)

    let result: HandwritingCorrectionResult

    if (provider === 'openai') {
      result = await correctWithOpenAI(rawText)
    } else {
      result = await correctWithGemini(rawText)
    }

    console.log(
      `[Handwriting Correction] Completed - Confidence: ${result.confidence}%, Dates: ${result.detectedDates.length}`
    )

    return result
  } catch (error: any) {
    console.error('[Handwriting Correction] Error:', error)

    // Fallback: Return original text with low confidence
    return {
      cleanedText: rawText,
      detectedDates: [],
      confidence: 0,
    }
  }
}

/**
 * Create error object for handwriting correction
 */
export function createCorrectionError(
  error: string,
  code: HandwritingCorrectionError['code'] = 'UNKNOWN',
  details?: string
): HandwritingCorrectionError {
  return {
    error,
    code,
    details,
  }
}

