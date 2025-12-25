# Reminder Email System - Complete Guide

## 📧 When Will Users Receive Reminder Emails?

### Scenario: User Adds Item with 7 Days Expiry

**Example:**
- **Today:** December 25, 2024
- **User adds item:** "LIC Policy" with expiry date: **January 1, 2025**
- **Reminder days set:** `[7]` (7 days before expiry)

**When will the email be sent?**

#### ✅ **Answer: January 1, 2025 at 9:00 AM UTC** (or when the cron job runs)

**Why?**
- The item expires on **January 1, 2025**
- Reminder is set for **7 days before** = **December 25, 2024**
- But the item was added on **December 25, 2024** (today)
- The cron job runs **once per day at 9:00 AM UTC**
- Since the item was added today, the **7-day reminder day has already passed**
- The system will send a reminder on the **expiry day (January 1, 2025)** if `reminder_days` includes `0`

#### 📅 **Reminder Schedule:**

| Reminder Days | When Email is Sent |
|---------------|-------------------|
| `[30, 7, 0]` | 30 days before, 7 days before, and on expiry day |
| `[7]` | 7 days before expiry |
| `[0]` | On the expiry day |
| `[7, 0]` | 7 days before AND on expiry day |

#### ⚠️ **Important Notes:**

1. **Cron Job Runs Once Per Day:**
   - The `/api/reminders` endpoint runs **once per day at 9:00 AM UTC** (configured in `vercel.json`)
   - If you add an item today, and the reminder day is today, you'll get the email **tomorrow at 9 AM UTC** (when the cron runs next)

2. **If Item Expires Within Reminder Days:**
   - If you add an item that expires in **3 days** and reminder is set to `[7]`, you won't get the 7-day reminder
   - But if `reminder_days` includes `0`, you'll get a reminder on the expiry day

3. **Immediate Reminders (Not Currently Implemented):**
   - Currently, there's no automatic immediate reminder when adding items
   - The `/api/reminders/send-now` endpoint exists but is not called automatically
   - Reminders are only sent via the daily cron job

---

## 🔗 Why Does `/api/reminders` URL Exist?

### Purpose:

The `/api/reminders` endpoint is a **cron job endpoint** that:

1. **Runs automatically** once per day (9:00 AM UTC) via Vercel Cron
2. **Checks all items** in the database for reminders due today
3. **Sends emails** to users whose items need reminders
4. **Prevents duplicates** by logging sent reminders in `reminder_logs` table

### How It Works:

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/reminders",
      "schedule": "0 9 * * *"  // Every day at 9:00 AM UTC
    }
  ]
}
```

### Manual Testing:

You can manually test the endpoint by visiting:
- `https://www.expirycare.com/api/reminders`

This is useful for:
- ✅ Testing if reminders are working
- ✅ Debugging email issues
- ✅ Checking which items need reminders

**Note:** This endpoint should ideally be protected (requires API key), but for now it's accessible for testing.

---

## ❌ Current Error: Resend Domain Verification

### Error Message:
```
"The expirycare.com domain is not verified. Please, add and verify your domain on https://resend.com/domains"
```

### Why This Happens:

**Resend requires domain verification** to send emails from your custom domain (`expirycare.com`). This prevents spam and ensures email deliverability.

### Current Status:

- ✅ Reminder system is working (found 1 reminder)
- ❌ Emails are **NOT being sent** (0 sent) due to domain verification
- ⚠️ Users will **NOT receive reminder emails** until domain is verified

---

## 🔧 How to Fix Resend Domain Verification

### Step 1: Go to Resend Dashboard

1. Visit: **https://resend.com/domains**
2. Sign in with your Resend account
3. Click **"Add Domain"** or **"Verify Domain"**

### Step 2: Add Your Domain

1. Enter your domain: `expirycare.com`
2. Click **"Add Domain"**

### Step 3: Add DNS Records

Resend will show you DNS records to add. You need to add these to your domain provider (GoDaddy, Namecheap, etc.):

#### Required DNS Records:

1. **SPF Record** (TXT):
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:resend.com ~all
   ```

2. **DKIM Record** (TXT):
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [Resend will provide this unique value]
   ```

