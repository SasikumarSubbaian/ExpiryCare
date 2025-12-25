# Quick Guide: Check GoDaddy DNS for Old Records

Since you can't find website builder, let's check DNS records instead.

## 🎯 Quick Steps

### Step 1: Go to DNS Management

1. Go to [dcc.godaddy.com](https://dcc.godaddy.com)
2. Sign in
3. Click **"My Products"** or find your domains
4. Click on **`expirycare.com`**
5. Click **"DNS"** tab (this is the important one!)

### Step 2: Check for Old Records

**Look at the DNS Records section. You should see:**

#### ✅ CORRECT (If Using Nameservers):
- **Nameservers:** `ns1.vercel-dns.com` and `ns2.vercel-dns.com`
- **No A records** (or very few)
- **No CNAME records pointing to GoDaddy**

#### ❌ WRONG (If You See These):
- **A records** with IPs like:
  - `50.63.202.xxx`
  - `192.xxx.xxx.xxx`
  - `97.74.xxx.xxx`
- **CNAME records** pointing to:
  - `ghs.googlehosted.com`
  - `*.secureserver.net`
  - Any GoDaddy domain

### Step 3: Delete Wrong Records

**If you see A records or CNAME records pointing to GoDaddy:**

1. Click the **three dots (⋯)** or **"Edit"** next to the record
2. Click **"Delete"** or **"Remove"**
3. Confirm deletion

**Keep only:**
- Nameservers: `ns1.vercel-dns.com` and `ns2.vercel-dns.com`
- (Or Vercel A/CNAME records if using that method)

---

## 📸 What to Look For

**In DNS tab, you might see something like:**

```
Records:
Type    Name    Value                    TTL
A       @       50.63.202.45            600    ← DELETE THIS
A       @       50.63.202.46            600    ← DELETE THIS
CNAME   www     ghs.googlehosted.com     600    ← DELETE THIS
```

**Should be:**
```
Nameservers:
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Or if using DNS records:**
```
Type    Name    Value                    TTL
A       @       76.76.21.21             600    ← Vercel IP
A       @       76.223.126.88           600    ← Vercel IP
CNAME   www     cname.vercel-dns.com    600    ← Vercel
```

---

## ✅ Action Items

1. **Go to DNS tab** in GoDaddy
2. **Delete any A records** with GoDaddy IPs
3. **Delete any CNAME records** pointing to GoDaddy
4. **Verify nameservers** are Vercel's
5. **Save changes**
6. **Wait 1-2 hours** for DNS to update
7. **Clear browser cache**
8. **Test again**

---

**The DNS tab is where the issue usually is! Check there first.** 🔍

