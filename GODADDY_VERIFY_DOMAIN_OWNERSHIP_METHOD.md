# Using "Verify Domain Ownership" to Add TXT Records in GoDaddy

## ✅ Solution: Use "Verify Domain Ownership" Button

Since the "Add New Record" button is disabled, you can use the **"Verify Domain Ownership"** option to add TXT records. This method works perfectly for adding the Resend DNS records!

---

## 📋 Step-by-Step Instructions

### Step 1: Get DNS Records from Resend

**First, get the exact values from Resend:**

1. Go to **https://resend.com/domains**
2. Sign in to your Resend account
3. Find **expirycare.com** (or add it if not already added)
4. Resend will show you **3 TXT records**:
   - **SPF Record:** `v=spf1 include:resend.com ~all`
   - **DKIM Record:** [A long unique value from Resend]
   - **DMARC Record:** `v=DMARC1; p=none;`

**Copy these values** - you'll need them.

---

### Step 2: Add First TXT Record (SPF) via "Verify Domain Ownership"

1. In GoDaddy, click the **"Verify Domain Ownership"** button (middle card)
2. A modal will appear: **"Verify Domain Ownership to Connect"**
3. In the **"Value"** field, paste: `v=spf1 include:resend.com ~all`
4. Click **"Verify"** button
5. The modal will close and the record will be added automatically

**Note:** GoDaddy will automatically create a TXT record with the value you provided.

---

### Step 3: Add Second TXT Record (DKIM) via "Verify Domain Ownership"

1. Click **"Verify Domain Ownership"** button again
2. The modal will appear again
3. In the **"Value"** field, paste the **DKIM value from Resend** (the long value)
4. Click **"Verify"** button
5. The record will be added

**Important:** For DKIM, you might need to manually edit the record name after it's created. See "Step 5" below.

---

### Step 4: Add Third TXT Record (DMARC) via "Verify Domain Ownership"

1. Click **"Verify Domain Ownership"** button again
2. The modal will appear again
3. In the **"Value"** field, paste: `v=DMARC1; p=none;`
4. Click **"Verify"** button
5. The record will be added

**Important:** For DMARC, you might need to manually edit the record name after it's created. See "Step 5" below.

---

### Step 5: Edit Record Names (If Needed)

After adding records via "Verify Domain Ownership", GoDaddy might create them with generic names. You need to ensure they have the correct names:

1. Scroll down on the DNS Records page to see all your records
2. Find the TXT records you just added
3. For each record, click **"Edit"** (pencil icon) or **"..."** menu → **"Edit"**
4. Update the names:

   **For SPF:**
   - **Name:** Should be `@` (or blank for root domain)
   - If it's something else, change it to `@`

   **For DKIM:**
   - **Name:** Should be `resend._domainkey`
   - If it's something else, change it to `resend._domainkey`

   **For DMARC:**
   - **Name:** Should be `_dmarc`
   - If it's something else, change it to `_dmarc`

5. Click **"Save"** for each record

---

### Step 6: Verify Records Are Correct

After adding and editing all 3 records, you should see them in your DNS Records list:

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

## 🔍 Alternative: Check if Records Appear Automatically

After using "Verify Domain Ownership", check if the records appear in your DNS Records list:

1. Scroll down on the DNS Records page
2. Look for TXT records you just added
3. If they appear with correct names, you're done!
4. If they appear with wrong names, edit them (Step 5 above)

---

## ⚠️ Important Notes

1. **Add records one at a time** - Use "Verify Domain Ownership" for each record separately
2. **Check record names** - After adding, verify the names are correct (especially for DKIM and DMARC)
3. **Exact values matter** - Copy-paste from Resend exactly
4. **Wait for propagation** - Changes take time to spread globally

---

## 🆘 Troubleshooting

### Q: "Verify Domain Ownership" modal doesn't appear?

**A:**
- Try a different browser (Chrome, Firefox, Edge)
- Disable browser extensions (ad blockers)
- Clear browser cache
- Try refreshing the page

### Q: I added records but can't see them in the list?

**A:**
- Scroll down - they might be below existing records
- Refresh the page
- Wait a few minutes - DNS records can take time to appear

### Q: Records appear but with wrong names?

**A:**
- Click **"Edit"** on each record
- Change the name to the correct value:
  - SPF: `@`
  - DKIM: `resend._domainkey`
  - DMARC: `_dmarc`
- Click **"Save"**

### Q: I can't edit the record names?

**A:**
- Make sure you're on the **"DNS Records"** tab
- Try clicking the **"..."** menu next to the record → **"Edit"**
- If still not working, contact GoDaddy support

### Q: "Add New Record" button is still disabled?

**A:**
- This is okay! Use "Verify Domain Ownership" instead
- It does the same thing - adds TXT records
- The button might be disabled due to nameserver settings or account permissions

---

## 📋 Quick Summary

1. **Get 3 TXT records from Resend** → https://resend.com/domains
2. **Click "Verify Domain Ownership"** in GoDaddy (3 times, once for each record)
3. **Paste each value** in the modal and click "Verify"
4. **Edit record names** if needed (especially DKIM and DMARC)
5. **Wait 5-10 minutes** for DNS propagation
6. **Verify in Resend** → Should see green ✅

---

## ✅ Verification Checklist

- [ ] Got 3 TXT records from Resend dashboard
- [ ] Used "Verify Domain Ownership" to add SPF record
- [ ] Used "Verify Domain Ownership" to add DKIM record
- [ ] Used "Verify Domain Ownership" to add DMARC record
- [ ] Edited record names if needed (SPF: @, DKIM: resend._domainkey, DMARC: _dmarc)
- [ ] All 3 records visible in DNS Records list with correct names
- [ ] Waited at least 5 minutes for DNS propagation
- [ ] Clicked "Verify" in Resend dashboard
- [ ] Domain verified (green ✅ in Resend)

---

## 🎯 What About "Create MX Records"?

The **"Create MX records"** option is for setting up email services (like Gmail, Outlook) to receive emails at your domain. 

**You don't need this for Resend domain verification!**

Resend only needs **TXT records** (SPF, DKIM, DMARC) for domain verification. MX records are for receiving emails, which Resend doesn't require.

**Ignore the "Create MX records" option** - you only need the TXT records.

---

## 📞 Still Need Help?

If you're still having issues:

1. **Screenshot the error** - Take a screenshot of what happens
2. **Check GoDaddy account permissions** - Make sure you have admin access
3. **Contact GoDaddy support** - They can add records for you:
   - Phone: 1-480-505-8877
   - Chat: Available in GoDaddy dashboard

Tell them: *"I need to add 3 TXT records for email domain verification with Resend. The 'Add New Record' button is disabled, so I'm using 'Verify Domain Ownership'."*

