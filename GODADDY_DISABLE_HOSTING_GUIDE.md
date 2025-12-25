# How to Disable GoDaddy Website Builder/Hosting - Step by Step

Detailed guide to find and disable GoDaddy website builder or hosting services.

## 🎯 Where to Look in GoDaddy

GoDaddy has different interfaces, so the location varies. Here are all the places to check:

---

## 📍 Method 1: GoDaddy Domain Manager (Most Common)

### Step 1: Access Domain Manager

1. Go to [dcc.godaddy.com](https://dcc.godaddy.com) or [godaddy.com](https://godaddy.com)
2. Sign in to your account
3. Click **"My Products"** or **"Domains"** in the top menu
4. Find `expirycare.com` in your domain list
5. Click on the domain name

### Step 2: Look for Website/Hosting Options

**Look for these sections/tabs:**

1. **"DNS"** tab - Click this first
   - Look for any A records pointing to GoDaddy IPs
   - Look for CNAME records pointing to GoDaddy hosting

2. **"Website"** tab - If you see this:
   - Click on it
   - Look for "Website Builder", "Quick Setup", or "GoDaddy Studio"
   - Click "Remove" or "Disable"

3. **"Hosting"** tab - If you see this:
   - Click on it
   - Look for active hosting plans
   - Cancel or remove hosting

4. **"Email & Office"** tab - Usually safe, but check if there's website builder here

---

## 📍 Method 2: GoDaddy My Products Page

### Step 1: Go to My Products

1. Go to [godaddy.com](https://godaddy.com)
2. Sign in
3. Click **"My Products"** (usually in top right or main menu)

### Step 2: Check for Active Services

**Look for these sections:**

1. **"Websites"** section:
   - If you see `expirycare.com` listed here
   - Click on it
   - Look for "Manage" or "Settings"
   - Find "Delete Website" or "Remove Website"

2. **"Hosting"** section:
   - If you see any hosting plans
   - Click on them
   - Look for "Cancel" or "Remove"

3. **"Website Builder"** section:
   - If you see GoDaddy Website Builder
   - Click on it
   - Look for "Delete" or "Remove"

---

## 📍 Method 3: GoDaddy Studio (If You See the Banner)

If you saw a "GoDaddy Studio" banner on your site:

1. Go to [studio.godaddy.com](https://studio.godaddy.com)
2. Sign in
3. Look for any websites/projects
4. Delete or unpublish them

---

## 📍 Method 4: Check DNS Records Directly

Even if you can't find website builder, check DNS records:

### Step 1: Go to DNS Management

1. Go to [dcc.godaddy.com](https://dcc.godaddy.com)
2. Click on `expirycare.com`
3. Click **"DNS"** tab

### Step 2: Check A Records

**Look for A records that point to GoDaddy:**

**If you see A records like:**
```
Type: A
Name: @
Value: 50.63.202.xxx (GoDaddy IP)
```

**Or:**
```
Type: A
Name: @
Value: 192.xxx.xxx.xxx (GoDaddy IP)
```

**Delete these A records** - They're pointing to GoDaddy hosting instead of Vercel.

### Step 3: Check CNAME Records

**If you see CNAME records like:**
```
Type: CNAME
Name: www
Value: ghs.googlehosted.com
```

**Or pointing to GoDaddy:**
```
Type: CNAME
Name: www
Value: *.secureserver.net
```

**Delete these** - They're for GoDaddy hosting.

**Should only have:**
- A records pointing to Vercel IPs (if using DNS records method)
- CNAME pointing to `cname.vercel-dns.com` (if using DNS records method)
- Or just nameservers set to Vercel (if using nameserver method)

---

## 🔍 What to Look For (Visual Guide)

### In Domain Manager, Look For:

**Tabs/Sections:**
- ✅ "DNS" - This is what you want (for nameservers)
- ❌ "Website" - Check this for website builder
- ❌ "Hosting" - Check this for hosting
- ❌ "Quick Setup" - Check this
- ❌ "Website Builder" - Check this
- ❌ "GoDaddy Studio" - Check this

**Buttons/Actions:**
- ❌ "Build Website"
- ❌ "Quick Setup"
- ❌ "Enable Website Builder"
- ❌ "Manage Website"
- ✅ "Manage DNS" - This is what you want

---

## 🎯 Step-by-Step: Most Likely Location

### If You Have Website Builder Active:

1. **Go to:** [dcc.godaddy.com](https://dcc.godaddy.com)
2. **Click:** "My Products" or "Domains"
3. **Find:** `expirycare.com`
4. **Click:** On the domain name
5. **Look for tabs:** "Website", "Hosting", or "Quick Setup"
6. **Click:** On any of these tabs
7. **Look for:** "Remove", "Delete", "Disable", or "Cancel"
8. **Click:** To remove/disable

### If You Don't See Website Tabs:

**Then website builder might not be active!** The issue might be:

1. **DNS still propagating** - Wait longer
2. **Browser cache** - Clear cache
3. **Old DNS records** - Check DNS tab for old A records

---

## ✅ What Your DNS Should Look Like

### If Using Vercel Nameservers (Recommended):

**In GoDaddy DNS tab, you should see:**

**Nameservers section:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**That's it!** No A records, no CNAME records needed.

### If Using DNS Records (Alternative):

**In GoDaddy DNS tab, you should have:**

**A Records:**
```
Type: A
Name: @
Value: (Vercel IP - get from Vercel dashboard)
TTL: 600
```

**CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600
```

**No GoDaddy IPs, no GoDaddy hosting records!**

---

## 🚨 If You Can't Find Website Builder

**If you've looked everywhere and can't find website builder/hosting:**

1. **It might not be active** - Good news!
2. **The issue is likely:**
   - DNS propagation (wait longer)
   - Browser cache (clear it)
   - Old DNS records (check DNS tab)

### What to Do:

1. **Check DNS tab:**
   - Go to DNS management
   - Delete any A records pointing to GoDaddy IPs
   - Make sure nameservers are set to Vercel

2. **Wait for DNS propagation:**
   - Can take 24-48 hours
   - Check: https://dnschecker.org/#A/expirycare.com

3. **Clear browser cache:**
   - Hard refresh: `Ctrl + F5`
   - Or use incognito mode

---

## 📞 Alternative: Contact GoDaddy Support

If you still can't find it:

1. **GoDaddy Support:** https://www.godaddy.com/help
2. **Chat or Call:** Available 24/7
3. **Ask them:** "How do I disable website builder/hosting for expirycare.com?"
4. **Or ask:** "How do I make sure only DNS is active, no hosting?"

---

## ✅ Quick Checklist

- [ ] Checked "My Products" page for Websites section
- [ ] Checked Domain Manager for "Website" tab
- [ ] Checked Domain Manager for "Hosting" tab
- [ ] Checked DNS tab for GoDaddy A records (delete if found)
- [ ] Verified nameservers are set to Vercel
- [ ] Cleared browser cache
- [ ] Waited for DNS propagation

---

## 🎯 Most Important: Check DNS Tab

**Even if you can't find website builder, check DNS:**

1. Go to Domain Manager → DNS tab
2. Look for A records with GoDaddy IPs
3. **Delete them** if found
4. Make sure nameservers are: `ns1.vercel-dns.com` and `ns2.vercel-dns.com`

**This is often the real issue!** Old DNS records pointing to GoDaddy.

---

**If you can't find website builder, it might not be active. Focus on checking DNS records instead!** 🔍

