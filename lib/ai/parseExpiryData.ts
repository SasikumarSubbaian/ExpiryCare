// AI Parsing Service - Converts OCR raw text to structured expiry data
import type { ExpiryDataInput, ExpiryDataOutput, ParseError } from './types'

// Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai' // 'openai' | 'gemini'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini' // or 'gpt-4', 'gpt-3.5-turbo'
const TEMPERATURE = 0 // Deterministic output
const MAX_RETRIES = 1

/**
 * System prompt with strict rules for parsing expiry data
 * Acts as a document intelligence engine with Indian date format support
 */
const SYSTEM_PROMPT = `You are a document intelligence engine specialized in extracting structured expiry data from product labels, warranty cards, medicine packaging, and food items.

Your core function is to parse OCR text and extract ONLY information that is explicitly present. You NEVER guess, infer, or hallucinate data.

CRITICAL FOR WARRANTY CARDS:
- "Valid up to Date: DD-MM-YYYY" or "Valid up to Date DD-MM-YYYY" = EXPIRY DATE
- Convert DD-MM-YYYY format to ISO format YYYY-MM-DD (e.g., "22-02-2022" → "2022-02-22")
- This is the WARRANTY EXPIRY DATE and must be extracted as expiryDate
- Example: "Valid up to Date: 22-02-2022" → expiryDate: "2022-02-22"

CRITICAL RULES:

1. DATE EXTRACTION RULES:
   - Expiry date takes absolute priority over all other dates
   - NEVER guess dates - if unclear, return null
   - Prefer FUTURE dates for expiry (if current date is 2024-01-15, and you see "15/01/2024", it's likely 2025-01-15 if ambiguous)
   - Handle Indian date formats (CRITICAL for warranty cards):
     * DD/MM/YYYY (e.g., 31/12/2024)
     * DD-MM-YYYY (e.g., 31-12-2024, 22-02-2022) - COMMON IN WARRANTY CARDS
     * DD.MM.YYYY (e.g., 31.12.2024)
     * MM/YYYY (e.g., 08/2026 → convert to 2026-08-31, last day of month)
     * DD/MM/YY (e.g., 31/12/24 → 2024-12-31, assume 20XX if year < 50, else 19XX)
   - IMPORTANT: "Valid up to Date: 22-02-2022" should extract expiryDate as "2022-02-22"
   - If you see "Valid up to Date" or "Valid up to" followed by a date, that IS the expiry date
   - Month-only expiry: If you see "08/26" or "08-26" or "08.26" and it's clearly an expiry:
     * Interpret as MM/YYYY format
     * Convert to last day of that month: 2026-08-31
   - All dates must be converted to ISO format: YYYY-MM-DD
   - If date is in the past and clearly an expiry, it might be expired - extract it anyway

2. KEYWORD DETECTION:
   Detect these expiry-related keywords (case-insensitive):
   - EXP, EXPIRY, EXPIRY DATE, EXPIRES, EXPIRES ON
   - USE BEFORE, USE BY, CONSUME BEFORE, CONSUME BY
   - BEST BEFORE, BEST BY, BEST BEFORE DATE
   - VALID UPTO, VALID UNTIL, VALID TILL, VALID UP TO, VALID UP TO DATE, VALID UPTO DATE
   - VALID UP TO DATE (common in warranty cards - CRITICAL: treat as expiry date)
   - "Valid up to Date:" followed by a date = EXPIRY DATE (very common in warranty cards)
   - MFG, MANUFACTURING, MANUFACTURED, MANUFACTURING DATE, MFG DATE
   - BATCH, BATCH NO, BATCH NUMBER, BATCH NO., LOT, LOT NO, LOT NUMBER
   - PACKED ON, PACKED DATE, PACK DATE
   - SELL BY, SELL BEFORE
   
   CRITICAL: If you see "Valid up to Date: 22-02-2022" or "Valid up to Date 22-02-2022", 
   extract "2022-02-22" as the expiryDate. This is a WARRANTY EXPIRY DATE.

3. MULTIPLE DATES HANDLING:
   - If multiple dates exist, identify which is expiry based on:
     * Proximity to expiry keywords (EXP, BEST BEFORE, etc.)
     * Date value (expiry is usually later than manufacturing)
     * Context clues
   - Manufacturing date is usually earlier than expiry date
   - If you find "MFG: 01/2023" and "EXP: 01/2025", extract both correctly

4. PRODUCT NAME EXTRACTION:
   - Extract product name only if clearly identifiable
   - Look for brand names, product names, or model numbers
   - If product name is unclear or missing, return null
   - Don't include generic words like "Warranty Card", "Certificate" as product name

5. BATCH NUMBER EXTRACTION:
   - Look for alphanumeric codes near BATCH, LOT keywords
   - Can contain letters, numbers, hyphens
   - If unclear, return null

6. CONFIDENCE SCORING:
   - 90-100: All data clearly present and unambiguous
   - 70-89: Most data clear, minor ambiguity
   - 50-69: Some data clear, some ambiguous
   - 30-49: Limited data, significant ambiguity
   - 0-29: Very unclear or no data found

7. DETECTED LABELS:
   - List ALL expiry-related keywords found in the text (uppercase)
   - Include variations (e.g., "EXP", "EXPIRY", "EXPIRES" all count)

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown, no code blocks, no explanations. Just the JSON object.

{
  "productName": string | null,
  "expiryDate": string | null,
  "manufacturingDate": string | null,
  "batchNumber": string | null,
  "confidenceScore": number,
  "detectedLabels": string[]
}

TRAINING EXAMPLES (for your understanding, do not include in response):

Example 1:
Input: "Paracetamol 500mg EXP: 31/12/2024 BATCH: ABC123"
Output: {"productName":"Paracetamol 500mg","expiryDate":"2024-12-31","manufacturingDate":null,"batchNumber":"ABC123","confidenceScore":95,"detectedLabels":["EXP","BATCH"]}

Example 2:
Input: "Warranty Card Valid until 15-06-2025"
Output: {"productName":null,"expiryDate":"2025-06-15","manufacturingDate":null,"batchNumber":null,"confidenceScore":90,"detectedLabels":["VALID UNTIL"]}

Example 2a (Warranty card with "Valid up to Date" - CRITICAL):
Input: "Warranty Card Valid up to Date: 22-02-2022"
Output: {"productName":null,"expiryDate":"2022-02-22","manufacturingDate":null,"batchNumber":null,"confidenceScore":95,"detectedLabels":["VALID UP TO DATE"]}

Example 2b (Warranty card with "Valid up to Date" and other text):
Input: "Warranty Card Code: LX2302021-K Valid up to Date: 22-02-2022 Customer Care No.: 8688819512"
Output: {"productName":null,"expiryDate":"2022-02-22","manufacturingDate":null,"batchNumber":null,"confidenceScore":95,"detectedLabels":["VALID UP TO DATE"]}

Example 3:
Input: "Best Before: 20/03/2024 MFG: 20/03/2023"
Output: {"productName":null,"expiryDate":"2024-03-20","manufacturingDate":"2023-03-20","batchNumber":null,"confidenceScore":95,"detectedLabels":["BEST BEFORE","MFG"]}

Example 4 (Indian format):
Input: "Medicine EXP 15/08/2025 BATCH NO: XYZ789"
Output: {"productName":"Medicine","expiryDate":"2025-08-15","manufacturingDate":null,"batchNumber":"XYZ789","confidenceScore":95,"detectedLabels":["EXP","BATCH NO"]}

Example 5 (Month-only expiry):
Input: "Product EXP: 08/26"
Output: {"productName":"Product","expiryDate":"2026-08-31","manufacturingDate":null,"batchNumber":null,"confidenceScore":85,"detectedLabels":["EXP"]}

Example 6 (Month-only with different format):
Input: "Best Before 12-2025"
Output: {"productName":null,"expiryDate":"2025-12-31","manufacturingDate":null,"batchNumber":null,"confidenceScore":90,"detectedLabels":["BEST BEFORE"]}

Example 7 (Ambiguous - return nulls):
Input: "Some random text without clear expiry information"
Output: {"productName":null,"expiryDate":null,"manufacturingDate":null,"batchNumber":null,"confidenceScore":0,"detectedLabels":[]}

Example 8 (2-digit year):
Input: "EXP: 31/12/24"
Output: {"productName":null,"expiryDate":"2024-12-31","manufacturingDate":null,"batchNumber":null,"confidenceScore":85,"detectedLabels":["EXP"]}

Example 9 (Multiple dates - prioritize expiry):
Input: "MFG: 01/01/2023 EXP: 01/01/2025"
Output: {"productName":null,"expiryDate":"2025-01-01","manufacturingDate":"2023-01-01","batchNumber":null,"confidenceScore":95,"detectedLabels":["MFG","EXP"]}

Example 10 (Future date preference):
Input: "Valid till 15/01/2024" (if current date context suggests it's 2024 or later)
Output: {"productName":null,"expiryDate":"2025-01-15","manufacturingDate":null,"batchNumber":null,"confidenceScore":80,"detectedLabels":["VALID TILL"]}

Remember: You are a document intelligence engine. Extract only what is clearly present. Never guess. Return valid JSON only.`

