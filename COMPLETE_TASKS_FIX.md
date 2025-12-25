# Complete Tasks Fix Guide

## ✅ Task 1: Plan-Based Item Display

**Status:** Items already display correctly for all plans (Free, Pro, Family)

Items are filtered by `user_id`, not by plan, so all items added by a user will be visible regardless of their current plan. The plan only affects:
- **Item limits** (how many items you can add)
- **Feature access** (medicine tracking, document upload, family sharing)

**To Test:**
1. Switch user plan using `/settings/plans` page
2. Add items under different plans
3. All items should be visible in dashboard (as long as you're logged in as that user)

**Code Changes:**
- Added plan logging to dashboard for debugging
- Items are filtered by `user_id` which works for all plans

## ✅ Task 2: File Download Fix

**Problem:** "Bucket not found" error when trying to download files.

**Solution:** 
1. Create the `documents` bucket in Supabase
2. Use signed URLs for secure downloads
3. Created API route `/api/documents/[path]` for secure file access

### Step 1: Create Storage Bucket

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Name: `documents`
4. Public: **false** (private bucket)
5. File size limit: 10MB (or as needed)
6. Allowed MIME types: `image/*`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Option B: Via SQL (Alternative)**
Run this SQL in Supabase SQL Editor:

```sql
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;
```

### Step 2: Set Up Storage Policies

Run this SQL in Supabase SQL Editor:

```sql
-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Storage bucket policy: Users can upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage bucket policy: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage bucket policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Step 3: Test File Download

1. Add an item with a document
2. Click "Download Document" link
3. File should download successfully

**Code Changes:**
- Created `/api/documents/[path]` route for secure file downloads
- Updated `ItemsSection` to use the new download route
- Uses signed URLs for secure access

## ✅ Task 3: Automatic Reminder Emails

**Problem:** Reminders only send when manually hitting `/api/reminders` URL.

**Solution:** Set up automatic reminder sending.

### Option A: Local Development (Node.js Script)

**Step 1: Install concurrently (optional, for running dev + cron together)**
```bash
npm install --save-dev concurrently
```

**Step 2: Run the cron script**
```bash
# In a separate terminal
npm run cron

# Or run dev server and cron together
npm run dev:with-cron
```

The script will call `/api/reminders` every 60 minutes (configurable via `REMINDER_INTERVAL_MINUTES` env var).

**Step 3: Configure (optional)**
Add to `.env.local`:
```env
REMINDER_URL=http://localhost:3001/api/reminders
REMINDER_INTERVAL_MINUTES=60
ENABLE_LOCAL_CRON=true
```

### Option B: Production (Vercel Cron)

Already configured in `vercel.json`:
- Runs daily at 9 AM UTC
- Automatically works when deployed to Vercel

### Option C: External Cron Service

1. Use [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com)
2. Set up a cron job:
   - URL: `https://your-domain.com/api/reminders`
   - Schedule: Daily at your preferred time (e.g., 9 AM)
   - Method: GET

### Option D: Windows Task Scheduler (Local)

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at your preferred time
4. Action: Start a program
5. Program: `curl` or `powershell`
6. Arguments: 
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3001/api/reminders" -Method GET
   ```

**Code Changes:**
- Created `scripts/setup-local-cron.js` for local development
- Added npm scripts: `cron` and `dev:with-cron`
- `vercel.json` already configured for production

## 🧪 Testing Checklist

### Task 1: Plan-Based Display
- [ ] Switch to Free plan, add items
- [ ] Switch to Pro plan, add items
- [ ] Switch to Family plan, add items
- [ ] All items should be visible in dashboard
- [ ] Check console logs show correct plan

### Task 2: File Download
- [ ] Create `documents` bucket in Supabase
- [ ] Run storage policies SQL
- [ ] Add item with document upload
- [ ] Click "Download Document"
- [ ] File should download successfully
- [ ] No "Bucket not found" error

### Task 3: Automatic Reminders
- [ ] Start local cron: `npm run cron`
- [ ] Wait for interval (or test manually)
- [ ] Check console for reminder API calls
- [ ] Verify emails are sent
- [ ] For production: Deploy to Vercel (cron runs automatically)

## 📋 Quick Setup Commands

```bash
# 1. Create storage bucket (run SQL in Supabase)
# See Task 2 above

# 2. Start dev server with automatic reminders
npm run dev:with-cron

# Or separately:
# Terminal 1:
npm run dev

# Terminal 2:
npm run cron
```

## 🔍 Troubleshooting

### File Download Issues
- **Bucket not found:** Make sure bucket `documents` exists in Supabase Storage
- **403 Forbidden:** Check storage policies are set up correctly
- **404 Not Found:** Verify file path format is correct

### Reminder Issues
- **Not sending automatically:** Make sure cron script is running
- **Rate limit errors:** Resend free tier has limits (2 requests/second)
- **Email not configured:** Check `RESEND_API_KEY` is set in `.env.local`

---

**Status:** ✅ All tasks fixed
**Next Steps:** 
1. Create storage bucket
2. Run storage policies SQL
3. Start cron script for automatic reminders

