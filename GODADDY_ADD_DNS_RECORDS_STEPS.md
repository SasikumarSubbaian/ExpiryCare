# Step-by-Step: Adding DNS Records in GoDaddy for Resend

## ✅ You're in the Right Place!

You're now on the **"DNS Records"** tab in GoDaddy. This is exactly where you need to add the TXT records for Resend domain verification.

---

## 📋 Step-by-Step Instructions

### Step 1: Get DNS Records from Resend First

**Before adding records in GoDaddy, you need to get them from Resend:**

1. Go to **https://resend.com/domains**
2. Sign in to your Resend account
3. Find **expirycare.com** in the list (or add it if not already added)
4. Resend will show you **3 TXT records** to add:
   - **SPF Record** (value: `v=spf1 include:resend.com ~all`)
   - **DKIM Record** (a unique long value that Resend provides)
   - **DMARC Record** (value: `v=DMARC1; p=none;`)

**Copy these values** - you'll need them in the next step.

---

### Step 2: Click "Add New Record" Button

1. In GoDaddy, on the **"DNS Records"** page you're seeing now
2. Click the **"Add New Record"** button (gray button in the first card)
3. A form will appear to add a new DNS record

---

### Step 3: Add the First Record (SPF)

Fill in the form:

1. **Type:** Select `TXT` from the dropdown
2. **Name:** Enter `@` (or leave blank for root domain)
3. **Value:** Paste `v=spf1 include:resend.com ~all`
4. **TTL:** `600` (or leave default)
5. Click **"Save"** or **"Add Record"**

---

### Step 4: Add the Second Record (DKIM)

1. Click **"Add New Record"** again
2. Fill in the form:
   - **Type:** Select `TXT`
   - **Name:** Enter `resend._domainkey` (exactly as shown, with underscore)
   - **Value:** Paste the long value from Resend (starts with something like `v=DKIM1; k=rsa; p=...`)
   - **TTL:** `600` (or leave default)
3. Click **"Save"**

---

### Step 5: Add the Third Record (DMARC)

1. Click **"Add New Record"** again
2. Fill in the form:
   - **Type:** Select `TXT`
   - **Name:** Enter `_dmarc` (with underscore, lowercase)
   - **Value:** Paste `v=DMARC1; p=none;`
   - **TTL:** `600` (or leave default)
3. Click **"Save"**

---

### Step 6: Verify Records Are Added

After adding all 3 records, you should see them in your DNS Records list:

```
Type    Name              Value
TXT     @                 v=spf1 include:resend.com ~all
TXT     resend._domainkey [long value from Resend]
TXT     _dmarc            v=DMARC1; p=none;
```

---

### Step 7: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate globally
- Usually works within **1-2 hours**
- You can check propagation at: https://dnschecker.org

---

### Step 8: Verify Domain in Resend

1. Go back to **https://resend.com/domains**
2. Find **expirycare.com** in the list
3. Click **"Verify"** button
4. Wait for verification (can take a few minutes)
5. Once verified, you'll see a green ✅ checkmark

---

## 📸 What the Form Looks Like

When you click "Add New Record", you'll see a form like this:

```
┌─────────────────────────────────────┐
│ Add Record                          │
├─────────────────────────────────────┤
│ Type:  [TXT ▼]                      │
│ Name:  [@        ]                  │
│ Value: [v=spf1 include:resend...]   │
│ TTL:   [600      ]                  │
│        [Cancel] [Save]               │
└─────────────────────────────────────┘
```

---

## ⚠️ Important Notes

1. **Add records one at a time** - Don't try to add all 3 at once
2. **Exact values matter** - Copy-paste from Resend exactly
3. **Case sensitive** - `_dmarc` must have underscore, lowercase
4. **Don't delete existing records** - Only add new ones
5. **Wait for propagation** - Changes take time to spread globally

---

## 🔍 Troubleshooting

### Q: I don't see the "Add New Record" button?

**A:** 
- Make sure you're on the **"DNS Records"** tab (not "Forwarding" or "Nameservers")
- Scroll down - the button might be below existing records
- Try refreshing the page

### Q: The form doesn't appear when I click "Add New Record"?

**A:**
- Try a different browser (Chrome, Firefox, Edge)
- Disable browser extensions (ad blockers)
- Clear browser cache

### Q: "Save" button doesn't work?

**A:**
- Check that all required fields are filled
- Make sure "Type" is selected (TXT)
- Make sure "Name" and "Value" are not empty
- Remove any extra spaces in the values

### Q: I added records but Resend still says "not verified"?

**A:**
- Wait longer (up to 48 hours for DNS propagation)
- Double-check the values are exactly as Resend provided
- Make sure you added all 3 records (SPF, DKIM, DMARC)
- Check DNS propagation at: https://dnschecker.org

---

## ✅ Verification Checklist

- [ ] Got 3 TXT records from Resend dashboard
- [ ] Clicked "Add New Record" in GoDaddy
- [ ] Added SPF record (Type: TXT, Name: @, Value: v=spf1...)
- [ ] Added DKIM record (Type: TXT, Name: resend._domainkey, Value: [from Resend])
- [ ] Added DMARC record (Type: TXT, Name: _dmarc, Value: v=DMARC1...)
- [ ] All 3 records visible in GoDaddy DNS Records list
- [ ] Waited at least 5 minutes for DNS propagation
- [ ] Clicked "Verify" in Resend dashboard
- [ ] Domain verified (green ✅ in Resend)

---

## 🎯 Quick Summary

1. **Get records from Resend** → https://resend.com/domains
2. **Click "Add New Record"** in GoDaddy
3. **Add 3 TXT records** (one at a time)
4. **Wait 5-10 minutes** for DNS propagation
5. **Verify in Resend** → Should see green ✅

---

## 🆘 Still Need Help?

If you're still having issues:

1. **Screenshot the error** - Take a screenshot of what happens when you try to add a record
2. **Check GoDaddy account permissions** - Make sure you have admin access
3. **Contact GoDaddy support** - They can add records for you:
   - Phone: 1-480-505-8877
   - Chat: Available in GoDaddy dashboard

Tell them: *"I need to add 3 TXT records for email domain verification with Resend."*

