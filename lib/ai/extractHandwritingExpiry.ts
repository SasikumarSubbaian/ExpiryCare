// Specialized Expiry Extraction for Handwritten Content
// Handles missing keywords, context-based reasoning, and various date formats

export interface HandwritingExpiryResult {
  expiryDate: string | null // ISO format YYYY-MM-DD
  reasoningConfidence: number // 0-100
  reasoning?: string // Explanation of extraction logic
  detectedDates?: Array<{
    date: string
    format: string
    likelyType: 'expiry' | 'manufacture' | 'unknown'
    confidence: number
  }>
}

export interface HandwritingExpiryError {
  error: string
  code: 'API_ERROR' | 'INVALID_JSON' | 'TIMEOUT' | 'UNKNOWN'
  details?: string
}

/**
 * System prompt for handwriting expiry extraction
 * Focuses on context-based reasoning when keywords are missing
 */
const SYSTEM_PROMPT = `You are a specialized expiry date extractor for handwritten documents. Your task is to identify expiry dates even when keywords are missing or unclear.

CRITICAL RULES:
1. Keywords may be MISSING - don't rely on "EXP", "BEST BEFORE", etc.
2. Dates may appear ALONE without labels
3. Use CONTEXT to determine date type:
   - Single future date → Likely expiry
   - Past date → Likely manufacture date
   - Multiple dates → Future date is expiry
4. NEVER invent dates - only extract what's present
5. Return ONLY valid JSON, no explanations

DATE FORMATS TO HANDLE:
- DD/MM/YY (e.g., 15/12/24 → 2024-12-15)
- MM/YY (e.g., 08/26 → 2026-08-31)
- DD/MM/YYYY (e.g., 31/12/2024 → 2024-12-31)
- Month name (e.g., "Aug 26" → 2026-08-26, "Aug 2026" → 2026-08-31)
- YYYY-MM-DD (already ISO format)

CONTEXT REASONING:
- If only ONE date found and it's in the FUTURE → High confidence expiry
- If only ONE date found and it's in the PAST → Likely manufacture, low expiry confidence
- If MULTIPLE dates found → Future date is expiry
- If date is AMBIGUOUS → Lower confidence, return null if very uncertain

EXAMPLES:

Input: "15/12/24"
Output: {
  "expiryDate": "2024-12-15",
  "reasoningConfidence": 85,
  "reasoning": "Single future date detected, likely expiry",
  "detectedDates": [{
    "date": "2024-12-15",
    "format": "DD/MM/YY",
    "likelyType": "expiry",
    "confidence": 85
  }]
}

Input: "Aug 26"
Output: {
  "expiryDate": "2026-08-31",
  "reasoningConfidence": 80,
  "reasoning": "Month-year format, assuming end of month for expiry",
  "detectedDates": [{
    "date": "2026-08-31",
    "format": "Month YY",
    "likelyType": "expiry",
    "confidence": 80
  }]
}

Input: "20/05/2023"
Output: {
  "expiryDate": null,
  "reasoningConfidence": 10,
  "reasoning": "Past date detected, likely manufacture date, not expiry",
  "detectedDates": [{
    "date": "2023-05-20",
    "format": "DD/MM/YYYY",
    "likelyType": "manufacture",
    "confidence": 90
  }]
}

Input: "08/25\n15/12/24"
Output: {
  "expiryDate": "2024-12-15",
  "reasoningConfidence": 75,
  "reasoning": "Multiple dates found, future date (2024-12-15) is expiry",
  "detectedDates": [
    {
      "date": "2025-08-31",
      "format": "MM/YY",
      "likelyType": "expiry",
      "confidence": 60
    },
    {
      "date": "2024-12-15",
      "format": "DD/MM/YY",
      "likelyType": "expiry",
      "confidence": 75
    }
  ]
}

Input: "BATCH A123"
Output: {
  "expiryDate": null,
  "reasoningConfidence": 0,
  "reasoning": "No dates detected in text",
  "detectedDates": []
}

Input: "12/25"
Output: {
  "expiryDate": "2025-12-31",
  "reasoningConfidence": 70,
  "reasoning": "Month-year format, future date, likely expiry",
  "detectedDates": [{
    "date": "2025-12-31",
    "format": "MM/YY",
    "likelyType": "expiry",
    "confidence": 70
  }]
}

CONFIDENCE SCORING:
- 90-100: Very high confidence (clear future date, unambiguous)
- 70-89: High confidence (future date, some ambiguity)
- 50-69: Medium confidence (ambiguous date, context helps)
- 30-49: Low confidence (uncertain, but likely)
- 0-29: Very low confidence (return null if < 30)

OUTPUT FORMAT (JSON ONLY):
{
  "expiryDate": string | null,
  "reasoningConfidence": number,
  "reasoning": string,
  "detectedDates": Array<{
    "date": string,
    "format": string,
    "likelyType": "expiry" | "manufacture" | "unknown",
    "confidence": number
  }>
}`

