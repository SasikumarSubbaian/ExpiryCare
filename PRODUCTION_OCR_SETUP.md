# Production OCR Setup Guide

This document outlines all the OCR and related features that have been implemented and the steps needed to deploy them to production.

## ✅ Implemented Features

### Task 0: Separate Add Items and File Upload Functionality
- ✅ Add items functionality works independently
- ✅ File upload/OCR functionality works independently
- ✅ Both can function separately without dependencies

### Task 1: OCR + Google Vision Integration
- ✅ Google Vision OCR service (`lib/ocr/googleVision.ts`)
- ✅ Image preprocessing with sharp (auto-rotate, resize, grayscale, contrast enhancement)
- ✅ Updated OCR API route (`app/api/ocr/extract/route.ts`)

### Task 2: Category-Aware Extractors
- ✅ Expiry date extraction with confidence scoring (`lib/ocr/expiryExtractor.ts`)
- ✅ Category-specific field extractors:
  - Warranty: productName, companyName
  - Insurance: policyType, insurerName
  - AMC: serviceType, providerName
  - Subscription: serviceName, planType
  - Medicine: medicineName, brandName
  - Other: documentType (safe mode)
- ✅ PII protection (never extracts confidential data)

### Task 3: Category Prediction & Schemas
- ✅ Category prediction from OCR text (`lib/ocr/categoryPredictor.ts`)
- ✅ Category schemas defining allowed/forbidden fields (`lib/ocr/categorySchemas.ts`)
- ✅ Dynamic confirmation popup UI (`components/OCRConfirmationModal.tsx`)

### Task 4: Pricing Logic Enforcement
- ✅ Document upload limits (Free: 5, Pro: unlimited)
- ✅ OCR call limits (Free: 5 total, Pro: 10/day, 200/month)
- ✅ Item count limits (Free: 10, Pro: unlimited)
- ✅ Backend enforcement in API routes (`lib/ocr/pricingLogic.ts`)

### Task 5: Abuse Protection
- ✅ File validation (size, type, dimensions)
- ✅ Rate limiting (5 OCR requests/min/user)
- ✅ Duplicate file detection (SHA-256 hashing)
- ✅ OCR usage tracking (`lib/ocr/abuseProtection.ts`)

### Task 6: OCR Accuracy Boosting
- ✅ Image preprocessing (sharp):
  - Auto-rotate based on EXIF
  - Resize to max 2000px
  - Grayscale conversion
  - Contrast normalization
  - Edge sharpening
- ✅ Text normalization (fix OCR errors: O→0, l→1)
- ✅ Confidence scoring (High/Medium/Low)
- ✅ User confirmation required for low confidence

## 📋 Required Environment Variables

Add these to your **Vercel** (or production) environment:

