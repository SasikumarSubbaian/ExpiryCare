# AI Reasoning Engine

Core AI reasoning engine for ExpiryCare that extracts structured data from OCR text.

## Purpose

Understand OCR-extracted text from documents like:
- Warranty cards
- Medicine labels
- Insurance papers
- Receipts

## Features

- ✅ **No data invention** - Only extracts what is explicitly present
- ✅ **Confidence scores** - Each field has its own confidence (0-100)
- ✅ **Multiple date handling** - Prefers future dates, looks for keywords
- ✅ **Keyword detection** - Identifies relevant keywords in text
- ✅ **Category classification** - Automatically categorizes items
- ✅ **Strict JSON output** - Temperature = 0, deterministic

## Input

```typescript
{
  rawText: string  // OCR output
}
```

## Output

```typescript
{
  expiryDate: string | null,           // ISO format YYYY-MM-DD
  expiryConfidence: number,             // 0-100
  companyName: string | null,
  companyConfidence: number,            // 0-100
  itemCategory: string | null,           // 'medicine' | 'electronics' | 'insurance' | 'food' | 'other'
  productName: string | null,
  detectedKeywords: string[]            // Array of detected keywords (uppercase)
}
```

## Usage

### Direct Import

```typescript
import { reasonFromOCR } from '@/lib/ai/reasoningEngine'

const result = await reasonFromOCR({
  rawText: 'Warranty Card\nValid up to Date: 22-02-2022\nLakshay Manufacture'
})

console.log(result.expiryDate)        // "2022-02-22"
console.log(result.expiryConfidence)  // 95
console.log(result.companyName)       // "Lakshay Manufacture"
console.log(result.itemCategory)      // "other"
```

### API Route

```bash
POST /api/ai/reasoning-engine

Request:
{
  "rawText": "Warranty Card\nValid up to Date: 22-02-2022\nLakshay Manufacture"
}

Response:
{
  "expiryDate": "2022-02-22",
  "expiryConfidence": 95,
  "companyName": "Lakshay Manufacture",
  "companyConfidence": 90,
  "itemCategory": "other",
  "productName": null,
  "detectedKeywords": ["WARRANTY", "VALID UP TO"]
}
```

## Rules

1. **DO NOT invent data** - Only extract what is explicitly present
2. **Multiple dates** - Prefer future dates, look for keywords:
   - "valid up to"
   - "warranty till"
   - "expiry"
   - "expires on"
3. **Expiry date keywords**:
   - "valid up to" = expiryDate
   - "warranty period" = expiryDate
   - "warranty till" = expiryDate
4. **Uncertainty** - If unsure, set value as null
5. **Confidence** - Must be provided per field (0-100)

## Date Formats

Handles various date formats and converts to ISO (YYYY-MM-DD):
- DD/MM/YYYY → YYYY-MM-DD
- DD-MM-YYYY → YYYY-MM-DD
- MM/YYYY → YYYY-MM-31 (last day of month)
- DD/MM/YY → YYYY-MM-DD

## Item Categories

- **medicine** - Medicine labels, prescriptions, medical products
- **electronics** - Electronics warranty, gadgets, devices
- **insurance** - Insurance policies, health insurance, car insurance
- **food** - Food items, groceries, packaged food
- **other** - Everything else (warranty cards, receipts, etc.)

## Confidence Scores

- **90-100**: Very clear and unambiguous
- **70-89**: Clear but minor ambiguity
- **50-69**: Somewhat clear, some ambiguity
- **30-49**: Unclear, significant ambiguity
- **0-29**: Very unclear or not found

## Examples

### Example 1: Warranty Card
```
Input: "Warranty Card\nValid up to Date: 22-02-2022\nLakshay Manufacture"

Output:
{
  "expiryDate": "2022-02-22",
  "expiryConfidence": 95,
  "companyName": "Lakshay Manufacture",
  "companyConfidence": 90,
  "itemCategory": "other",
  "productName": null,
  "detectedKeywords": ["WARRANTY", "VALID UP TO"]
}
```

### Example 2: Medicine Label
```
Input: "Paracetamol 500mg\nEXP: 31/12/2024\nBATCH: ABC123\nManufactured by: Pharma Ltd"

Output:
{
  "expiryDate": "2024-12-31",
  "expiryConfidence": 95,
  "companyName": "Pharma Ltd",
  "companyConfidence": 85,
  "itemCategory": "medicine",
  "productName": "Paracetamol 500mg",
  "detectedKeywords": ["EXP", "BATCH", "MANUFACTURED BY"]
}
```

### Example 3: Food Item
```
Input: "Best Before: 20/03/2024\nProduct Name: Rice\nCompany: Food Corp"

Output:
{
  "expiryDate": "2024-03-20",
  "expiryConfidence": 90,
  "companyName": "Food Corp",
  "companyConfidence": 85,
  "itemCategory": "food",
  "productName": "Rice",
  "detectedKeywords": ["BEST BEFORE"]
}
```

## Configuration

Uses the same AI provider configuration as other AI services:

```env
AI_PROVIDER=openai  # or 'gemini'
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
AI_MODEL=gpt-4o-mini  # or 'gpt-4', 'gpt-3.5-turbo', 'gemini-pro'
```

## Error Handling

The service throws errors with descriptive messages:
- `OPENAI_API_KEY is not configured` - Missing API key
- `OpenAI API authentication failed` - Invalid API key
- `OpenAI API rate limit exceeded` - Rate limit hit
- `JSON parse error` - Invalid JSON response from AI

## Notes

- **Temperature = 0** - Deterministic output, no randomness
- **No explanations** - Returns only JSON, no markdown or code blocks
- **Strict validation** - All dates validated as ISO format
- **Confidence per field** - Each field has independent confidence score