/**
 * Generate user prompt for expiry extraction
 */
function generateUserPrompt(cleanedText: string): string {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()

  return `Extract expiry date from this handwritten text. Keywords may be missing. Use context to determine if dates are expiry or manufacture dates.

Current Date: ${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}

Handwritten Text:
${cleanedText}

Extract expiry date using context reasoning. Return expiry date in YYYY-MM-DD format or null if uncertain.`
}

/**
 * Extract expiry date using OpenAI
 */
async function extractWithOpenAI(
  cleanedText: string
): Promise<HandwritingExpiryResult> {
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
          content: generateUserPrompt(cleanedText),
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
    return validateAndNormalizeResult(parsed)
  } catch (parseError: any) {
    throw new Error(`Invalid JSON from OpenAI: ${parseError.message}`)
  }
}

/**
 * Extract expiry date using Gemini
 */
async function extractWithGemini(
  cleanedText: string
): Promise<HandwritingExpiryResult> {
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
                text: `${SYSTEM_PROMPT}\n\n${generateUserPrompt(cleanedText)}`,
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
    return validateAndNormalizeResult(parsed)
  } catch (parseError: any) {
    throw new Error(`Invalid JSON from Gemini: ${parseError.message}`)
  }
}

/**
 * Validate and normalize extraction result
 */
function validateAndNormalizeResult(
  parsed: any
): HandwritingExpiryResult {
  // Validate structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid result structure')
  }

  // Validate expiryDate (null or ISO date string)
  let expiryDate: string | null = null
  if (parsed.expiryDate !== null && parsed.expiryDate !== undefined) {
    if (typeof parsed.expiryDate !== 'string') {
      throw new Error('expiryDate must be a string or null')
    }
    
    // Validate ISO date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(parsed.expiryDate)) {
      throw new Error('expiryDate must be in YYYY-MM-DD format')
    }
    
    // Validate it's a real date
    const date = new Date(parsed.expiryDate)
    if (isNaN(date.getTime())) {
      throw new Error('expiryDate must be a valid date')
    }
    
    expiryDate = parsed.expiryDate
  }

  // Validate reasoningConfidence
  const reasoningConfidence = Math.max(
    0,
    Math.min(100, parsed.reasoningConfidence || 0)
  )

  // Validate reasoning (optional)
  const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : undefined

  // Validate detectedDates (optional)
  let detectedDates: HandwritingExpiryResult['detectedDates'] = undefined
  if (Array.isArray(parsed.detectedDates)) {
    detectedDates = parsed.detectedDates
      .filter((d: any) => d && typeof d === 'object')
      .map((d: any) => ({
        date: typeof d.date === 'string' ? d.date : '',
        format: typeof d.format === 'string' ? d.format : '',
        likelyType: ['expiry', 'manufacture', 'unknown'].includes(d.likelyType)
          ? d.likelyType
          : 'unknown',
        confidence: Math.max(0, Math.min(100, d.confidence || 0)),
      }))
  }

  return {
    expiryDate,
    reasoningConfidence,
    reasoning,
    detectedDates,
  }
}

/**
 * Extract expiry date from handwritten text
 * Uses context-based reasoning when keywords are missing
 */
export async function extractHandwritingExpiry(
  cleanedText: string,
  provider: 'openai' | 'gemini' = 'openai'
): Promise<HandwritingExpiryResult> {
  if (!cleanedText || cleanedText.trim().length === 0) {
    return {
      expiryDate: null,
      reasoningConfidence: 0,
      reasoning: 'Empty text provided',
      detectedDates: [],
    }
  }

  try {
    console.log(
      `[Handwriting Expiry] Extracting expiry from handwritten text (${cleanedText.length} chars) using ${provider}...`
    )

    let result: HandwritingExpiryResult

    if (provider === 'openai') {
      result = await extractWithOpenAI(cleanedText)
    } else {
      result = await extractWithGemini(cleanedText)
    }

    console.log(
      `[Handwriting Expiry] Completed - Expiry: ${result.expiryDate || 'null'}, Confidence: ${result.reasoningConfidence}%`
    )

    return result
  } catch (error: any) {
    console.error('[Handwriting Expiry] Error:', error)

    // Fallback: Return null with low confidence
    return {
      expiryDate: null,
      reasoningConfidence: 0,
      reasoning: `Extraction failed: ${error.message}`,
      detectedDates: [],
    }
  }
}

/**
 * Create error object for handwriting expiry extraction
 */
export function createExpiryError(
  error: string,
  code: HandwritingExpiryError['code'] = 'UNKNOWN',
  details?: string
): HandwritingExpiryError {
  return {
    error,
    code,
    details,
  }
}

