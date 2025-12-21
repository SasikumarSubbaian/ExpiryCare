# Reminder Email Debugging Guide

Step-by-step guide to debug why reminder emails aren't being sent.

## Quick Debug Checklist

### 1. Check Environment Variables

**Verify these are set in `.env.local`:**
```bash
# Check if variables exist
cat .env.local | grep -E "SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY"
```

**Required variables:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (must start with `eyJ`)
- ✅ `RESEND_API_KEY` (must start with `re_`)
- ⚠️ `RESEND_FROM_EMAIL` (optional, defaults to `onboarding@resend.dev`)

**Test in code:**
```typescript
// Add this temporarily to app/api/reminders/route.ts
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
```

### 2. Check if Items Exist

**Verify you have items that should trigger reminders:**

```sql
-- Run this in Supabase SQL Editor
SELECT 
  id,
  title,
  expiry_date,
  reminder_days,
  user_id,
  created_at
FROM life_items
WHERE expiry_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY expiry_date;
```

**For immediate testing, create a test item:**
1. Go to your dashboard
2. Add an item with:
   - **Expiry Date:** Today or tomorrow
   - **Reminder Days:** `[0]` (for today) or `[1]` (for tomorrow)
   - Make sure you're logged in with a valid email

### 3. Check Reminder Logic

The reminder endpoint checks:
- `daysUntil == reminderDay` (for reminderDay > 0)
- `isToday(expiryDate) || daysUntil < 0` (for reminderDay = 0)

**Example:**
- Item expires **tomorrow** (1 day away)
- Reminder days: `[1]`
- ✅ Should send reminder

- Item expires **today** (0 days away)
- Reminder days: `[0]`
- ✅ Should send reminder

### 4. Test the Endpoint

**Start dev server:**
```bash
npm run dev
```

**Call the endpoint:**

**PowerShell (Windows):**
```powershell
# Method 1: Using Invoke-WebRequest (recommended)
Invoke-WebRequest -Uri "http://localhost:3000/api/reminders" -Method GET

# Method 2: Using curl alias (PowerShell)
curl http://localhost:3000/api/reminders

# Method 3: Get just the content
(Invoke-WebRequest -Uri "http://localhost:3000/api/reminders").Content

# Method 4: Parse JSON response
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/reminders"
$response.Content | ConvertFrom-Json
```

**Command Prompt / Git Bash:**
```bash
curl http://localhost:3000/api/reminders
```

**Or use the test script:**
```powershell
.\TEST_REMINDER.ps1
```

**Expected responses:**

