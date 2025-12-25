# Domain Not Loading Correct Site - Troubleshooting Guide

## ❌ Problem

Your domain `expirycare.com` is connected in Vercel (shows "Valid Configuration"), but when you visit it, you see a GoDaddy placeholder page instead of your actual Vercel app.

## 🔍 Common Causes

1. **DNS still pointing to GoDaddy** (most common)
2. **Nameservers not updated** in GoDaddy
3. **DNS propagation still in progress** (can take 24-48 hours)
4. **Browser cache** showing old page
5. **GoDaddy hosting still active** on the domain

---

## ✅ Step-by-Step Fix

### Step 1: Verify Nameservers in GoDaddy

**This is the most important step!**

1. Go to [GoDaddy Domain Manager](https://dcc.godaddy.com)
2. Find `expirycare.com`
3. Click **"DNS"** or **"Manage DNS"**
4. Scroll to **"Nameservers"** section
5. **Check what's currently set:**

**Should be:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**If it shows GoDaddy nameservers like:**
```
ns01.domaincontrol.com
ns02.domaincontrol.com
```

**Then that's the problem!** You need to change them.

### Step 2: Update Nameservers in GoDaddy

1. In GoDaddy DNS settings, click **"Change"** next to Nameservers
2. Select **"Custom"**
3. Delete any existing nameservers
4. Add:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. Click **"Save"**
6. Wait for confirmation

### Step 3: Check DNS Propagation

**Wait 1-2 hours** (can take up to 24-48 hours), then check:

1. Go to [dnschecker.org](https://dnschecker.org)
2. Enter `expirycare.com`
3. Select **"NS"** (Nameservers) record type
4. Click **"Search"**
5. Check if nameservers are updating globally

**You should see:**
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

**If you still see GoDaddy nameservers**, DNS hasn't propagated yet. Wait longer.

### Step 4: Clear Browser Cache

1. **Chrome/Edge:**
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"

2. **Or use Incognito/Private mode:**
   - `Ctrl + Shift + N` (Chrome)
   - Visit `https://expirycare.com` in incognito

3. **Or hard refresh:**
   - `Ctrl + F5` (Windows)
   - `Cmd + Shift + R` (Mac)

### Step 5: Verify in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Check `expirycare.com` status
3. Should show **"Valid Configuration"** ✅
4. Click on the domain to see details
5. Verify it's pointing to your project

### Step 6: Check Vercel Deployment

1. Go to Vercel Dashboard → Deployments
2. Make sure latest deployment is **"Ready"** (green checkmark)
3. If deployment failed, fix it and redeploy

---

## 🔧 Alternative: Use DNS Records Instead

If you want to keep GoDaddy nameservers:

### Get DNS Records from Vercel

1. Go to Vercel → Settings → Domains
2. Click on `expirycare.com`
3. Look for **"DNS Records"** section
4. Copy the A records and CNAME records shown

### Add in GoDaddy

1. Go to GoDaddy → DNS Management
2. Delete any existing A records for `@` (root)
3. Add A records from Vercel:
   ```
   Type: A
   Name: @
   Value: (IP from Vercel)
   TTL: 600
   ```

4. Add CNAME for www:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 600
   ```

**Note:** Vercel will show you the exact current IP addresses to use.

---

## 🧪 Testing Steps

### Test 1: Check Nameservers

```bash
# In terminal/command prompt
nslookup -type=NS expirycare.com
```

Should show:
```
expirycare.com nameserver = ns1.vercel-dns.com
expirycare.com nameserver = ns2.vercel-dns.com
```

### Test 2: Check DNS Propagation

Visit: https://dnschecker.org/#NS/expirycare.com

Should show Vercel nameservers globally.

### Test 3: Check Direct IP

1. Get your Vercel deployment URL (e.g., `expirycare.vercel.app`)
2. Visit that URL directly
3. If that works, the issue is DNS
4. If that doesn't work, the issue is with Vercel deployment

### Test 4: Check from Different Location

- Use mobile data (not WiFi)
- Use different device
- Use VPN to different location
- Ask someone else to check

---

## ⏱️ Timeline Expectations

- **Immediate:** Nameserver change in GoDaddy (takes effect in minutes)
- **1-2 hours:** DNS starts propagating globally
- **24-48 hours:** Full DNS propagation worldwide
- **Your location:** May see changes faster (1-2 hours)

---

## 🚨 Common Issues

### Issue 1: Still Seeing GoDaddy Page After 24 Hours

**Possible causes:**
- Nameservers not saved correctly in GoDaddy
- Typo in nameserver (check spelling)
- GoDaddy hosting still active (disable it)

**Fix:**
1. Double-check nameservers in GoDaddy
2. Disable any GoDaddy hosting/website builder
3. Wait longer for propagation

### Issue 2: Domain Shows "Pending" in Vercel

**Fix:**
1. Verify nameservers are correct
2. Wait for DNS propagation
3. Click "Refresh" in Vercel dashboard

### Issue 3: SSL Certificate Not Working

**Fix:**
- Vercel auto-provisions SSL
- Wait 5-10 minutes after DNS propagates
- SSL will activate automatically

### Issue 4: www Works But Root Domain Doesn't

**Fix:**
- Check both domains in Vercel
- Verify A record for root domain (@)
- Check CNAME for www

---

## ✅ Verification Checklist

- [ ] Nameservers updated in GoDaddy to Vercel's
- [ ] DNS propagation checked (dnschecker.org)
- [ ] Browser cache cleared
- [ ] Tested in incognito mode
- [ ] Vercel deployment is successful
- [ ] Domain shows "Valid" in Vercel
- [ ] Waited at least 1-2 hours after nameserver change
- [ ] Tested from different device/network

---

## 🎯 Quick Fix Summary

**Most likely issue:** Nameservers still pointing to GoDaddy

**Quick fix:**
1. GoDaddy → DNS → Nameservers → Change
2. Set to: `ns1.vercel-dns.com` and `ns2.vercel-dns.com`
3. Save
4. Wait 1-2 hours
5. Clear browser cache
6. Test again

---

## 📞 Still Not Working?

1. **Verify Vercel deployment:**
   - Check if latest deployment succeeded
   - Check deployment logs for errors

2. **Check GoDaddy settings:**
   - Disable any website builder
   - Disable any hosting services
   - Only DNS should be active

3. **Contact support:**
   - Vercel support: https://vercel.com/support
   - GoDaddy support: https://www.godaddy.com/help

---

**The most common issue is nameservers not updated in GoDaddy. Check that first!** 🔍

