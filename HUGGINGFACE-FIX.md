# Hugging Face API Fix Guide

## Current Issue: 403 Permission Error

The error `"This authentication method does not have sufficient permissions to call Inference Providers"` indicates that your Hugging Face API key doesn't have the right permissions.

## Solution Options

### Option 1: Fix API Key Permissions (Recommended)

1. Go to [Hugging Face Settings → Access Tokens](https://huggingface.co/settings/tokens)
2. Find your token or create a new one
3. **Important:** Make sure the token has **"Read"** permission (minimum)
4. For inference API, you may need to enable it in your account settings

### Option 2: Use Inference API Directly

The code has been updated to use the standard inference API endpoint:
- Endpoint: `https://api-inference.huggingface.co/models/google/flan-t5-base`
- This should work with a standard Read token

### Option 3: Alternative Free AI Models

If Hugging Face continues to have issues, consider these alternatives:

1. **Groq API** (Free tier available)
   - Very fast inference
   - Free tier: 30 requests/minute
   - Models: Llama 3, Mixtral

2. **Together AI** (Free tier available)
   - Free tier available
   - Multiple models

3. **Local Model** (100% free, no API)
   - Use Transformers.js in browser
   - No API calls needed
   - Slower but completely free

## Testing

After updating your API key:

1. Restart dev server
2. Upload a test document
3. Check console for `[Free AI]` logs
4. Verify no 403 errors

## Current Status

- ✅ Endpoint updated to use standard inference API
- ✅ Better error handling for 403 errors
- ⚠️ Need to verify API key permissions

## Next Steps

1. Check your Hugging Face token permissions
2. If still getting 403, try creating a new token with "Read" permission
3. Test the upload flow again
4. If issues persist, we can switch to an alternative free AI provider

