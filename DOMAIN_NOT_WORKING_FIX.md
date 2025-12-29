# Fix: Domain Not Showing ExpiryCare Website

## 🚨 Problem

When visiting `https://expirycare.com/privacy`, you're seeing:
- ❌ GoDaddy parked domain page (or redirect to another site)
- ❌ Not showing your ExpiryCare website
- ❌ Domain not connected to Vercel

---

## ✅ Solution: Connect Domain to Vercel

The domain needs to be properly connected to your Vercel deployment. Here's how to fix it:

---

## 📋 Step-by-Step Fix

### Step 1: Add Domain to Vercel Project

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **ExpiryCare** project
3. Go to **Settings** → **Domains**
4. Click **"Add Domain"** or **"Add"** button
5. Enter: `expirycare.com`
6. Click **"Add"** or **"Continue"**

### Step 2: Resolve "Invalid Configuration" Error (If Applicable)

If Vercel shows **"Invalid Configuration"** with a red alert icon, you need to remove conflicting DNS records first:

1. **In Vercel Dashboard:**
   - Go to **Settings** → **Domains**
   - Find `expirycare.com` (it will show "Invalid Configuration")
   - Click on the domain to see the details
   - Vercel will list the conflicting records that need to be removed

2. **Remove Conflicting A Records in GoDaddy:**
   - Go to **GoDaddy DNS Management**
   - Look for **ALL A records with Name `@`** (root domain)
   - **You should only have ONE A record** pointing to the Vercel IP address
   - **Delete any other A records** with Name `@`, including:
     - A record with Value `Parked` (GoDaddy's parked domain record) → **Delete this**
     - A records with old IP addresses like `15.197.148.33`, `3.33.130.190`, or `76.76.21.21` → **Delete these**
   - **Keep only the A record** pointing to the Vercel IP (usually `216.198.79.1`)
   - Click the **trash icon** for each conflicting record
   - Wait a few seconds for deletion to process

3. **Add the Correct A Record:**
   - After removing conflicts, Vercel will show you the correct A record to add
   - Usually: **Type:** A, **Name:** `@`, **Value:** `216.198.79.1` (or the value Vercel shows)
   - Add this new A record in GoDaddy
   - Click **Save**

4. **Go back to Vercel and click "Refresh"** to verify the configuration

### Step 3: Configure DNS Records in GoDaddy

Vercel will show you DNS records to add. You need to add these in GoDaddy:

#### Option A: Use Vercel Nameservers (Recommended)

1. In Vercel, after adding the domain, it will show you **nameservers** like:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

2. In GoDaddy:
   - Go to **DNS Management** → **Nameservers** tab
   - Click **"Change Nameservers"**
   - Select **"Custom"** or **"I'll use my own nameservers"**
   - Enter the Vercel nameservers:
     - `ns1.vercel-dns.com`
     - `ns2.vercel-dns.com`
   - Click **"Save"**
   - Wait 5-10 minutes for propagation

#### Option B: Use DNS Records (If you want to keep GoDaddy nameservers)

If you want to keep GoDaddy nameservers (for easier DNS management), follow these steps:

**⚠️ Important: Remove Conflicting Records First!**

Before adding new records, check if you have any existing A records with Name `@` that conflict:
- **You should only have ONE A record** with Name `@` pointing to the Vercel IP
- **Delete any other A records** with Name `@`, including:
  - A record with Value `Parked` (GoDaddy's parked domain record) → **Delete this**
  - A records with old IP addresses like `15.197.148.33`, `3.33.130.190`, or `76.76.21.21` → **Delete these**
- These conflicting records will cause "Invalid Configuration" errors

**Then add these records:**

1. **A Record (Root Domain):**
   - **Type:** A
   - **Name:** `@` (or blank for root domain)
   - **Value:** [IP address from Vercel - check Vercel dashboard for exact value, usually `216.198.79.1`]
   - **TTL:** 600

2. **CNAME Record (for www):**
   - **Type:** CNAME
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com.` (note the trailing dot)
   - **TTL:** 600

**⚠️ Important: If you get a "Record name www conflicts with another record" error:**

This means there's already a CNAME record for "www" in your DNS. You need to:

**Option 1: Edit the existing CNAME record (Recommended)**
1. In the DNS records table, find the existing CNAME record with name "www"
2. Click the **Edit** (pencil) icon for that record
3. Update the **Value** field to the Vercel CNAME value (e.g., `c6180e92d353416f.vercel-dns-017.com.`)
4. Click **Save**

**Option 2: Delete and recreate**
1. In the DNS records table, find the existing CNAME record with name "www"
2. Click the **Delete** (trash can) icon to remove it
3. Wait a few seconds for the deletion to process
4. Then add the new CNAME record as described above

**Note:** Vercel will show you the exact values to use.

---

### Step 4: Verify Domain in Vercel

1. After adding DNS records, go back to Vercel Dashboard
2. Go to **Settings** → **Domains**
3. Find `expirycare.com` in the list
4. Wait for verification (can take 5-10 minutes)
5. You should see a green ✅ checkmark when verified

### Step 5: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate globally
- Usually works within **1-2 hours**
- You can check propagation at: https://dnschecker.org

### Step 6: Test the Domain

1. Wait 10-15 minutes after adding DNS records
2. Visit: `https://expirycare.com`
3. Should show your ExpiryCare website ✅
4. Visit: `https://expirycare.com/privacy`
5. Should show your Privacy Policy page ✅

---

## 🔍 Troubleshooting

### Q: Domain still shows parked page after adding DNS?

**A:**
- Wait longer (up to 48 hours for full propagation)
- Clear browser cache or use incognito mode
- Check DNS propagation: https://dnschecker.org
- Verify nameservers/DNS records are correct in GoDaddy

### Q: Vercel shows "Domain not verified"?

**A:**
- Check DNS records are added correctly in GoDaddy
- Make sure nameservers point to Vercel (if using Option A)
- Wait 10-15 minutes and refresh Vercel dashboard
- Check for typos in DNS records

### Q: I changed nameservers but domain still not working?

**A:**
- Nameserver changes can take 24-48 hours to fully propagate
- Check if nameservers are correct: https://mxtoolbox.com/DNSLookup.aspx
- Make sure you saved the changes in GoDaddy

### Q: Domain works but shows "Not Secure" or SSL error?

**A:**
- Vercel automatically provisions SSL certificates
- Wait 10-15 minutes after domain verification
- SSL certificate generation can take time
- If still not working after 24 hours, contact Vercel support

### Q: Vercel shows "Invalid Configuration" error?

**A:** This means there are conflicting DNS records in GoDaddy that don't match what Vercel expects.

**Solution:**
1. **In GoDaddy DNS Management:**
   - Look at your A records with Name `@` (root domain)
   - **You should only have ONE A record** pointing to the Vercel IP address
   - **Delete any other A records** with Name `@`, including:
     - **A record with Value `Parked`** → This is GoDaddy's parked domain record, **delete it**
     - A records with old IP addresses (if any) → **Delete these too**
   - **Keep only the A record** pointing to `216.198.79.1` (or the IP Vercel shows you)

2. **If you don't have the correct A record yet:**
   - Check Vercel dashboard for the correct IP address (usually `216.198.79.1`)
   - Add a new A record: **Type:** A, **Name:** `@`, **Value:** [IP from Vercel]
   - Click **Save**

3. **Refresh in Vercel:**
   - Go back to Vercel dashboard
   - Click **"Refresh"** button next to the domain
   - Wait 5-10 minutes for DNS to propagate
   - The status should change from "Invalid Configuration" to "Valid" ✅

**Important:** 
- You can only have **ONE A record** with Name `@`
- The most common conflict is the **"Parked" A record** from GoDaddy
- Make sure you delete ALL conflicting A records, keeping only the one pointing to Vercel's IP

### Q: Getting "Record name www conflicts with another record" error?

**A:** This happens when you try to add a CNAME record for "www" but one already exists.

**Solution:**
1. **Don't create a new record** - instead, **edit the existing one**
2. In your DNS records table, find the existing CNAME record with name "www"
3. Click the **Edit** (pencil) icon
4. Change the **Value** to the Vercel CNAME value (from Vercel dashboard)
5. Click **Save**

**Alternative:** If you prefer to delete and recreate:
1. Delete the existing "www" CNAME record (trash icon)
2. Wait a few seconds
3. Add the new CNAME record with the Vercel value

---

## 📋 Quick Checklist

- [ ] Added `expirycare.com` to Vercel project (Settings → Domains)
- [ ] Checked for "Invalid Configuration" error in Vercel
- [ ] Removed conflicting A records in GoDaddy (if any)
- [ ] Added correct DNS records in GoDaddy (A record or nameservers)
- [ ] Clicked "Refresh" in Vercel dashboard
- [ ] Waited 10-15 minutes for DNS propagation
- [ ] Verified domain in Vercel (green ✅ checkmark, no "Invalid Configuration")
- [ ] Tested `https://expirycare.com` (shows ExpiryCare website)
- [ ] Tested `https://expirycare.com/privacy` (shows Privacy Policy)

---

## 🎯 Recommended Approach

**I recommend using Vercel nameservers (Option A)** because:
- ✅ Easier setup (just change nameservers)
- ✅ Vercel manages DNS automatically
- ✅ Better integration with Vercel features
- ✅ Automatic SSL certificate

**However**, if you need to manage DNS records in GoDaddy (for Resend email setup), use **Option B** (DNS records).

---

## ⚠️ Important Notes

### About Nameservers

- **If nameservers point to Vercel:** Vercel manages all DNS
- **If nameservers point to GoDaddy:** You manage DNS in GoDaddy
- **You can't mix both** - choose one approach

### About Resend DNS Records

If you're using GoDaddy nameservers and have already added Resend DNS records:
- ✅ Keep GoDaddy nameservers
- ✅ Use Option B (DNS records) for Vercel
- ✅ Add Vercel's A record and CNAME record
- ✅ Keep your existing Resend DNS records

### About SSL Certificates

- Vercel automatically provisions SSL certificates for your domain
- Takes 10-15 minutes after domain verification
- No manual configuration needed

---

## 📞 Still Not Working?

If the domain still doesn't work after following these steps:

1. **Check Vercel Deployment:**
   - Make sure your project is deployed successfully
   - Check Vercel dashboard for any errors

2. **Verify DNS Records:**
   - Use https://dnschecker.org to check DNS propagation
   - Verify records are correct in GoDaddy

3. **Contact Support:**
   - **Vercel Support:** https://vercel.com/support
   - **GoDaddy Support:** 1-480-505-8877

---

## ✅ Expected Result

After completing these steps:

- ✅ `https://expirycare.com` → Shows ExpiryCare homepage
- ✅ `https://expirycare.com/privacy` → Shows Privacy Policy page
- ✅ `https://expirycare.com/terms` → Shows Terms & Conditions page
- ✅ `https://expirycare.com/dashboard` → Shows Dashboard (if logged in)
- ✅ All pages work with HTTPS (SSL certificate active)

---

## 🎯 Summary

**The issue:** Domain is not connected to Vercel, showing parked page instead.

**The fix:**
1. Add domain to Vercel project
2. Configure DNS (nameservers or DNS records)
3. Wait for propagation
4. Verify in Vercel
5. Test the domain

**Time required:** 10-15 minutes setup + 1-2 hours for DNS propagation

