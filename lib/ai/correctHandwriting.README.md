# AI Handwriting Error Correction

Post-processing step that corrects common OCR mistakes in handwritten text using AI.

## Purpose

Handwritten OCR often produces character recognition errors. This service uses AI to:
- Correct common OCR character mistakes
- Normalize date formats
- Improve overall text accuracy
- Never invent or add missing text

## Common OCR Mistakes Corrected

- **O ↔ 0** (letter O vs zero)
- **I ↔ 1** (letter I vs one)
- **S ↔ 5** (letter S vs five)
- **B ↔ 8** (letter B vs eight)
- **Z ↔ 2** (letter Z vs two)
- **G ↔ 6** (letter G vs six)
- **l ↔ 1** (lowercase L vs one)
- **r ↔ 7** (lowercase r vs seven)

## Date Normalization

- Detects and normalizes dates to `YYYY-MM-DD` format
- Prefers future dates for expiry dates (if ambiguous)
- Handles Indian formats:
  - `DD/MM/YYYY`
  - `MM/YYYY`
  - `DD/MM/YY`
- Converts month-only expiry (e.g., `08/26` → `2026-08-31`)

## Critical Rules

1. **NEVER invent, add, or guess missing text**
2. **ONLY correct obvious OCR character mistakes**
3. **Preserve all original text structure and spacing**
4. **Return ONLY valid JSON, no explanations**

## Usage

```typescript
import { correctHandwriting } from '@/lib/ai/correctHandwriting'

const result = await correctHandwriting(rawOcrText, 'openai')

console.log(result.cleanedText)      // Corrected text
console.log(result.detectedDates)    // Normalized dates
console.log(result.confidence)       // 0-100
```

## Response Format

```typescript
{
  cleanedText: string,        // Corrected OCR text
  detectedDates: string[],    // Normalized dates (YYYY-MM-DD)
  confidence: number          // 0-100
}
```

## Examples

### Example 1: Character Correction
**Input:** `"EXPIRY: 01/08/2O25"`  
**Output:**
```json
{
  "cleanedText": "EXPIRY: 01/08/2025",
  "detectedDates": ["2025-08-01"],
  "confidence": 95
}
```

### Example 2: Multiple Corrections
**Input:** `"BEST BEF0RE: 15/12/24"`  
**Output:**
```json
{
  "cleanedText": "BEST BEFORE: 15/12/24",
  "detectedDates": ["2024-12-15"],
  "confidence": 90
}
```

### Example 3: Date Normalization
**Input:** `"EXP: 08/26"`  
**Output:**
```json
{
  "cleanedText": "EXP: 08/26",
  "detectedDates": ["2026-08-31"],
  "confidence": 85
}
```

### Example 4: No Changes Needed
**Input:** `"BATCH: A1B2C3"`  
**Output:**
```json
{
  "cleanedText": "BATCH: A1B2C3",
  "detectedDates": [],
  "confidence": 100
}
```

## Integration

Automatically runs in handwriting OCR pipeline:
1. OCR extracts text (dual pass)
2. Results merged by confidence
3. **AI error correction** ← This step
4. Corrected text returned

## API Endpoint

**POST** `/api/ai/correct-handwriting`

**Request:**
```json
{
  "rawText": "EXPIRY: 01/08/2O25",
  "provider": "openai"
}
```

**Response:**
```json
{
  "cleanedText": "EXPIRY: 01/08/2025",
  "detectedDates": ["2025-08-01"],
  "confidence": 95
}
```

## Configuration

- **Temperature:** 0 (deterministic)
- **Response Format:** JSON only
- **Model:** GPT-4o-mini (OpenAI) or Gemini 1.5 Flash
- **Timeout:** 15 seconds

## Confidence Scoring

- **90-100:** High confidence corrections
- **70-89:** Medium confidence corrections
- **50-69:** Low confidence corrections
- **<50:** Uncertain, minimal changes

## Safety Features

1. **Length validation:** Prevents adding text
2. **Structure validation:** Ensures valid JSON
3. **Fallback:** Returns original text on error
4. **Timeout protection:** 15-second limit

## Logging

```
[Handwriting Correction] Correcting text (45 chars) using openai...
[Handwriting Correction] Completed - Confidence: 95%, Dates: 1
```

