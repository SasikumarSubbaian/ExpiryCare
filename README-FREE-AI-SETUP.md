# Free AI Setup Guide - Hugging Face

This guide explains how to set up the FREE AI reasoning engine using Hugging Face Inference API.

## Overview

The ExpiryCare MVP now uses **100% FREE AI** powered by Hugging Face instead of OpenAI:
- ✅ No OpenAI API costs
- ✅ No paid API subscriptions
- ✅ Free tier available
- ✅ Works for warranty cards, medicine labels, insurance docs

## Architecture

1. **Browser OCR** → Tesseract.js extracts raw text
2. **Free AI Reasoning** → Hugging Face model analyzes text
3. **Confirmation Modal** → User reviews/edits extracted fields
4. **Save** → Only confirmed fields are saved

## Setup Instructions

### Step 1: Get Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up for a free account (or log in)
3. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token"
5. Name it: `expirycare-mvp`
6. Select "Read" permission
7. Copy the token (starts with `hf_`)

### Step 2: Add API Key to Environment

Add to your `.env.local` file:

```bash
HUGGINGFACE_API_KEY=hf_your_token_here
```

**Important:** Never commit this file to Git!

### Step 3: Verify Setup

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Upload a test document (warranty card, medicine label, etc.)

3. Check browser console for:
   - `[Free AI]` logs
   - Any errors

## API Route

The free AI reasoning engine is at:
- **Route:** `/api/ai/free-reasoning`
- **Method:** POST
- **Input:** `{ ocrText: string }`
- **Output:** `{ extracted: {...}, needsManualEntry: boolean }`

## Model Used

- **Model:** `google/flan-t5-base`
- **Type:** Text-to-text generation
- **Free Tier:** ✅ Yes
- **Rate Limits:** Check [Hugging Face docs](https://huggingface.co/docs/api-inference/rate-limits)

## Response Format

```json
{
  "extracted": {
    "expiryDate": "2025-12-31",
    "companyName": "Company Name",
    "productName": "Product Name",
    "category": "Warranty",
    "confidence": 85
  },
  "needsManualEntry": false
}
```

## Error Handling

The API always returns HTTP 200, even on errors:
- Missing API key → `needsManualEntry: true`
- Model loading (503) → `needsManualEntry: true` with error message
- Parse errors → `needsManualEntry: true`
- Low confidence (< 60) → `needsManualEntry: true`

**User is never blocked** - manual entry is always available.

## Troubleshooting

### Issue: "AI service not configured"
- **Solution:** Add `HUGGINGFACE_API_KEY` to `.env.local`

### Issue: "AI model is loading"
- **Solution:** Wait 10-30 seconds and try again (first request loads the model)

### Issue: Low confidence scores
- **Solution:** This is expected for complex documents. User can manually edit fields.

### Issue: Rate limit errors
- **Solution:** Free tier has rate limits. Wait a few minutes or upgrade to Pro.

## Next Steps

1. ✅ Get Hugging Face API key
2. ✅ Add to `.env.local`
3. ✅ Restart dev server
4. ✅ Test with a warranty card
5. ✅ Verify confirmation modal appears
6. ✅ Confirm fields can be edited

## Support

If you encounter issues:
1. Check browser console for `[Free AI]` logs
2. Check server logs for API errors
3. Verify API key is correct
4. Test with a simple document first

---

**Note:** This is an MVP implementation. For production, consider:
- Caching model responses
- Better prompt engineering
- Fine-tuning the model
- Using a larger model (if needed)

