# How to Add DNS Records in GoDaddy for Resend Domain Verification

## ✅ Where to Add DNS Records

**DNS records must be added in GoDaddy** (your domain provider), **NOT in Vercel**.

- ✅ **GoDaddy** = Where you manage your domain's DNS records
- ❌ **Vercel** = Only for hosting your application (not for DNS)

---

## 📋 Step-by-Step Instructions for GoDaddy

### Step 1: Go to DNS Management

1. Log in to **GoDaddy**: https://www.godaddy.com
2. Go to **My Products** → **Domains**
3. Find **expirycare.com** in the list
4. Click on **expirycare.com** (or click the **"DNS"** button)
5. You should see the **"DNS Records"** tab (this is what you're seeing in the screenshot)

### Step 2: Get DNS Records from Resend

**Before adding records in GoDaddy, you need to get them from Resend:**

1. Go to **https://resend.com/domains**
2. Sign in to your Resend account
3. Click **"Add Domain"** or find **expirycare.com** if already added
4. Resend will show you **3 TXT records** to add:
   - **SPF Record** (with value: `v=spf1 include:resend.com ~all`)
   - **DKIM Record** (with a unique long value)
   - **DMARC Record** (with value: `v=DMARC1; p=none;`)

**Copy these values** - you'll need them in GoDaddy.

### Step 3: Add DNS Records in GoDaddy

#### Option A: Using "Add New Record" Button

1. In GoDaddy DNS Records page, click **"Add New Record"** button
2. You'll see a form to add a new record
3. For each of the 3 records, fill in:

   **Record 1: SPF**
   - **Type:** Select `TXT` from dropdown
   - **Name:** Enter `@` (or leave blank for root domain)
   - **Value:** `v=spf1 include:resend.com ~all`
   - **TTL:** `600` (or leave default)
   - Click **"Save"**

   **Record 2: DKIM**
   - **Type:** Select `TXT` from dropdown
   - **Name:** Enter `resend._domainkey` (exactly as shown)
   - **Value:** Paste the long value from Resend (starts with something like `v=DKIM1; k=rsa; p=...`)
   - **TTL:** `600` (or leave default)
   - Click **"Save"**

   **Record 3: DMARC**
   - **Type:** Select `TXT` from dropdown
   - **Name:** Enter `_dmarc` (with underscore)
   - **Value:** `v=DMARC1; p=none;`
   - **TTL:** `600` (or leave default)
   - Click **"Save"**

#### Option B: If "Add New Record" Button Doesn't Work

If you can't see the "Add New Record" button or it's not working:

1. **Check if you're in the right section:**
   - Make sure you're on the **"DNS Records"** tab (not "Forwarding" or "Nameservers")

2. **Try refreshing the page:**
   - Sometimes GoDaddy's interface needs a refresh

3. **Check if domain is locked:**
   - Go to **Domain Settings** → Check if domain is locked
   - If locked, unlock it temporarily

4. **Try a different browser:**
   - Sometimes browser extensions can interfere

5. **Contact GoDaddy Support:**
   - If still not working, contact GoDaddy support
   - They can add the records for you

### Step 4: Verify Records Are Added

After adding all 3 records, you should see them in your DNS Records list:

```
Type    Name              Value
TXT     @                 v=spf1 include:resend.com ~all
TXT     resend._domainkey [long value from Resend]
TXT     _dmarc            v=DMARC1; p=none;
```

### Step 5: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate
- Usually works within **1-2 hours**
- You can check propagation at: https://dnschecker.org

### Step 6: Verify Domain in Resend

1. Go back to **https://resend.com/domains**
2. Find **expirycare.com** in the list
3. Click **"Verify"** button
4. Wait for verification (can take a few minutes)
5. Once verified, you'll see a green ✅ checkmark

---

## 🔧 Troubleshooting: Can't Add DNS Records in GoDaddy

### Issue 1: "Add New Record" Button Not Visible

**Solution:**
- Make sure you're on the **"DNS Records"** tab
- Scroll down - the button might be below existing records
- Try a different browser or incognito mode

### Issue 2: Button Clicked But Form Doesn't Appear

**Solution:**
- Disable browser extensions (ad blockers, privacy tools)
- Clear browser cache and cookies
- Try a different browser (Chrome, Firefox, Edge)

### Issue 3: "Save" Button Not Working

**Solution:**
- Check if all required fields are filled
- Make sure "Type" is selected (TXT)
- Make sure "Name" and "Value" are not empty
- Try removing any extra spaces in the values

### Issue 4: Domain Locked or Protected

**Solution:**
1. Go to **Domain Settings** (gear icon next to domain name)
2. Look for **"Domain Lock"** or **"Registrar Lock"**
3. If enabled, **disable it temporarily**
4. Add DNS records
5. Re-enable lock if desired

### Issue 5: Nameservers Not Pointing to GoDaddy

**Solution:**
1. Check **"Nameservers"** tab in GoDaddy
2. If nameservers are pointing elsewhere (e.g., Cloudflare, Vercel), you need to:
   - Either change nameservers back to GoDaddy
   - Or add DNS records where nameservers are pointing (e.g., Cloudflare)

### Issue 6: Still Can't Add Records

**Last Resort:**
1. **Contact GoDaddy Support:**
   - Phone: 1-480-505-8877 (US)
   - Chat: Available in GoDaddy dashboard
   - Email: support@godaddy.com
   - Tell them: "I need to add 3 TXT records for email domain verification"

2. **Provide them with:**
   - Domain: `expirycare.com`
   - The 3 TXT records from Resend
   - They can add them for you

---

## 📸 Visual Guide (What You Should See)

### In GoDaddy DNS Records Page:

```
┌─────────────────────────────────────────┐
│ DNS Records                             │
├─────────────────────────────────────────┤
│ Type  │ Name            │ Value          │
├───────┼─────────────────┼───────────────┤
│ A     │ @               │ [IP address]   │
│ CNAME │ www             │ expirycare.com │
│ TXT   │ @               │ v=spf1...     │ ← Add this
│ TXT   │ resend._domainkey│ [long value] │ ← Add this
│ TXT   │ _dmarc          │ v=DMARC1...   │ ← Add this
└─────────────────────────────────────────┘
```

### After Clicking "Add New Record":

```
┌─────────────────────────────────────────┐
│ Add Record                              │
├─────────────────────────────────────────┤
│ Type:  [TXT ▼]                          │
│ Name:  [@        ]                      │
│ Value: [v=spf1 include:resend.com ~all]│
│ TTL:   [600      ]                      │
│        [Cancel] [Save]                   │
└─────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

1. **Don't delete existing records** - only add new ones
2. **Exact values matter** - copy-paste from Resend exactly
3. **Case sensitive** - `_dmarc` must have underscore, lowercase
4. **Wait for propagation** - changes take time to spread globally
5. **One record at a time** - add each TXT record separately

---

## ✅ Verification Checklist

- [ ] Got 3 TXT records from Resend dashboard
- [ ] Added SPF record in GoDaddy (Type: TXT, Name: @, Value: v=spf1...)
- [ ] Added DKIM record in GoDaddy (Type: TXT, Name: resend._domainkey, Value: [from Resend])
- [ ] Added DMARC record in GoDaddy (Type: TXT, Name: _dmarc, Value: v=DMARC1...)
- [ ] All 3 records visible in GoDaddy DNS Records list
- [ ] Waited at least 5 minutes for DNS propagation
- [ ] Clicked "Verify" in Resend dashboard
- [ ] Domain verified (green ✅ in Resend)

---

## 🆘 Still Having Issues?

If you're still unable to add DNS records in GoDaddy:

1. **Screenshot the error** - take a screenshot of what happens when you try to add a record
2. **Check GoDaddy account permissions** - make sure you have admin access
3. **Try GoDaddy mobile app** - sometimes the mobile app works better
4. **Contact GoDaddy support** - they can add records for you over the phone/chat

---

## 📞 GoDaddy Support Contact

- **Phone:** 1-480-505-8877 (US)
- **Chat:** Available in GoDaddy dashboard (bottom right corner)
- **Help Center:** https://www.godaddy.com/help

Tell them: *"I need to add 3 TXT records for email domain verification with Resend. The records are: SPF, DKIM, and DMARC."*

