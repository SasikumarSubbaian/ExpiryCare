# Reminder System Testing Guide

Complete guide to testing the ExpiryCare reminder email system.

## Prerequisites

Before testing, ensure:
- [ ] All environment variables are set (see `ENV_VARIABLES.md`)
- [ ] Database migrations are run (especially `005_reminder_tracking.sql`)
- [ ] Resend account is set up and verified
- [ ] At least one user account exists with a valid email

## Testing Methods

### Method 1: Manual API Endpoint Test (Recommended)

**Step 1: Create a Test Item**
1. Log in to your dashboard
2. Click "Add Item"
3. Fill in the form:
   - **Title:** "Test Reminder Item"
   - **Category:** Any (e.g., Warranty)
   - **Expiry Date:** Tomorrow's date (or today for immediate test)
   - **Reminder Days:** Select `7` (or `0` for today)
   - **Notes:** Optional
4. Click "Add Item"

**Step 2: Test the Reminder Endpoint**

**Local Development:**
```bash
# Start dev server
npm run dev

# In another terminal, test the endpoint
curl http://localhost:3000/api/reminders
```

Or visit in browser: `http://localhost:3000/api/reminders`

**Production:**
```bash
curl https://your-domain.com/api/reminders
```

Or visit: `https://your-domain.com/api/reminders`

**Expected Response:**
```json
{
  "success": true,
  "remindersSent": 1,
  "message": "Reminder check completed"
}
```

**Step 3: Verify Email**
- [ ] Check your email inbox
- [ ] Check spam folder if not in inbox
- [ ] Email should have:
  - Subject: "Reminder: [Item Title] expires [in X days / today]"
  - Friendly HTML formatting
  - Item details (title, category, expiry date)
  - Days until/since expiry

**Step 4: Check Reminder Logs**
1. Go to Supabase Dashboard → Table Editor
2. Open `reminder_logs` table
3. Verify entry exists:
   - `life_item_id` matches your test item
   - `reminder_day` matches the reminder day you set
   - `sent_at` is recent timestamp

**Step 5: Test Duplicate Prevention**
1. Run the reminder endpoint again immediately
2. Verify NO duplicate email is sent
3. Check `reminder_logs` - should still have only one entry

### Method 2: Test with Different Reminder Days

**Test Multiple Reminder Days:**
1. Create item with expiry date 8 days from now
2. Set reminder days to `[7, 3, 0]` (7 days, 3 days, and on expiry day)
3. Run reminder endpoint
4. **Day 1:** Should send reminder for 7 days (1 day before 7-day mark)
5. **Day 5:** Should send reminder for 3 days (1 day before 3-day mark)
6. **Day 8:** Should send reminder for 0 days (on expiry day)

**Note:** For immediate testing, set expiry to today and reminder days to `[0]`

### Method 3: Test Expired Items

1. Create item with expiry date in the past
2. Set reminder days to `[0]` (on expiry day)
3. Run reminder endpoint
4. Should send email with "expired X days ago" message

### Method 4: Test Medicine Items

1. Create medicine item:
   - Category: Medicine
   - Medicine Name: "Test Medicine"
   - Person: Select "Self" or "Dad" or "Mom"
   - Expiry Date: Tomorrow
   - Reminder Days: Default `[30, 7, 0]`
2. Run reminder endpoint
3. Verify email includes person name in the message

### Method 5: Test Family Sharing Reminders

1. User A: Create item and invite User B as family member
2. User B: Sign up with invited email
3. Set item expiry to tomorrow with reminder day `[0]`
4. Run reminder endpoint
5. Verify BOTH User A and User B receive reminder emails

## Automated Testing (Cron Job)

### Vercel Cron

**Verify Setup:**
1. Check `vercel.json` exists with cron configuration ✅
2. Deploy to Vercel
3. Go to Vercel Dashboard → Your Project → Cron Jobs
4. Verify cron job is scheduled:
   - **Path:** `/api/reminders`
   - **Schedule:** `0 9 * * *` (9 AM UTC daily)

