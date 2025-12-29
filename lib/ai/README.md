# AI Parsing Service

Intelligent parsing service that converts OCR raw text into structured expiry data using AI (OpenAI or Gemini).

## Features

- ✅ Converts OCR text to structured expiry data
- ✅ Supports OpenAI and Google Gemini
- ✅ Strict rules: Never hallucinates, returns null if unclear
- ✅ Expiry date priority detection
- ✅ Keyword detection (EXP, BEST BEFORE, etc.)
- ✅ JSON parsing with retry logic
- ✅ Temperature = 0 for deterministic output
- ✅ Comprehensive error handling

## Setup

### Environment Variables

Add to `.env.local`:

```env
# AI Provider (openai or gemini)
AI_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Optional: Custom model
AI_MODEL=gpt-4o-mini

# OR Gemini Configuration
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-pro
```

## API Endpoint

### `POST /api/ai/parse`

**Request:**
```json
{
  "rawText": "Paracetamol 500mg EXP: 31/12/2024 BATCH: ABC123",
  "category": "medicine" // optional
}
```

**Response:**
```json
{
  "productName": "Paracetamol 500mg",
  "expiryDate": "2024-12-31",
  "manufacturingDate": null,
  "batchNumber": "ABC123",
  "confidenceScore": 95,
  "detectedLabels": ["EXP", "BATCH"]
}
```

## Usage

```typescript
import { parseExpiryData } from '@/lib/ai/parseExpiryData'

const result = await parseExpiryData({
  rawText: "Best Before: 20/03/2024",
  category: "food"
})

console.log(result.expiryDate) // "2024-03-20"
```

## Parsing Rules

1. **Expiry date takes priority** over all other dates
2. **Keyword detection**: EXP, EXPIRY, USE BEFORE, BEST BEFORE, VALID UPTO, MFG, BATCH, LOT
3. **Multiple dates**: Chooses most likely expiry (usually later date)
4. **Unclear data**: Returns null (never hallucinates)
5. **Date format**: ISO format YYYY-MM-DD only
6. **Confidence**: 0-100 based on clarity

## Supported Categories

- `medicine`
- `food`
- `warranty`
- `insurance`
- `subscription`

## Error Handling

The service handles:
- API authentication errors
- Rate limit errors
- JSON parsing errors (with retry)
- Invalid responses
- Network errors

All errors return structured error responses with appropriate codes.

## Architecture

```
lib/ai/
├── types.ts              # TypeScript types
├── parseExpiryData.ts    # Main parsing logic
└── index.ts              # Exports

app/api/ai/parse/
└── route.ts              # API endpoint
```

## Examples

### Medicine Label
```
Input: "Paracetamol 500mg EXP: 31/12/2024 BATCH: ABC123"
Output: {
  productName: "Paracetamol 500mg",
  expiryDate: "2024-12-31",
  batchNumber: "ABC123",
  confidenceScore: 95
}
```

### Warranty Card
```
Input: "Warranty Card Valid until 15-06-2025"
Output: {
  expiryDate: "2025-06-15",
  detectedLabels: ["VALID UNTIL"],
  confidenceScore: 90
}
```

### Food Product
```
Input: "Best Before: 20/03/2024 MFG: 20/03/2023"
Output: {
  expiryDate: "2024-03-20",
  manufacturingDate: "2023-03-20",
  detectedLabels: ["BEST BEFORE", "MFG"],
  confidenceScore: 95
}
```

