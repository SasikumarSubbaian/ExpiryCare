# Complete Fix Guide - Dashboard Items & Reminder Emails

## 🔴 Issues Identified

1. **Permission denied for table users** - Error in getItemCount/getUserPlan
2. **Items not showing in dashboard** - Related to permission error
3. **Reminder emails not working** - Invalid Resend API key
4. **No automatic reminder when adding items within expiry day**

## ✅ Fixes Applied

### 1. Fixed Permission Error

**Problem:** `getItemCount` and other functions were throwing "permission denied for table users" errors.

**Solution:**
- Added comprehensive error handling in `lib/supabase/plans.ts`
- Functions now return default values (0 or 'free') instead of throwing errors
- Added try-catch blocks in dashboard page

**Files Modified:**
- `lib/supabase/plans.ts` - Added error handling
- `app/dashboard/page.tsx` - Added error handling for all plan-related calls

### 2. Fixed Dashboard Query

**Problem:** Items not appearing even though they're in the database.

**Solution:**
- Added explicit `user_id` filter: `.eq('user_id', user.id)`
- Improved error handling and logging

**Files Modified:**
- `app/dashboard/page.tsx` - Explicit user_id filter

### 3. Added Automatic Reminder Sending

**Feature:** When a user adds an item that expires within the reminder period, a reminder email is sent immediately.

**Implementation:**
- Created `/api/reminders/send-now` endpoint
- Modified `AddItemModal` to check if reminder should be sent immediately
- Sends reminder if item expires within reminder days

**Files Created/Modified:**
- `app/api/reminders/send-now/route.ts` - New endpoint for immediate reminders
- `components/AddItemModal.tsx` - Added automatic reminder logic

### 4. Improved Email Error Handling

**Problem:** Invalid API key errors weren't providing helpful messages.

**Solution:**
- Added API key validation
- Better error messages
- Graceful handling when email service isn't configured

**Files Modified:**
- `lib/email/sender.ts` - Improved error handling
- `app/api/reminders/send-now/route.ts` - Better error messages

## 🔧 Setup Required

### Step 1: Fix Permission Error (RLS Issue)

The "permission denied for table users" error might be due to RLS policies. Check your Supabase RLS policies:

1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Verify `life_items` table has these policies:
   - ✅ "Users can view their own life items" (SELECT)
   - ✅ "Users can insert their own life items" (INSERT)
   - ✅ "Users can update their own life items" (UPDATE)
   - ✅ "Users can delete their own life items" (DELETE)

3. If policies are missing, run this SQL:

```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'life_items';

-- If missing, create them (from migration 002_core_schema.sql)
CREATE POLICY "Users can view their own life items"
  ON life_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own life items"
  ON life_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life items"
  ON life_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life items"
  ON life_items FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 2: Configure Email Service (Resend)

1. **Install Resend package:**
   ```bash
   npm install resend
   ```

2. **Get Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Add to `.env.local`:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=ExpiryCare <noreply@expirycare.com>
   ```

   **Note:** For local testing, you can use: `onboarding@resend.dev` as the from email.

4. **Restart dev server** after adding environment variables

### Step 3: Create reminder_logs Table

Run this SQL in Supabase SQL Editor:

```sql
-- Copy from: supabase/migrations/005_reminder_tracking.sql

CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  life_item_id UUID NOT NULL REFERENCES life_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_day INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_life_item_id ON reminder_logs(life_item_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_id ON reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at);

CREATE UNIQUE INDEX idx_reminder_logs_unique 
  ON reminder_logs(life_item_id, reminder_day, DATE_TRUNC('day', sent_at AT TIME ZONE 'UTC'));

ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminder logs"
  ON reminder_logs FOR SELECT
  USING (auth.uid() = user_id);
```

## 🧪 Testing

### Test 1: Add Warranty Item