**Test Cron Execution:**
1. Wait for scheduled time (or manually trigger in Vercel dashboard)
2. Check Vercel logs for execution
3. Verify emails were sent
4. Check `reminder_logs` table for new entries

### External Cron Service

**Using cron-job.org:**
1. Sign up at https://cron-job.org
2. Create new cron job:
   - **URL:** `https://your-domain.com/api/reminders`
   - **Schedule:** Daily at 9:00 AM UTC
   - **Method:** GET or POST
3. Test immediately (use "Run now" button)
4. Verify emails sent

**Using EasyCron:**
1. Sign up at https://www.easycron.com
2. Create cron job with same settings
3. Test execution

## Troubleshooting

### No Emails Received

**Check 1: Environment Variables**
```bash
# Verify RESEND_API_KEY is set
echo $RESEND_API_KEY  # Should show your key

# Check in code
console.log(process.env.RESEND_API_KEY)  # Should not be undefined
```

**Check 2: Resend Dashboard**
- Go to https://resend.com/emails
- Check for failed sends
- Check API key is active
- Verify email domain (if using custom domain)

**Check 3: Email Address**
- Verify user email in Supabase Auth is correct
- Check email is not blocked
- Try different email address

**Check 4: Reminder Logic**
- Verify item has `reminder_days` array set
- Check expiry date is correct
- Verify days calculation (check console logs)

### Duplicate Emails

**Problem:** Receiving multiple emails for same reminder

**Solution:**
1. Check `reminder_logs` table has unique constraint
2. Verify reminder endpoint checks logs before sending
3. Check for multiple cron jobs running
4. Verify timezone settings (should use UTC)

### Service Role Key Error

**Error:** "SUPABASE_SERVICE_ROLE_KEY is not configured"

**Solution:**
1. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (local) or production env vars
2. Verify key is correct (from Supabase Dashboard → Settings → API)
3. Restart server after adding

### Items Not Found

**Problem:** Reminder endpoint says "No reminders to send"

**Check:**
1. Verify items exist in `life_items` table
2. Check items have `reminder_days` array (not empty)
3. Verify expiry dates are in the future (or today for `0` day reminders)
4. Check RLS policies allow service role to read items

## Test Checklist

Use this checklist for comprehensive testing:

- [ ] **Basic Reminder:** Item expiring tomorrow, reminder day 1
- [ ] **Multiple Reminders:** Item with multiple reminder days
- [ ] **Expired Item:** Item that already expired
- [ ] **Medicine Item:** Medicine category with person name
- [ ] **Family Sharing:** Shared item sends to both owner and family member
- [ ] **Duplicate Prevention:** Running endpoint twice doesn't send duplicates
- [ ] **Email Format:** HTML email renders correctly
- [ ] **Email Content:** All item details present
- [ ] **Reminder Logs:** Entries created in `reminder_logs` table
- [ ] **Cron Job:** Automated daily execution works
- [ ] **Error Handling:** Missing env vars show helpful errors

## Production Monitoring

After launch, monitor:

1. **Daily Cron Execution:**
   - Check Vercel logs or cron service logs
   - Verify endpoint returns success

2. **Email Delivery:**
   - Monitor Resend dashboard for delivery rates
   - Check bounce rates
   - Monitor spam complaints

3. **Reminder Logs:**
   - Periodically check `reminder_logs` table
   - Verify no unexpected duplicates
   - Check for failed sends (if logging implemented)

4. **User Feedback:**
   - Monitor for users not receiving reminders
   - Check support requests related to reminders

## Quick Test Script

For quick testing, create a test item and run:

```bash
# Test reminder endpoint
curl https://your-domain.com/api/reminders

# Check response
# Should return: {"success": true, "remindersSent": 1, ...}
```

Then verify:
1. Email received ✅
2. Reminder log entry created ✅
3. No duplicate on second run ✅

---

**Last Updated:** Launch preparation

