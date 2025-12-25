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

### Step 2: Configure DNS Records in GoDaddy

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

If you want to keep GoDaddy nameservers (for easier DNS management), add these records:

1. **A Record:**
   - **Type:** A
   - **Name:** `@` (or blank for root domain)
   - **Value:** [IP address from Vercel - usually `76.76.21.21` or similar]
   - **TTL:** 600

2. **CNAME Record (for www):**
   - **Type:** CNAME
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com.` (note the trailing dot)
   - **TTL:** 600

**Note:** Vercel will show you the exact values to use.

---

### Step 3: Verify Domain in Vercel

1. After adding DNS records, go back to Vercel Dashboard
2. Go to **Settings** → **Domains**
3. Find `expirycare.com` in the list
4. Wait for verification (can take 5-10 minutes)
5. You should see a green ✅ checkmark when verified

### Step 4: Wait for DNS Propagation

- DNS changes can take **5 minutes to 48 hours** to propagate globally
- Usually works within **1-2 hours**
- You can check propagation at: https://dnschecker.org

### Step 5: Test the Domain

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

---

## 📋 Quick Checklist

- [ ] Added `expirycare.com` to Vercel project (Settings → Domains)
- [ ] Added DNS records in GoDaddy (A record or nameservers)
- [ ] Waited 10-15 minutes for DNS propagation
- [ ] Verified domain in Vercel (green ✅ checkmark)
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

