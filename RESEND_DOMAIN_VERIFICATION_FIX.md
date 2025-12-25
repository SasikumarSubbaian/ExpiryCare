# Fix Resend Domain Verification Error

## 🚨 Current Error

When visiting `https://www.expirycare.com/api/reminders`, you're seeing:

```json
{
  "message": "Processed 6 items",
  "reminders_found": 1,
  "reminders_sent": 0,
  "errors": [
    "Item LIC Policy: The expirycare.com domain is not verified. Please, add and verify your domain on https://resend.com/domains"
  ]
}
```

**This means:**
- ✅ Reminder system is working (found 1 reminder)
- ❌ **Emails are NOT being sent** (0 sent)
- ⚠️ Users will **NOT receive reminder emails** until this is fixed

---

## 🔧 Quick Fix Steps

### Step 1: Go to Resend Dashboard

1. Visit: **https://resend.com/domains**
2. Sign in with your Resend account
3. If you don't have an account, sign up at: **https://resend.com/signup**

### Step 2: Add Your Domain

1. Click **"Add Domain"** button
2. Enter: `expirycare.com`
3. Click **"Add"**

### Step 3: Add DNS Records

Resend will show you **3 DNS records** to add. You need to add these to your domain provider (where you bought `expirycare.com` - GoDaddy, Namecheap, etc.):

#### Required DNS Records:

1. **SPF Record** (TXT):
   ```
   Type: TXT
   Name: @ (or leave blank for root domain)
   Value: v=spf1 include:resend.com ~all
   TTL: 3600 (or default)
   ```

2. **DKIM Record** (TXT):
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [Resend will provide a unique long string here]
   TTL: 3600 (or default)
   ```

3. **DMARC Record** (TXT):
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none;
   TTL: 3600 (or default)
   ```

### Step 4: Add DNS Records in Your Domain Provider

**⚠️ IMPORTANT: DNS records must be added in GoDaddy (your domain provider), NOT in Vercel!**

**Detailed Instructions for GoDaddy:**
1. Log in to GoDaddy: https://www.godaddy.com
2. Go to **My Products** → **Domains** → **expirycare.com**
3. Click on **expirycare.com** or click the **"DNS"** button
4. Make sure you're on the **"DNS Records"** tab
5. Click **"Add New Record"** button
6. For each of the 3 records:
   - **Type:** Select `TXT` from dropdown
   - **Name:** Enter the name (see table below)
   - **Value:** Paste the value from Resend
   - **TTL:** `600` (or leave default)
   - Click **"Save"**
7. Repeat for all 3 records

**If you can't add records in GoDaddy, see `GODADDY_DNS_RECORDS_SETUP.md` for detailed troubleshooting.**

**Example for Namecheap:**
1. Log in to Namecheap
2. Go to **Domain List** → **expirycare.com** → **Manage** → **Advanced DNS**
3. Click **"Add New Record"**
4. Add each of the 3 TXT records above
5. **Save** each record

### Step 5: Verify Domain in Resend

1. Go back to **Resend Dashboard** → **Domains**
2. Find `expirycare.com` in the list
3. Click **"Verify"** button
4. Wait for DNS propagation (usually 5 minutes to 2 hours, can take up to 48 hours)
5. Once verified, you'll see a green ✅ checkmark

### Step 6: Update Environment Variable in Vercel

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **ExpiryCare** project
3. Go to **Settings** → **Environment Variables**
4. Find `RESEND_FROM_EMAIL`
5. Update it to:
   ```
   ExpiryCare <reminders@expirycare.com>
   ```
   (or `noreply@expirycare.com`, `notifications@expirycare.com` - any subdomain works)
6. **Save**
7. **Redeploy** your application (or wait for automatic redeploy)

### Step 7: Test

1. Visit: `https://www.expirycare.com/api/reminders`
2. Check the response - should show `reminders_sent: 1` (or more)
3. Check your email inbox for the reminder email

---

## ⚡ Quick Alternative (Temporary Fix)

If you need emails working **immediately** without domain verification:

### Use Resend's Default Domain

1. In **Vercel** → **Environment Variables**
2. Update `RESEND_FROM_EMAIL` to:
   ```
   ExpiryCare <onboarding@resend.dev>
   ```
3. **Redeploy**

**Note:** Emails will come from `onboarding@resend.dev` instead of `@expirycare.com`, but they'll work immediately.

---

## 📋 DNS Records Summary

Add these 3 TXT records to your domain:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| TXT | `@` | `v=spf1 include:resend.com ~all` | SPF (email authentication) |
| TXT | `resend._domainkey` | `[Resend provides this]` | DKIM (email signing) |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC (email policy) |

---

## ✅ Verification Checklist

- [ ] Added SPF record to domain DNS
- [ ] Added DKIM record to domain DNS
- [ ] Added DMARC record to domain DNS
- [ ] Verified domain in Resend dashboard (green ✅)
- [ ] Updated `RESEND_FROM_EMAIL` in Vercel
- [ ] Redeployed application
- [ ] Tested `/api/reminders` endpoint
- [ ] Received test reminder email

---

## 🔍 Troubleshooting

### Q: DNS records not verifying after 24 hours?

**A:** 
- Check that records are exactly as Resend provided (no extra spaces)
- Ensure TTL is set (3600 is fine)
- Try removing and re-adding records
- Contact your domain provider support

### Q: Still getting domain verification error?

**A:**
- Make sure you clicked "Verify" in Resend dashboard
- Wait a few more hours for DNS propagation
- Check DNS records are correct using: https://mxtoolbox.com/spf.aspx

### Q: Can I use a subdomain instead?

**A:** Yes! Verify `mail.expirycare.com` instead (faster). Then use:
```
ExpiryCare <reminders@mail.expirycare.com>
```

---

## 📚 Resources

- **Resend Domains:** https://resend.com/domains
- **Resend Documentation:** https://resend.com/docs/dashboard/domains/introduction
- **DNS Propagation Checker:** https://dnschecker.org
- **SPF Record Checker:** https://mxtoolbox.com/spf.aspx

---

## 🎯 Expected Result After Fix

After completing these steps, when you visit `https://www.expirycare.com/api/reminders`, you should see:

```json
{
  "message": "Processed 6 items",
  "reminders_found": 1,
  "reminders_sent": 1,  // ✅ Now sending emails!
  "timestamp": "2025-12-25T12:05:41.335Z"
}
```

And users will receive reminder emails in their inbox! 🎉

