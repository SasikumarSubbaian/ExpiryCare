# Google ML Kit OCR Service

This service implements Google Cloud Vision API OCR (web equivalent of Google ML Kit) for extracting raw text from images and PDFs.

## Features

- ✅ **Raw text extraction only** - No parsing or guessing
- ✅ **Printed text support** - Optimized for printed documents
- ✅ **Handwritten text support** - Handles handwritten content
- ✅ **Line breaks preserved** - Maintains original text formatting
- ✅ **PDF support** - Processes PDF files directly
- ✅ **Image support** - JPEG, PNG, WEBP formats

## Setup

### 1. Install Dependencies

```bash
npm install @google-cloud/vision
```

### 2. Get Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Cloud Vision API**:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Cloud Vision API"
   - Click **Enable**

4. Create a Service Account:
   - Go to **IAM & Admin** → **Service Accounts**
   - Click **Create Service Account**
   - Give it a name (e.g., "ocr-service")
   - Grant role: **Cloud Vision API User**
   - Click **Create Key** → **JSON**
   - Download the JSON key file

### 3. Configure Environment Variables

**Option A: Credentials File Path**

```env
GOOGLE_CLOUD_CREDENTIALS_PATH=/path/to/your/service-account-key.json
```

**Option B: Credentials JSON String**

```env
GOOGLE_CLOUD_CREDENTIALS_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

### 4. Enable ML Kit OCR

Set the OCR provider environment variable:

```env
OCR_PROVIDER=mlkit
```

**Default:** `tesseract` (uses Tesseract.js)

## Usage

### In API Routes

```typescript
import { extractTextWithMLKit, isMLKitConfigured } from '@/lib/ocr/mlkit-service'

// Check if ML Kit is configured
if (isMLKitConfigured()) {
  const result = await extractTextWithMLKit(file)
  console.log('Raw text:', result.rawText)
  console.log('Confidence:', result.confidence)
}
```

### Response Format

```typescript
{
  rawText: string      // Raw text with line breaks preserved
  confidence: number    // Confidence score (0-100)
}
```

## How It Works

1. **Image Processing:**
   - Preprocesses images (resize if needed, convert to PNG)
   - Uses `textDetection` API for images

2. **PDF Processing:**
   - Uses `documentTextDetection` API for better PDF handling
   - Processes all pages automatically
   - Falls back to regular text detection if needed

3. **Text Extraction:**
   - Extracts raw text only (no parsing)
   - Preserves line breaks and formatting
   - Returns plain text string

## Limitations

- **File Size:** Maximum 20MB per file (Google Cloud Vision API limit)
- **Cost:** Google Cloud Vision API charges per request (see [pricing](https://cloud.google.com/vision/pricing))
- **Rate Limits:** Subject to Google Cloud API rate limits

## Error Handling

The service throws errors with descriptive messages:
- `Google Cloud credentials not configured` - Missing credentials
- `Failed to initialize Google Cloud Vision client` - Invalid credentials
- `Google Cloud Vision OCR failed` - OCR processing error
- `PDF OCR failed` - PDF-specific error

## Comparison: ML Kit vs Tesseract

| Feature | ML Kit (Cloud Vision) | Tesseract |
|---------|----------------------|-----------|
| **Accuracy** | High (Google's ML models) | Good |
| **Speed** | Fast (cloud-based) | Slower (local) |
| **Handwriting** | Excellent | Good |
| **PDF Support** | Native | Requires conversion |
| **Cost** | Pay per use | Free |
| **Offline** | No (requires internet) | Yes |
| **Setup** | Requires Google Cloud | Simple (npm install) |

## Troubleshooting

### "Google Cloud credentials not configured"

- Check that `GOOGLE_CLOUD_CREDENTIALS_PATH` or `GOOGLE_CLOUD_CREDENTIALS_JSON` is set
- Verify the credentials file path is correct
- Ensure the JSON credentials are valid

### "Failed to initialize Google Cloud Vision client"

- Verify the service account has the **Cloud Vision API User** role
- Check that the Cloud Vision API is enabled in your Google Cloud project
- Ensure the credentials JSON is valid and not corrupted

### "OCR processing failed"

- Check file size (max 20MB)
- Verify file format is supported (JPEG, PNG, WEBP, PDF)
- Check Google Cloud API quotas and billing

## Cost Considerations

Google Cloud Vision API pricing (as of 2024):
- **First 1,000 units/month:** Free
- **1,001-5,000,000 units:** $1.50 per 1,000 units
- **5,000,001+ units:** $0.60 per 1,000 units

1 unit = 1 image or 1 page of PDF

See [official pricing](https://cloud.google.com/vision/pricing) for current rates.

