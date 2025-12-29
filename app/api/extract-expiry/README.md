# Extract Expiry API

Combined OCR + AI parsing endpoint that extracts structured expiry data from uploaded documents.

## Endpoint

`POST /api/extract-expiry`

## Features

- ✅ Accepts file uploads (JPG, PNG, WEBP, PDF)
- ✅ Runs OCR to extract raw text
- ✅ Sends OCR text to AI parser for structured extraction
- ✅ Returns merged response with both rawText and parsedData
- ✅ Fallback: Returns raw OCR if AI parsing fails
- ✅ Timeout handling for both OCR and AI parsing
- ✅ Comprehensive logging for OCR accuracy improvement

## Request

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (required): File to process (JPG, PNG, WEBP, PDF, max 10MB)
- `category` (optional): Product category (`medicine`, `food`, `warranty`, `insurance`, `subscription`)

## Response

**Success (200):**
```json
{
  "rawText": "Paracetamol 500mg EXP: 31/12/2024 BATCH: ABC123",
  "parsedData": {
    "productName": "Paracetamol 500mg",
    "expiryDate": "2024-12-31",
    "manufacturingDate": null,
    "batchNumber": "ABC123",
    "confidenceScore": 95,
    "detectedLabels": ["EXP", "BATCH"]
  },
  "ocrConfidence": 85.5,
  "processingTime": 3500,
  "errors": [] // Optional, only if partial failures
}
```

**Partial Success (200 with errors):**
If AI parsing fails but OCR succeeds:
```json
{
  "rawText": "Some text extracted from OCR",
  "parsedData": {
    "productName": null,
    "expiryDate": null,
    "manufacturingDate": null,
    "batchNumber": null,
    "confidenceScore": 0,
    "detectedLabels": []
  },
  "ocrConfidence": 75.0,
  "processingTime": 2500,
  "errors": ["AI parsing failed: API timeout"]
}
```

**Error (400/500):**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details"
}
```

## Timeout Configuration

- **OCR Timeout:** 30 seconds
- **AI Parse Timeout:** 15 seconds
- **Total Timeout:** 45 seconds

## Fallback Behavior

1. **OCR fails:** Returns error (500)
2. **OCR succeeds, AI fails:** Returns raw OCR text with empty parsedData (200)
3. **Both succeed:** Returns full response with rawText and parsedData (200)

## Usage Example

```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('category', 'medicine') // optional

const response = await fetch('/api/extract-expiry', {
  method: 'POST',
  body: formData,
})

const result = await response.json()

if (result.rawText) {
  console.log('Raw OCR text:', result.rawText)
  console.log('Parsed data:', result.parsedData)
  console.log('OCR confidence:', result.ocrConfidence)
  console.log('Processing time:', result.processingTime, 'ms')
}
```

## Logging

The endpoint logs detailed metrics for OCR accuracy improvement:

- File type and size
- Text length extracted
- OCR confidence score
- Processing time
- Low confidence warnings
- Slow processing warnings
- Empty text warnings

Check server console for `[OCR Metrics]` logs.

## Error Codes

- `AUTH_ERROR`: User not authenticated
- `INVALID_FILE`: No file provided
- `UNSUPPORTED_FILE_TYPE`: File type not supported
- `FILE_TOO_LARGE`: File exceeds 10MB
- `OCR_FAILURE`: OCR processing failed
- `PROCESSING_ERROR`: General processing error

