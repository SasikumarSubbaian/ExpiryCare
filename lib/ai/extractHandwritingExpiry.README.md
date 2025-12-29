# Handwriting Expiry Extraction

Specialized expiry date extractor for handwritten content that uses context-based reasoning when keywords are missing.

## Purpose

Handwritten documents often lack clear keywords like "EXP", "BEST BEFORE", etc. This service:
- Extracts expiry dates even without keywords
- Uses context to determine date type (future = expiry, past = manufacture)
- Handles various date formats including month names
- Provides reasoning confidence scores

## Key Features

### Context-Based Reasoning
- **Single future date** → Likely expiry (high confidence)
- **Past date** → Likely manufacture (low expiry confidence)
- **Multiple dates** → Future date is expiry
- **Ambiguous dates** → Lower confidence, may return null

### Date Format Support
- `DD/MM/YY` (e.g., `15/12/24` → `2024-12-15`)
- `MM/YY` (e.g., `08/26` → `2026-08-31`)
- `DD/MM/YYYY` (e.g., `31/12/2024` → `2024-12-31`)
- **Month names** (e.g., `Aug 26` → `2026-08-26`, `Aug 2026` → `2026-08-31`)
- `YYYY-MM-DD` (already ISO format)

## Usage

```typescript
import { extractHandwritingExpiry } from '@/lib/ai/extractHandwritingExpiry'

const result = await extractHandwritingExpiry(cleanedText, 'openai')

console.log(result.expiryDate)           // "2024-12-15" or null
console.log(result.reasoningConfidence)  // 0-100
console.log(result.reasoning)            // Explanation
console.log(result.detectedDates)        // All dates found
```

## Response Format

```typescript
{
  expiryDate: string | null,        // ISO format YYYY-MM-DD
  reasoningConfidence: number,       // 0-100
  reasoning?: string,                // Explanation
  detectedDates?: Array<{
    date: string,                    // ISO date
    format: string,                  // Format detected
    likelyType: 'expiry' | 'manufacture' | 'unknown',
    confidence: number
  }>
}
```

## Examples

### Example 1: Single Future Date
**Input:** `"15/12/24"`  
**Output:**
```json
{
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
```

### Example 2: Month Name Format
**Input:** `"Aug 26"`  
**Output:**
```json
{
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
```

### Example 3: Past Date (Manufacture)
**Input:** `"20/05/2023"`  
**Output:**
```json
{
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
```

### Example 4: Multiple Dates
**Input:** `"08/25\n15/12/24"`  
**Output:**
```json
{
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
```

### Example 5: No Dates
**Input:** `"BATCH A123"`  
**Output:**
```json
{
  "expiryDate": null,
  "reasoningConfidence": 0,
  "reasoning": "No dates detected in text",
  "detectedDates": []
}
```

## Confidence Scoring

- **90-100:** Very high confidence (clear future date, unambiguous)
- **70-89:** High confidence (future date, some ambiguity)
- **50-69:** Medium confidence (ambiguous date, context helps)
- **30-49:** Low confidence (uncertain, but likely)
- **0-29:** Very low confidence (returns null if < 30)

## Integration

Automatically runs in handwriting OCR pipeline:
1. OCR extracts text (dual pass)
2. Results merged by confidence
3. AI error correction
4. **Handwriting expiry extraction** ← This step
5. Final expiry date returned

## API Endpoint

**POST** `/api/ai/extract-handwriting-expiry`

**Request:**
```json
{
  "cleanedText": "15/12/24",
  "provider": "openai"
}
```

**Response:**
```json
{
  "expiryDate": "2024-12-15",
  "reasoningConfidence": 85,
  "reasoning": "Single future date detected, likely expiry",
  "detectedDates": [...]
}
```

## Configuration

- **Temperature:** 0 (deterministic)
- **Response Format:** JSON only
- **Model:** GPT-4o-mini (OpenAI) or Gemini 1.5 Flash
- **Timeout:** 15 seconds

## Critical Rules

1. **Keywords may be MISSING** - don't rely on "EXP", "BEST BEFORE", etc.
2. **Dates may appear ALONE** without labels
3. **Use CONTEXT** to determine date type
4. **NEVER invent dates** - only extract what's present
5. **Return ONLY valid JSON** - no explanations

## Logging

```
[Handwriting Expiry] Extracting expiry from handwritten text (45 chars) using openai...
[Handwriting Expiry] Completed - Expiry: 2024-12-15, Confidence: 85%
```