/**
 * Generate user prompt from input
 * Clean prompt without exposing examples
 */
function generateUserPrompt(input: ExpiryDataInput): string {
  const categoryContext = input.category
    ? `\nCategory: ${input.category}`
    : ''

  return `Extract expiry data from this OCR text.${categoryContext}

OCR Text:
${input.rawText}

Return valid JSON only in the specified format.`
}

/**
 * Parse expiry data using OpenAI
 */
async function parseWithOpenAI(
  input: ExpiryDataInput
): Promise<ExpiryDataOutput> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: generateUserPrompt(input) },
      ],
      temperature: TEMPERATURE,
      response_format: { type: 'json_object' }, // Force JSON output
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    if (response.status === 401) {
      throw new Error('OpenAI API authentication failed')
    }
    if (response.status === 429) {
      throw new Error('OpenAI API rate limit exceeded')
    }
    
    throw new Error(
      `OpenAI API error: ${errorData.error?.message || response.statusText}`
    )
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content

  if (!content) {
    throw new Error('No content in OpenAI response')
  }

  return parseJSONResponse(content)
}

/**
 * Parse expiry data using Google Gemini
 */
async function parseWithGemini(
  input: ExpiryDataInput
): Promise<ExpiryDataOutput> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const model = process.env.GEMINI_MODEL || 'gemini-pro'

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
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
                text: `${SYSTEM_PROMPT}\n\n${generateUserPrompt(input)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: TEMPERATURE,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Gemini API authentication failed')
    }
    if (response.status === 429) {
      throw new Error('Gemini API rate limit exceeded')
    }
    
    throw new Error(
      `Gemini API error: ${errorData.error?.message || response.statusText}`
    )
  }

  const data = await response.json()
  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.candidates?.[0]?.content?.text

  if (!content) {
    throw new Error('No content in Gemini response')
  }

  return parseJSONResponse(content)
}

/**
 * Parse JSON response with validation
 */
function parseJSONResponse(content: string): ExpiryDataOutput {
  // Try to extract JSON from markdown code blocks if present
  let jsonString = content.trim()
  
  // Remove markdown code blocks if present
  const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim()
  }

  // Try to find JSON object in the string
  const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/)
  if (jsonObjectMatch) {
    jsonString = jsonObjectMatch[0]
  }

  let parsed: any
  try {
    parsed = JSON.parse(jsonString)
  } catch (parseError: any) {
    throw new Error(`JSON parse error: ${parseError.message}`)
  }

  // Validate and normalize response
  return validateAndNormalize(parsed)
}

/**
 * Validate and normalize parsed data
 */
function validateAndNormalize(data: any): ExpiryDataOutput {
  const result: ExpiryDataOutput = {
    productName: null,
    expiryDate: null,
    manufacturingDate: null,
    batchNumber: null,
    confidenceScore: 0,
    detectedLabels: [],
  }

  // Product name
  if (data.productName && typeof data.productName === 'string') {
    result.productName = data.productName.trim() || null
  }

  // Expiry date - validate ISO format
  if (data.expiryDate && typeof data.expiryDate === 'string') {
    const dateStr = data.expiryDate.trim()
    if (isValidISODate(dateStr)) {
      result.expiryDate = dateStr
    }
  }

  // Manufacturing date - validate ISO format
  if (
    data.manufacturingDate &&
    typeof data.manufacturingDate === 'string'
  ) {
    const dateStr = data.manufacturingDate.trim()
    if (isValidISODate(dateStr)) {
      result.manufacturingDate = dateStr
    }
  }

  // Batch number
  if (data.batchNumber && typeof data.batchNumber === 'string') {
    result.batchNumber = data.batchNumber.trim() || null
  }

  // Confidence score
  if (typeof data.confidenceScore === 'number') {
    result.confidenceScore = Math.max(0, Math.min(100, data.confidenceScore))
  }

  // Detected labels
  if (Array.isArray(data.detectedLabels)) {
    result.detectedLabels = data.detectedLabels
      .filter((label) => typeof label === 'string')
      .map((label) => label.trim().toUpperCase())
      .filter((label) => label.length > 0)
  }

  return result
}

/**
 * Validate ISO date format (YYYY-MM-DD)
 */
function isValidISODate(dateStr: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!isoDateRegex.test(dateStr)) {
    return false
  }

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return false
  }

  // Check if date components match (prevents invalid dates like 2024-02-30)
  const [year, month, day] = dateStr.split('-').map(Number)
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  )
}

/**
 * Main function to parse expiry data from OCR text
 * 
 * @param input - OCR text and optional category
 * @returns Structured expiry data
 * @throws ParseError if parsing fails
 */
export async function parseExpiryData(
  input: ExpiryDataInput
): Promise<ExpiryDataOutput> {
  if (!input.rawText || input.rawText.trim().length === 0) {
    return {
      productName: null,
      expiryDate: null,
      manufacturingDate: null,
      batchNumber: null,
      confidenceScore: 0,
      detectedLabels: [],
    }
  }

  let lastError: Error | null = null

  // Retry logic (max 1 retry)
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (AI_PROVIDER === 'gemini') {
        return await parseWithGemini(input)
      } else {
        return await parseWithOpenAI(input)
      }
    } catch (error: any) {
      lastError = error

      // If it's a JSON parse error and we have retries left, try again
      if (
        error.message?.includes('JSON parse error') &&
        attempt < MAX_RETRIES
      ) {
        console.warn(
          `[AI Parse] JSON parse error on attempt ${attempt + 1}, retrying...`
        )
        continue
      }

      // For other errors or no retries left, throw
      throw error
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Unknown parsing error')
}

/**
 * Helper function to create ParseError
 */
export function createParseError(
  error: Error,
  code: ParseError['code'] = 'API_ERROR'
): ParseError {
  return {
    error: error.message,
    code,
    details: error.stack,
  }
}

