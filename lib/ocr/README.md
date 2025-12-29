# OCR Service

A clean, focused OCR service for extracting raw text from images and PDFs.

## Features

- ✅ Accepts JPG, PNG, and PDF files
- ✅ Image preprocessing with Sharp:
  - Resize to optimal size
  - Grayscale conversion
  - Contrast normalization
- ✅ PDF to image conversion
- ✅ Tesseract.js OCR integration
- ✅ Returns raw text and confidence score
- ✅ Comprehensive error handling
- ✅ TypeScript types

## API Endpoint

### `POST /api/ocr`

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (File object)

**Response:**
```typescript
{
  rawText: string,
  confidence: number
}
```

**Error Response:**
```typescript
{
  error: string,
  code: 'UNSUPPORTED_FILE_TYPE' | 'OCR_FAILURE' | 'FILE_TOO_LARGE' | 'INVALID_FILE' | 'PROCESSING_ERROR',
  details?: string
}
```

## Usage Example

```typescript
const formData = new FormData()
formData.append('file', file)

const response = await fetch('/api/ocr', {
  method: 'POST',
  body: formData,
})

const result = await response.json()
// { rawText: "...", confidence: 85.5 }
```

## File Limits

- **Max file size:** 10MB
- **Supported formats:** JPG, PNG, WEBP, PDF
- **Processing timeout:** 30 seconds

## Architecture

```
lib/ocr/
├── types.ts              # TypeScript types
├── image-preprocessing.ts # Sharp image preprocessing
├── pdf-converter.ts      # PDF to image conversion
├── tesseract-service.ts  # Tesseract OCR wrapper
└── index.ts              # Exports

app/api/ocr/
└── route.ts              # Main API endpoint
```

## Error Handling

The service handles:
- Unsupported file types
- Files too large
- OCR processing failures
- PDF conversion errors
- Image preprocessing errors
- Timeout errors

All errors return structured error responses with appropriate HTTP status codes.

