// AI Reasoning Engine for ExpiryCare
// Extracts structured data from OCR text with confidence scores

// Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai' // 'openai' | 'gemini'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini' // or 'gpt-4', 'gpt-3.5-turbo'
const TEMPERATURE = 0 // Deterministic output
const MAX_RETRIES = 1

/**
 * Output type for reasoning engine
 */
export interface ReasoningEngineOutput {
  expiryDate: string | null // ISO format YYYY-MM-DD
  expiryConfidence: number // 0-100
  companyName: string | null
  companyConfidence: number // 0-100
  itemCategory: string | null // 'medicine' | 'electronics' | 'insurance' | 'food' | 'other'
  productName: string | null
  detectedKeywords: string[] // Array of detected keywords
}

/**
 * Input type for reasoning engine
 */
export interface ReasoningEngineInput {
  rawText: string // OCR output
}

/**
 * System prompt for AI reasoning engine
 */
const SYSTEM_PROMPT = `You are an AI assistant for ExpiryCare, a product that helps users track expiry dates from documents.

Your job is to understand OCR-extracted text from documents like:
- warranty cards
- medicine labels
- insurance papers
- receipts

CRITICAL RULES:

1. DO NOT invent data - only extract what is explicitly present in the text
2. If multiple dates exist:
   - Prefer future dates for expiry
   - Look for keywords like:
     * "valid up to"
     * "warranty till"
     * "expiry"
     * "expires on"
     * "best before"
     * "use by"
3. Treat these as expiryDate:
   - "valid up to" = expiryDate
   - "warranty period" = expiryDate
   - "warranty till" = expiryDate
   - "expiry" = expiryDate
   - "expires on" = expiryDate
4. If unsure about any field, set value as null
5. Confidence must be provided per field (0-100):
   - 90-100: Very clear and unambiguous
   - 70-89: Clear but minor ambiguity
   - 50-69: Somewhat clear, some ambiguity
   - 30-49: Unclear, significant ambiguity
   - 0-29: Very unclear or not found

DATE FORMATS:
- Convert all dates to ISO format: YYYY-MM-DD
- Handle formats: DD/MM/YYYY, DD-MM-YYYY, MM/YYYY, DD/MM/YY
- For month-only (MM/YYYY), use last day of month: YYYY-MM-31

ITEM CATEGORIES:
- "medicine" - Medicine labels, prescriptions, medical products
- "electronics" - Electronics warranty, gadgets, devices
- "insurance" - Insurance policies, health insurance, car insurance
- "food" - Food items, groceries, packaged food
- "other" - Everything else (warranty cards, receipts, etc.)

COMPANY NAME:
- Extract brand names, manufacturer names, company names
- Look for: "Manufactured by", "Made by", "Company:", brand logos text
- If unclear, return null

PRODUCT NAME:
- Extract product names, model numbers, item descriptions
- If unclear, return null

DETECTED KEYWORDS:
- List all relevant keywords found (uppercase)
- Examples: "VALID UP TO", "EXPIRY", "WARRANTY", "MANUFACTURED BY", etc.

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown, no code blocks, no explanations. Just the JSON object.

{
  "expiryDate": string | null,
  "expiryConfidence": number,
  "companyName": string | null,
  "companyConfidence": number,
  "itemCategory": string | null,
  "productName": string | null,
  "detectedKeywords": string[]
}

EXAMPLES:

Example 1:
Input: "Warranty Card\nValid up to Date: 22-02-2022\nLakshay Manufacture\nMira Road - 401 107, Mumbai"
Output: {"expiryDate":"2022-02-22","expiryConfidence":95,"companyName":"Lakshay Manufacture","companyConfidence":90,"itemCategory":"other","productName":null,"detectedKeywords":["WARRANTY","VALID UP TO"]}

Example 2:
Input: "Paracetamol 500mg\nEXP: 31/12/2024\nBATCH: ABC123\nManufactured by: Pharma Ltd"
Output: {"expiryDate":"2024-12-31","expiryConfidence":95,"companyName":"Pharma Ltd","companyConfidence":85,"itemCategory":"medicine","productName":"Paracetamol 500mg","detectedKeywords":["EXP","BATCH","MANUFACTURED BY"]}

Example 3:
Input: "Best Before: 20/03/2024\nProduct Name: Rice\nCompany: Food Corp"
Output: {"expiryDate":"2024-03-20","expiryConfidence":90,"companyName":"Food Corp","companyConfidence":85,"itemCategory":"food","productName":"Rice","detectedKeywords":["BEST BEFORE"]}

Example 4:
Input: "Some random text without clear expiry information"
Output: {"expiryDate":null,"expiryConfidence":0,"companyName":null,"companyConfidence":0,"itemCategory":null,"productName":null,"detectedKeywords":[]}

Remember: Extract only what is clearly present. Never guess. Return valid JSON only.`

