# Production Deployment Guide

## ✅ Code Fixes Applied

All TypeScript compilation errors have been fixed:
- ✅ Fixed implicit 'any' type errors
- ✅ Fixed ES5 compatibility issues with Map/RegExp iteration
- ✅ All code is now production-ready

**Latest Commit:** `575ab51`

---

## 🔐 Required Environment Variables for Production

### **CRITICAL - Must Set in Vercel:**

#### 1. Supabase Configuration (Required)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to get:**
- Supabase Dashboard → Settings → API
- Copy Project URL, `anon` public key, and `service_role` secret key

**⚠️ Security Note:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS - keep it secret!

#### 2. Google Cloud Vision OCR (Required for Document Upload)
```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-vision.json
# OR use service account JSON directly in Vercel
```

**Alternative:** Upload `config/gcp-vision.json` to Vercel (if using file-based auth)

**Where to get:**
- Google Cloud Console → IAM & Admin → Service Accounts
- Create service account with Vision API enabled
- Download JSON key file

#### 3. Email Service - Resend (Required for Reminders)
```env
RESEND_API_KEY=re_your-api-key-here
RESEND_FROM_EMAIL=ExpiryCare <reminders@yourdomain.com>
```

**Where to get:**
- Sign up at https://resend.com
- Create API key in dashboard
- Verify domain (or use default `onboarding@resend.dev` for testing)

#### 4. Optional - AI Features (If using AI parsing)
```env
OPENAI_API_KEY=sk-your-openai-key  # Optional - for AI reasoning
GEMINI_API_KEY=your-gemini-key     # Optional - for Gemini Vision
HUGGINGFACE_API_KEY=your-hf-key   # Optional - for free reasoning
```

**Note:** These are optional. The app works without them using regex-based extraction.

---

## 📊 SQL Migrations Required for Production

### **Run these migrations in Supabase SQL Editor (in order):**

#### 1. Core Schema (002_core_schema.sql) - **REQUIRED**
Creates main tables: `profiles`, `life_items`, `family_members`

**Status:** ✅ Should already be run  
**Action:** Verify tables exist

#### 2. Update Categories (003_update_categories.sql) - **CRITICAL** ⚠️
Updates `life_items.category` constraint to include 'amc' and 'other'

**Status:** ⚠️ **MUST RUN** if categories don't include 'amc' and 'other'  
**Action:** Run this migration

```sql
-- Run this in Supabase SQL Editor:
ALTER TABLE life_items 
DROP CONSTRAINT IF EXISTS life_items_category_check;

ALTER TABLE life_items
ADD CONSTRAINT life_items_category_check 
CHECK (category IN ('warranty', 'insurance', 'amc', 'subscription', 'medicine', 'other'));
```

#### 3. User Plans (003_user_plans.sql) - **REQUIRED**
Creates `user_plans` table for plan management

**Status:** ⚠️ **MUST RUN** for plan features to work  
**Action:** Run if `user_plans` table doesn't exist

#### 4. Storage Setup (004_storage_setup.sql) - **REQUIRED** ⚠️
Sets up Supabase Storage bucket for document uploads

**Status:** ⚠️ **MUST RUN** for file uploads to work  
**Action:** Run this migration

#### 5. RLS Policies (011_ensure_rls_policies_production.sql) - **REQUIRED** ⚠️
Ensures proper Row Level Security policies

**Status:** ⚠️ **MUST RUN** for data security  
**Action:** Run this migration

---

## 🔍 Verification Checklist

### Before Deployment:

- [ ] All environment variables set in Vercel
- [ ] Supabase project created and configured
- [ ] SQL migrations run (especially 003_update_categories.sql)
- [ ] Storage bucket created (004_storage_setup.sql)
- [ ] RLS policies verified (011_ensure_rls_policies_production.sql)
- [ ] Google Cloud Vision API enabled and credentials configured
- [ ] Resend account created and API key added

### After Deployment:

- [ ] Test user signup/login
- [ ] Test adding expiry items
- [ ] Test document upload (OCR)
- [ ] Test category selection (verify 'amc' and 'other' work)
- [ ] Test free plan file upload limit (5 uploads)
- [ ] Verify reminders API endpoint works

---

## 🚀 Quick Setup Steps

### 1. Set Environment Variables in Vercel:
```
Vercel Dashboard → Your Project → Settings → Environment Variables
```

Add all variables listed above.

### 2. Run SQL Migrations in Supabase:
```
Supabase Dashboard → SQL Editor
```

Run migrations in this order:
1. `002_core_schema.sql` (if not already run)
2. `003_update_categories.sql` ⚠️ **CRITICAL**
3. `003_user_plans.sql` (if not already run)
4. `004_storage_setup.sql` ⚠️ **REQUIRED**
5. `011_ensure_rls_policies_production.sql` ⚠️ **REQUIRED**

### 3. Verify Storage Bucket:
```
Supabase Dashboard → Storage → Create Bucket
```

Bucket name: `documents` (or as configured in migration)

### 4. Deploy:
Vercel will auto-deploy after you push to `main` branch.

---

## 📝 Migration Files Location

All migration files are in: `supabase/migrations/`

**Critical migrations:**
- `003_update_categories.sql` - Add 'amc' and 'other' categories
- `004_storage_setup.sql` - Document storage
- `011_ensure_rls_policies_production.sql` - Security policies

---

## ⚠️ Common Issues

### "Category not allowed" error
**Solution:** Run `003_update_categories.sql` migration

### "File upload fails"
**Solution:** 
1. Run `004_storage_setup.sql` migration
2. Verify storage bucket exists in Supabase
3. Check Google Cloud Vision credentials

### "Free plan users can't upload files"
**Solution:** This is expected - free plan has 5 upload limit. Check `fileCount` tracking.

### "Reminders not working"
**Solution:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
2. Verify `RESEND_API_KEY` is set
3. Check Vercel cron job is configured (see `vercel.json`)

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Verify all environment variables are set
4. Verify all migrations are run

---

**Last Updated:** After fixing all TypeScript errors (Commit: 575ab51)