3. **DMARC Record** (TXT):
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none;
   ```

### Step 4: Verify Domain

1. After adding DNS records, go back to Resend dashboard
2. Click **"Verify Domain"**
3. Wait for DNS propagation (can take 5 minutes to 48 hours)
4. Once verified, you'll see a green checkmark ✅

### Step 5: Update Environment Variable

Once verified, update your `RESEND_FROM_EMAIL` in Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Update `RESEND_FROM_EMAIL`:
   ```
   ExpiryCare <reminders@expirycare.com>
   ```
   (or `noreply@expirycare.com`, `notifications@expirycare.com`, etc.)

3. **Redeploy** your application

---

## 🚀 Alternative: Use Resend's Default Domain (Quick Fix)

If you want to send emails **immediately** without domain verification:

### Option 1: Use Resend's Default Domain

1. In Vercel, update `RESEND_FROM_EMAIL`:
   ```
   ExpiryCare <onboarding@resend.dev>
   ```
   (This is the default Resend domain - no verification needed)

2. **Redeploy** your application

3. **Limitation:** Emails will come from `onboarding@resend.dev` instead of `@expirycare.com`

### Option 2: Use a Subdomain

1. Verify a subdomain like `mail.expirycare.com` (faster than root domain)
2. Use: `ExpiryCare <reminders@mail.expirycare.com>`

---

## 📋 Summary: When Users Get Reminder Emails

### Current System (After Fix):

1. **User adds item** with expiry date and reminder days
2. **Daily cron job** runs at 9:00 AM UTC
3. **System checks** all items for reminders due today
4. **If reminder day matches**, email is sent
5. **Email is logged** to prevent duplicates

### Example Timeline:

- **Dec 25, 2024:** User adds "LIC Policy" (expires Jan 1, 2025, reminder: 7 days)
- **Dec 25, 2024, 9:00 AM UTC:** Cron runs, checks items
  - Days until expiry: **7 days**
  - Reminder day: **7**
  - ✅ **Email sent immediately** (if domain is verified)
- **Jan 1, 2025, 9:00 AM UTC:** Cron runs again
  - Days until expiry: **0 days**
  - If `reminder_days` includes `0`, ✅ **Email sent on expiry day**

### If Item Expires Within Reminder Days:

- **Dec 25, 2024:** User adds item (expires Dec 27, 2024, reminder: 7 days)
- **Dec 25, 2024, 9:00 AM UTC:** Cron runs
  - Days until expiry: **2 days** (not 7)
  - ❌ **7-day reminder skipped** (already passed)
  - ✅ **Expiry day reminder sent** (if `reminder_days` includes `0`)

---

## ✅ Action Items

1. **Fix Resend Domain Verification:**
   - Go to https://resend.com/domains
   - Add and verify `expirycare.com`
   - Add required DNS records
   - Update `RESEND_FROM_EMAIL` in Vercel

2. **Test Reminder System:**
   - Visit `https://www.expirycare.com/api/reminders`
   - Check if emails are being sent
   - Verify no errors in the response

3. **Monitor Reminder Logs:**
   - Check `reminder_logs` table in Supabase
   - Verify reminders are being logged correctly

---

## 🔍 Troubleshooting

### Q: Why are 0 reminders being sent?

**A:** Domain not verified in Resend. Fix: Verify domain at https://resend.com/domains

### Q: When will I get the email if I add an item today?

**A:** 
- If reminder day is today: **Tomorrow at 9:00 AM UTC** (next cron run)
- If reminder day is in the future: **On that day at 9:00 AM UTC**

### Q: Can I send reminders immediately when items are added?

**A:** Currently no, but you can:
1. Call `/api/reminders/send-now` manually after adding an item
2. Or modify `AddItemModal.tsx` to call this endpoint after successful item creation

### Q: How often does the cron job run?

**A:** Once per day at 9:00 AM UTC (configured in `vercel.json`)

---

## 📚 Related Files

- `app/api/reminders/route.ts` - Main reminder cron endpoint
- `app/api/reminders/send-now/route.ts` - Immediate reminder endpoint (not auto-called)
- `vercel.json` - Cron job configuration
- `lib/email/sender.ts` - Email sending logic
- `supabase/migrations/005_reminder_tracking.sql` - Reminder logs table