/**
 * Generate user prompt from input
 */
function generateUserPrompt(input: ReasoningEngineInput): string {
  return `Extract structured data from this OCR text.

OCR Text:
${input.rawText}

Return valid JSON only in the specified format.`
}

/**
 * Parse reasoning data using OpenAI
 */
async function parseWithOpenAI(
  input: ReasoningEngineInput
): Promise<ReasoningEngineOutput> {
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
 * Parse reasoning data using Google Gemini
 */
async function parseWithGemini(
  input: ReasoningEngineInput
): Promise<ReasoningEngineOutput> {
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
function parseJSONResponse(content: string): ReasoningEngineOutput {
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
function validateAndNormalize(data: any): ReasoningEngineOutput {
  const result: ReasoningEngineOutput = {
    expiryDate: null,
    expiryConfidence: 0,
    companyName: null,
    companyConfidence: 0,
    itemCategory: null,
    productName: null,
    detectedKeywords: [],
  }

  // Expiry date - validate ISO format
  if (data.expiryDate && typeof data.expiryDate === 'string') {
    const dateStr = data.expiryDate.trim()
    if (isValidISODate(dateStr)) {
      result.expiryDate = dateStr
    }
  }

  // Expiry confidence
  if (typeof data.expiryConfidence === 'number') {
    result.expiryConfidence = Math.max(0, Math.min(100, data.expiryConfidence))
  }

  // Company name
  if (data.companyName && typeof data.companyName === 'string') {
    result.companyName = data.companyName.trim() || null
  }

  // Company confidence
  if (typeof data.companyConfidence === 'number') {
    result.companyConfidence = Math.max(0, Math.min(100, data.companyConfidence))
  }

  // Item category
  if (data.itemCategory && typeof data.itemCategory === 'string') {
    const category = data.itemCategory.trim().toLowerCase()
    const validCategories = ['medicine', 'electronics', 'insurance', 'food', 'other']
    if (validCategories.includes(category)) {
      result.itemCategory = category
    }
  }

  // Product name
  if (data.productName && typeof data.productName === 'string') {
    result.productName = data.productName.trim() || null
  }

  // Detected keywords
  if (Array.isArray(data.detectedKeywords)) {
    result.detectedKeywords = data.detectedKeywords
      .filter((keyword) => typeof keyword === 'string')
      .map((keyword) => keyword.trim().toUpperCase())
      .filter((keyword) => keyword.length > 0)
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
 * Main function to extract structured data from OCR text
 * 
 * @param input - OCR raw text
 * @returns Structured data with confidence scores
 * @throws Error if parsing fails
 */
export async function reasonFromOCR(
  input: ReasoningEngineInput
): Promise<ReasoningEngineOutput> {
  if (!input.rawText || input.rawText.trim().length === 0) {
    return {
      expiryDate: null,
      expiryConfidence: 0,
      companyName: null,
      companyConfidence: 0,
      itemCategory: null,
      productName: null,
      detectedKeywords: [],
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
          `[Reasoning Engine] JSON parse error on attempt ${attempt + 1}, retrying...`
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

