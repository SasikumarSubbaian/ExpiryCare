# GoDaddy Domain Setup - expirycare.com

Quick guide for connecting your GoDaddy domain to Vercel.

## 🎯 Quick Steps (5-10 minutes)

### Step 1: Add Domain in Vercel

1. Go to [vercel.com](https://vercel.com) → Your Project
2. Click **Settings** → **Domains**
3. Click **"Add Domain"**
4. Enter: `expirycare.com`
5. Click **"Add"**

Vercel will show you DNS configuration.

### Step 2: Configure DNS in GoDaddy

**Option A: Use Vercel Nameservers (Easiest - Recommended)**

1. Go to [GoDaddy Domain Manager](https://dcc.godaddy.com)
2. Find `expirycare.com` → Click **"DNS"** or **"Manage DNS"**
3. Scroll to **"Nameservers"** section
4. Click **"Change"**
5. Select **"Custom"**
6. Replace with Vercel's nameservers (shown in Vercel dashboard):
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
7. Click **"Save"**

**Option B: Keep GoDaddy Nameservers (Add DNS Records)**

1. Go to [GoDaddy Domain Manager](https://dcc.godaddy.com)
2. Find `expirycare.com` → Click **"DNS"**
3. In DNS Records, add:

**For Root Domain:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 600

Type: A
Name: @
Value: 76.223.126.88
TTL: 600
```

**For WWW:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600
```

**Note:** Vercel will show you the exact current IP addresses. Always use the values from Vercel dashboard.

### Step 3: Wait for DNS Propagation

- Usually takes 1-2 hours
- Can take up to 24-48 hours
- Check status: https://dnschecker.org

### Step 4: Verify in Vercel

1. Go to Vercel → Settings → Domains
2. Status should change from "Pending" to "Valid"
3. SSL certificate auto-provisions (takes 5-10 minutes)

### Step 5: Test Your Domain

Visit: `https://expirycare.com`

Should load your app! ✅

---

## ✅ Checklist

- [ ] Domain added in Vercel
- [ ] DNS configured in GoDaddy (nameservers or records)
- [ ] DNS propagated (check dnschecker.org)
- [ ] Domain shows "Valid" in Vercel
- [ ] `https://expirycare.com` loads correctly
- [ ] SSL certificate active (lock icon in browser)
- [ ] `https://www.expirycare.com` works

---

## 🛠️ Troubleshooting

### Domain Still Pending

- Wait longer (can take 24 hours)
- Check DNS records are correct
- Verify nameservers if using Option A

### Domain Not Loading

- Check DNS propagation: https://dnschecker.org
- Verify Vercel deployment is successful
- Try incognito mode (clear cache)

### SSL Not Working

- Wait 5-10 minutes after DNS propagates
- Vercel auto-provisions SSL
- Check Vercel dashboard for SSL status

---

## 📝 After Domain is Live

### Update Environment Variables

Add to Vercel environment variables:
```
NEXT_PUBLIC_SITE_URL=https://expirycare.com
```

### Update Email (Resend)

If using custom domain for emails:
1. Go to Resend → Domains
2. Add `expirycare.com`
3. Add DNS records shown by Resend
4. Verify domain
5. Update `RESEND_FROM_EMAIL`:
   ```
   ExpiryCare <reminders@expirycare.com>
   ```

---

## 🎓 Which Option to Choose?

**Option A (Vercel Nameservers):**
- ✅ Easier setup
- ✅ Automatic DNS management
- ✅ Better performance
- ✅ Recommended for most users

**Option B (GoDaddy DNS Records):**
- ✅ Keep GoDaddy nameservers
- ✅ More control
- ✅ Good if you have other services on GoDaddy

---

**Your site will be live at:** `https://expirycare.com` 🚀

For detailed instructions, see `CUSTOM_DOMAIN_SETUP.md`

