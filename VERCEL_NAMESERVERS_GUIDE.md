# How to Find Vercel Nameservers in Your Dashboard

Step-by-step guide to find and confirm Vercel nameservers when setting up your custom domain.

## 📍 Where to Find Nameservers in Vercel

### Step 1: Add Your Domain to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project (e.g., `expirycare`)
3. Go to **Settings** tab
4. Click **Domains** in the left sidebar
5. Click **"Add Domain"** button
6. Enter your domain: `expirycare.com`
7. Click **"Add"**

### Step 2: View DNS Configuration

After adding the domain, Vercel will show you DNS configuration options:

**You'll see two options:**

#### Option A: Use Vercel Nameservers (Recommended)

Vercel will display:
```
Use these nameservers:
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**This is what you need!** ✅

#### Option B: Use DNS Records

If you choose to keep your current nameservers, Vercel will show:
- A records with IP addresses
- CNAME records

---

## 🔍 Exact Location in Vercel Dashboard

**Path:**
```
Vercel Dashboard 
  → Your Project 
    → Settings 
      → Domains 
        → Add Domain 
          → (After adding domain)
            → DNS Configuration Section
```

**What you'll see:**

```
┌─────────────────────────────────────────┐
│  Domain: expirycare.com                 │
│  Status: Pending                         │
│                                          │
│  Configure DNS                           │
│  ┌───────────────────────────────────┐ │
│  │ Option 1: Use Vercel Nameservers  │ │
│  │                                   │ │
│  │ ns1.vercel-dns.com                │ │
│  │ ns2.vercel-dns.com                │ │
│  │                                   │ │
│  │ Copy these to your domain         │ │
│  │ registrar (GoDaddy)                │ │
│  └───────────────────────────────────┘ │
│                                          │
│  Option 2: Use DNS Records               │
│  (A records, CNAME records)              │
└─────────────────────────────────────────┘
```

---

## ✅ How to Confirm Nameservers

### Method 1: Check in Vercel Dashboard

1. Go to **Settings** → **Domains**
2. Click on your domain (`expirycare.com`)
3. Look for **"Nameservers"** section
4. You should see:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

### Method 2: Check Domain Status

1. In **Settings** → **Domains**
2. Find your domain in the list
3. Click on it to see details
4. The nameservers will be shown in the configuration section

### Method 3: After DNS Propagation

1. Wait for DNS to propagate (1-24 hours)
2. Domain status will change from **"Pending"** to **"Valid"**
3. This confirms nameservers are correctly configured

---

## 🎯 Standard Vercel Nameservers

**Vercel's standard nameservers are:**
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

**These are the same for all Vercel projects.** ✅

---

## 📝 Step-by-Step: Setting Up in GoDaddy

### 1. Get Nameservers from Vercel

Follow steps above to see nameservers in Vercel dashboard.

### 2. Update in GoDaddy

1. Go to [GoDaddy Domain Manager](https://dcc.godaddy.com)
2. Find `expirycare.com`
3. Click **"DNS"** or **"Manage DNS"**
4. Scroll to **"Nameservers"** section
5. Click **"Change"**
6. Select **"Custom"**
7. Enter:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
8. Click **"Save"**

### 3. Verify in Vercel

1. Go back to Vercel → Settings → Domains
2. Wait for DNS propagation (1-24 hours)
3. Status will change to **"Valid"** ✅

---

## 🔍 Troubleshooting

### Can't Find Nameservers in Vercel?

**If you don't see nameservers:**
1. Make sure you've added the domain first
2. Check if domain is in "Pending" status
3. Try refreshing the page
4. Look for "DNS Configuration" or "Configure DNS" section

### Nameservers Not Working?

1. **Verify in GoDaddy:**
   - Check nameservers are saved correctly
   - No typos (should be exactly `ns1.vercel-dns.com`)

2. **Check DNS Propagation:**
   - Use [dnschecker.org](https://dnschecker.org)
   - Enter `expirycare.com`
   - Check if nameservers are updating globally

3. **Wait Longer:**
   - DNS can take 24-48 hours to fully propagate
   - Usually works within 1-2 hours

---

## ✅ Quick Verification Checklist

- [ ] Domain added in Vercel dashboard
- [ ] Nameservers visible in Vercel: `ns1.vercel-dns.com` and `ns2.vercel-dns.com`
- [ ] Nameservers updated in GoDaddy
- [ ] DNS propagation checked (dnschecker.org)
- [ ] Domain status in Vercel shows "Valid" (after propagation)

---

## 📞 Still Can't Find It?

**Alternative: Use DNS Records Instead**

If you can't find nameservers or prefer to keep GoDaddy nameservers:

1. In Vercel → Settings → Domains
2. Click on your domain
3. Look for **"DNS Records"** option
4. Use A records and CNAME records shown
5. Add them in GoDaddy DNS settings

**But using Vercel nameservers is easier and recommended!**

---

**The nameservers `ns1.vercel-dns.com` and `ns2.vercel-dns.com` are standard for all Vercel projects. You'll see them after adding your domain in the Vercel dashboard.** ✅