**Success (with items):**
```json
{
  "message": "Processed 1 items",
  "reminders_found": 1,
  "reminders_sent": 1,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**No items found:**
```json
{
  "message": "No items found",
  "reminders_sent": 0,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error:**
```json
{
  "error": "Error message here"
}
```

### 5. Check Server Logs

**Look for these in your terminal where `npm run dev` is running:**

**Good signs:**
```
[AUDIT] Service role key accessed at: 2024-01-15T10:30:00.000Z
```

**Error signs:**
```
RESEND_API_KEY is not configured
SUPABASE_SERVICE_ROLE_KEY is not configured
Failed to send email: ...
Error sending email: ...
```

### 6. Check Resend Dashboard

1. Go to https://resend.com/emails
2. Check if emails were attempted
3. Look for:
   - ✅ **Delivered** - Email sent successfully
   - ⚠️ **Bounced** - Email address invalid
   - ❌ **Failed** - API error

### 7. Check Spam Folder

- Reminder emails might go to spam
- Check spam/junk folder
- If using `onboarding@resend.dev`, emails might be filtered

### 8. Verify User Email

**Check your user email in Supabase:**
```sql
-- Run in Supabase SQL Editor
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE id = 'your-user-id-here';
```

**Make sure:**
- Email is valid and confirmed
- Email matches what you're checking

## Common Issues & Solutions

### Issue 1: "No items found"

**Problem:** No items match the reminder criteria

**Solution:**
1. Create a test item with expiry date = today
2. Set reminder days to `[0]`
3. Run endpoint again

### Issue 2: "reminders_found: 0"

**Problem:** Items exist but don't match reminder logic

**Solution:**
- Check `reminder_days` array is set correctly
- Verify expiry date calculation
- For testing: Set expiry to today, reminder days to `[0]`

### Issue 3: "reminders_sent: 0" but "reminders_found: 1"

**Problem:** Email sending failed

**Check:**
- `RESEND_API_KEY` is correct
- Resend account is active
- Email address is valid
- Check server logs for error messages

### Issue 4: "SUPABASE_SERVICE_ROLE_KEY is not configured"

**Problem:** Environment variable not set

**Solution:**
1. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
2. Restart dev server: `npm run dev`

### Issue 5: "RESEND_API_KEY is not configured"

**Problem:** Resend API key not set

**Solution:**
1. Sign up at https://resend.com
2. Create API key
3. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   ```
4. Restart dev server

### Issue 6: Email sent but not received

**Check:**
- Spam folder
- Email address is correct
- Resend dashboard shows "Delivered"
- Email provider isn't blocking

## Step-by-Step Testing

### Test 1: Basic Setup

1. **Verify environment variables:**
   ```bash
   # In project root
   cat .env.local
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Check endpoint responds:**
   ```bash
   curl http://localhost:3000/api/reminders
   ```

### Test 2: Create Test Item

1. **Log in to dashboard**
2. **Add item:**
   - Title: "Test Reminder"
   - Category: Warranty
   - Expiry Date: **Today's date**
   - Reminder Days: **Select `0` (on expiry day)**
   - Notes: Optional

3. **Verify item created:**
   - Should appear in dashboard
   - Check expiry date is correct

### Test 3: Run Reminder Endpoint

1. **Call endpoint:**
   ```bash
   curl http://localhost:3000/api/reminders
   ```

2. **Check response:**
   - Should show `reminders_found: 1` or more
   - Should show `reminders_sent: 1` or more

3. **Check email:**
   - Check inbox
   - Check spam folder
   - Check Resend dashboard

### Test 4: Verify Reminder Log

1. **Check `reminder_logs` table:**
   ```sql
   SELECT * FROM reminder_logs
   ORDER BY sent_at DESC
   LIMIT 5;
   ```

2. **Should see:**
   - Entry for your test item
   - `reminder_day: 0`
   - Recent `sent_at` timestamp

## Enhanced Debugging

### Add Debug Logging

Temporarily add this to `app/api/reminders/route.ts`:

```typescript
// After line 65 (after checking items)
console.log('Items found:', items.length)
console.log('Items:', JSON.stringify(items, null, 2))

// After line 173 (after building remindersToSend)
console.log('Reminders to send:', remindersToSend.length)
console.log('Reminders:', JSON.stringify(remindersToSend, null, 2))

// In the email sending loop (after line 180)
console.log(`Sending email to: ${reminder.userEmail}`)
console.log(`Item: ${reminder.title}, Days: ${reminder.daysUntil}`)
```

### Check Resend Response

Add logging to `lib/email/sender.ts`:

```typescript
// After line 36
console.log('Resend response:', JSON.stringify(result, null, 2))
```

## Quick Test Script

Create `test-reminder.sh`:

```bash
#!/bin/bash
echo "Testing reminder endpoint..."
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Dev server not running. Start with: npm run dev"
  exit 1
fi

# Call endpoint
echo "Calling /api/reminders..."
RESPONSE=$(curl -s http://localhost:3000/api/reminders)
echo "$RESPONSE" | jq .

# Check for errors
if echo "$RESPONSE" | grep -q "error"; then
  echo ""
  echo "❌ Error found in response"
  exit 1
fi

echo ""
echo "✅ Endpoint responded successfully"
```

Run with: `bash test-reminder.sh`

## Still Not Working?

1. **Check all environment variables are set**
2. **Verify Resend API key is valid**
3. **Check Supabase service role key is correct**
4. **Verify test item has correct expiry date and reminder days**
5. **Check server logs for detailed error messages**
6. **Verify email address in Supabase Auth is correct**
7. **Check Resend dashboard for delivery status**

---

**Last Updated:** Debugging guide