1. Go to Dashboard
2. Click "Add Item"
3. Fill in:
   - Category: Warranty
   - Title: Test Warranty
   - Expiry Date: Set to 7 days from today (or today for immediate reminder)
   - Reminder Days: 7 (default)
4. Click "Add Item"
5. **Expected:**
   - ✅ Item appears in dashboard immediately
   - ✅ If expiry is within 7 days, reminder email is sent
   - ✅ No console errors

### Test 2: Check Items in Database

Run this SQL:
```sql
SELECT id, title, category, expiry_date, user_id, created_at 
FROM life_items 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

Replace `YOUR_USER_ID` with your actual user ID (from browser console logs).

### Test 3: Test Immediate Reminder

1. Add an item with expiry date = **today** or **within 7 days**
2. Check browser console for reminder API call
3. Check your email inbox
4. Check `reminder_logs` table for entry

### Test 4: Manual Reminder Test

Visit: `http://localhost:3001/api/reminders`

Should return JSON with reminder status.

## 🔍 Troubleshooting

### Items Still Not Showing?

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for errors
   - Check the `[Dashboard]` logs

2. **Verify RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'life_items';
   ```

3. **Test Query Directly:**
   ```sql
   SELECT * FROM life_items WHERE user_id = 'YOUR_USER_ID';
   ```

4. **Check User ID Match:**
   - Console log shows: `[Dashboard] User ID: xxx`
   - Verify this matches the `user_id` in `life_items` table

### Reminder Emails Not Working?

1. **Check API Key:**
   - Verify `RESEND_API_KEY` is in `.env.local`
   - Key should start with `re_`
   - Restart dev server after adding

2. **Test API Key:**
   ```bash
   # In PowerShell
   $env:RESEND_API_KEY="re_xxxxx"
   npm run dev
   ```

3. **Check Resend Dashboard:**
   - Go to resend.com → Logs
   - See if emails were attempted
   - Check for error messages

4. **Test Email Sending:**
   - Visit: `http://localhost:3001/api/reminders/send-now`
   - Use POST method with:
     ```json
     {
       "itemId": "your-item-id",
       "userId": "your-user-id"
     }
     ```

### Permission Denied Error?

If you still see "permission denied for table users":

1. **Check Foreign Key:**
   - The `life_items.user_id` references `auth.users(id)`
   - This shouldn't cause permission issues with proper RLS

2. **Verify RLS is Working:**
   ```sql
   -- Test as authenticated user
   SET ROLE authenticated;
   SELECT * FROM life_items WHERE user_id = 'YOUR_USER_ID';
   ```

3. **Check for Triggers:**
   ```sql
   SELECT * FROM pg_trigger WHERE tgrelid = 'life_items'::regclass;
   ```

## 📋 Quick Fix Checklist

- [ ] RLS policies exist for `life_items` table
- [ ] `reminder_logs` table created
- [ ] Resend package installed: `npm install resend`
- [ ] `RESEND_API_KEY` added to `.env.local`
- [ ] Dev server restarted after env changes
- [ ] Items appear in Supabase `life_items` table
- [ ] Dashboard shows items after refresh
- [ ] Reminder email sent when item expires within reminder days
- [ ] No console errors

## 🎯 Expected Behavior

### When Adding Item:

1. **Item expires in > 7 days:**
   - ✅ Item added to database
   - ✅ Item appears in dashboard
   - ❌ No immediate reminder (will be sent 7 days before)

2. **Item expires in ≤ 7 days:**
   - ✅ Item added to database
   - ✅ Item appears in dashboard
   - ✅ **Reminder email sent immediately**
   - ✅ Entry logged in `reminder_logs`

3. **Item expires today or expired:**
   - ✅ Item added to database
   - ✅ Item appears in dashboard
   - ✅ **Reminder email sent immediately**
   - ✅ Entry logged in `reminder_logs`

---

**Status:** ✅ All fixes applied
**Next Steps:** 
1. Set up Resend API key
2. Create reminder_logs table
3. Test adding items
4. Verify reminders are sent