```env
# Google Vision API (Choose ONE method)

# Option 1: Service Account (Recommended for production)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
# OR set the JSON content directly (Vercel doesn't support file paths)
GOOGLE_VISION_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}

# Option 2: API Key (Simpler, but less secure)
GOOGLE_VISION_API_KEY=your-api-key-here

# Existing Supabase variables (should already be set)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Getting Google Vision API Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable Vision API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"
4. **Create credentials**:
   - **Option A (Service Account - Recommended)**:
     - Go to "APIs & Services" > "Credentials"
     - Click "Create Credentials" > "Service Account"
     - Create service account and download JSON key
     - For Vercel: Copy JSON content and set as `GOOGLE_VISION_CREDENTIALS` env var
   - **Option B (API Key - Simpler)**:
     - Go to "APIs & Services" > "Credentials"
     - Click "Create Credentials" > "API Key"
     - Copy the key and set as `GOOGLE_VISION_API_KEY` env var
     - **Important**: Restrict the API key to Vision API only

## 🗄️ Database Migrations

Run this migration in your **Supabase SQL Editor**:

### Migration: `012_create_ocr_logs.sql`

```sql
-- Create OCR logs table for tracking OCR usage and abuse protection
CREATE TABLE IF NOT EXISTS ocr_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_hash TEXT NOT NULL, -- SHA-256 hash for duplicate detection
  category TEXT, -- Predicted or user-selected category
  success BOOLEAN NOT NULL DEFAULT true,
  ocr_result JSONB, -- Store OCR result for duplicate reuse
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_id ON ocr_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_file_hash ON ocr_logs(file_hash);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_created_at ON ocr_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_created ON ocr_logs(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE ocr_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own OCR logs" ON ocr_logs;
DROP POLICY IF EXISTS "Users can insert their own OCR logs" ON ocr_logs;

-- Create policy: Users can only see their own OCR logs
CREATE POLICY "Users can view their own OCR logs"
  ON ocr_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own OCR logs
CREATE POLICY "Users can insert their own OCR logs"
  ON ocr_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Steps to run migration:**
1. Go to Supabase Dashboard
2. Navigate to "SQL Editor"
3. Create a new query
4. Paste the SQL above
5. Click "Run"

## 📦 Dependencies

The following packages have been added to `package.json`:

```json
{
  "@google-cloud/vision": "^4.0.1",
  "sharp": "^0.33.2"
}
```

**Install dependencies:**
```bash
npm install
```

## 🚀 Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables in Vercel
1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add all required environment variables (see above)
4. **Important**: Set them for "Production", "Preview", and "Development" environments

### 3. Run Database Migration
- Run the SQL migration in Supabase (see above)

### 4. Deploy to Production
```bash
git add .
git commit -m "Add production OCR system with Google Vision"
git push origin main
```

Vercel will automatically deploy. Wait for deployment to complete.

### 5. Verify Deployment
1. **Test OCR functionality**:
   - Log in to your production site
   - Try adding an item with document upload
   - Verify OCR extraction works
   - Check confirmation modal appears

2. **Test limits**:
   - Free plan: Try uploading 6th document (should be blocked)
   - Pro plan: Verify unlimited uploads work

3. **Check logs**:
   - Check Vercel function logs for any errors
   - Check Supabase `ocr_logs` table for entries

## 🔍 Testing Checklist

- [ ] Google Vision API credentials configured
- [ ] Database migration `012_create_ocr_logs.sql` executed
- [ ] Environment variables set in Vercel
- [ ] Dependencies installed (`npm install`)
- [ ] OCR extraction works for warranty documents
- [ ] OCR extraction works for insurance documents
- [ ] OCR extraction works for medicine documents
- [ ] OCR extraction works for subscription documents
- [ ] OCR extraction works for AMC documents
- [ ] OCR extraction works for "Other" category (safe mode)
- [ ] Confirmation modal appears after OCR
- [ ] Free plan document limit (5) enforced
- [ ] Free plan OCR limit (5) enforced
- [ ] Pro plan unlimited uploads work
- [ ] Duplicate file detection works
- [ ] Rate limiting works (5 requests/min)

## 🐛 Troubleshooting

### Error: "Google Vision client not initialized"
- **Solution**: Check that `GOOGLE_VISION_API_KEY` or `GOOGLE_VISION_CREDENTIALS` is set in Vercel
- Verify the API key/credentials are correct
- Ensure Vision API is enabled in Google Cloud Console

### Error: "OCR limit reached"
- **Solution**: This is expected behavior for free plan users
- Free plan: 5 OCR calls total
- Pro plan: 10 calls/day, 200 calls/month
- Check `ocr_logs` table to see usage

### Error: "Rate limit exceeded"
- **Solution**: Wait 1 minute and try again
- Rate limit: 5 OCR requests per minute per user

### OCR not extracting data
- **Solution**: 
  - Check image quality (should be clear, high contrast)
  - Verify document is in English
  - Check Vercel function logs for errors
  - Try a different document format (PNG vs JPG)

### Database errors
- **Solution**: 
  - Verify migration `012_create_ocr_logs.sql` was run
  - Check RLS policies are created
  - Verify user has proper permissions

## 📝 Notes

1. **Free Plan Users**: Can upload 5 documents total. After that, they'll see upgrade prompts.

2. **Pro Plan Users**: Have unlimited document uploads but are limited to:
   - 10 OCR calls per day
   - 200 OCR calls per month

3. **Duplicate Detection**: If the same file is uploaded twice, the system will reuse the previous OCR result (no additional API call).

4. **Confidence Scoring**: 
   - High confidence: Auto-filled, user can edit
   - Medium confidence: Shown in confirmation modal
   - Low confidence: Requires user confirmation

5. **PII Protection**: The system never extracts or stores:
   - Names
   - ID numbers (Aadhaar, PAN, etc.)
   - Addresses
   - Phone numbers
   - Other personal information

## 🎯 Next Steps After Deployment

1. **Monitor Usage**: Check `ocr_logs` table regularly to track usage
2. **Monitor Costs**: Google Vision API charges per page processed
3. **Optimize**: Consider caching frequently used documents
4. **User Feedback**: Collect feedback on OCR accuracy and improve extractors

## 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Check Supabase logs
3. Verify all environment variables are set
4. Verify database migration was run successfully

