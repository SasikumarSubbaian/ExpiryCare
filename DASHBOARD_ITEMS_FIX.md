# Dashboard Items & Reminder Email Fix

## ✅ Fixes Applied

### 1. Dashboard Items Not Showing - FIXED

**Problem:** Warranty items added via Pro plan were not appearing in the dashboard.

**Root Cause:** The dashboard query was relying solely on RLS (Row Level Security) policies without an explicit `user_id` filter.

**Fix Applied:**
- Updated `app/dashboard/page.tsx` to explicitly filter by `user_id`:
  ```typescript
  .eq('user_id', user.id)  // ✅ Added explicit filter
  ```

**Files Modified:**
- `app/dashboard/page.tsx` - Added explicit user_id filter to query

### 2. Reminder Emails Not Working - SETUP REQUIRED

**Problem:** Reminder emails are not being sent.

**Requirements:**
1. `reminder_logs` table must exist
2. Email service (Resend) must be configured
3. Cron job must be set up (for automatic reminders)

## 🔧 Setup Instructions

### Step 1: Create reminder_logs Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and run: supabase/migrations/005_reminder_tracking.sql
```

Or manually create:

```sql
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

### Step 2: Install Resend Package

```bash
npm install resend
```

### Step 3: Configure Email Service

1. Sign up at [resend.com](https://resend.com) (free tier available)
2. Get your API key from the dashboard
3. Add to `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=ExpiryCare <noreply@expirycare.com>
```

**Note:** For local testing, you can use Resend's test domain: `onboarding@resend.dev`

### Step 4: Test Reminder API

1. **Manual Test (Local):**
   - Visit: `http://localhost:3001/api/reminders`
   - Check the response for any errors
   - Check your email inbox

2. **Check Reminder Timing:**
   - Default reminder for warranty items: 7 days before expiry
   - Reminders are sent when: `daysUntil === reminderDay`
   - Example: If item expires in 7 days, reminder is sent today

### Step 5: Set Up Automatic Reminders (Production)

**Option A: Vercel Cron (Recommended)**
- Already configured in `vercel.json`
- Will run daily at 9 AM UTC when deployed

**Option B: External Cron Service**
- Use [cron-job.org](https://cron-job.org) or similar
- Set to call: `https://your-domain.com/api/reminders`
- Schedule: Daily at your preferred time

## 🧪 Testing Checklist

### Dashboard Items:
- [ ] Add a warranty item
- [ ] Item appears in dashboard immediately
- [ ] Item appears in correct category section (Expiring Soon/Expired/Active)
- [ ] No console errors
- [ ] Item count in Plan Display updates

### Reminder Emails:
- [ ] `reminder_logs` table exists
- [ ] Resend package installed
- [ ] `RESEND_API_KEY` configured
- [ ] Test API endpoint: `http://localhost:3001/api/reminders`
- [ ] Check email inbox (and spam folder)
- [ ] Verify reminder_logs table has entries

## 🔍 Troubleshooting

### Items Still Not Showing?

1. **Check Browser Console:**
   - Open DevTools (F12) → Console tab
   - Look for errors when adding items
   - Check Network tab for failed requests

2. **Verify Database:**
   ```sql
   SELECT * FROM life_items 
   WHERE user_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC;
   ```

3. **Check RLS Policies:**
   - Supabase Dashboard → Authentication → Policies
   - Verify `life_items` table has SELECT and INSERT policies

4. **Hard Refresh:**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Reminders Not Working?

1. **Check reminder_logs table:**
   ```sql
   SELECT * FROM reminder_logs ORDER BY sent_at DESC LIMIT 10;
   ```

2. **Verify email config:**
   - Check `.env.local` has `RESEND_API_KEY`
   - Verify key is valid in Resend dashboard

3. **Test API manually:**
   ```bash
   curl http://localhost:3001/api/reminders
   ```

4. **Check reminder timing:**
   - Reminders only send when `daysUntil === reminderDay`
   - For 7-day reminder, item must expire in exactly 7 days
   - To test: Set expiry date to 7 days from today

5. **Check Resend dashboard:**
   - Go to resend.com → Logs
   - See if emails were attempted
   - Check for error messages

## 📝 Quick SQL Queries

### Check your items:
```sql
SELECT id, title, category, expiry_date, reminder_days, user_id, created_at 
FROM life_items 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### Check reminder logs:
```sql
SELECT rl.*, li.title, li.expiry_date
FROM reminder_logs rl
JOIN life_items li ON rl.life_item_id = li.id
WHERE rl.user_id = 'YOUR_USER_ID'
ORDER BY rl.sent_at DESC
LIMIT 10;
```

### Check user plan:
```sql
SELECT * FROM user_plans WHERE user_id = 'YOUR_USER_ID';
```

## ✅ Expected Behavior

### After Adding Item:
1. Modal closes
2. Success toast appears
3. Dashboard refreshes automatically
4. New item appears in appropriate section:
   - **Expiring Soon**: Items expiring within 30 days
   - **Expired**: Items that have expired
   - **Active**: Items with more than 30 days remaining

### Reminder Emails:
- Sent based on `reminder_days` array
- Default for warranty: `[7]` (7 days before)
- Logged in `reminder_logs` table
- Prevents duplicate sends on same day

---

**Status:** ✅ Dashboard query fixed
**Next Steps:** Set up email service and reminder_logs table for email reminders
