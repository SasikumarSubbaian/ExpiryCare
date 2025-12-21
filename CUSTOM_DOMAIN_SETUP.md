# Custom Domain Setup - expirycare.com

Complete guide for connecting your GoDaddy domain to Vercel deployment.

## 🎯 Overview

You have:
- ✅ Domain: `expirycare.com` (purchased from GoDaddy)
- ✅ Vercel deployment (or will deploy soon)
- ✅ Need to connect them together

**Result:** Your app will be live at `https://expirycare.com`

---

## 📋 Step-by-Step Setup

### Step 1: Deploy to Vercel First (If Not Done)

1. Go to [vercel.com](https://vercel.com)
2. Import your repository: `SasikumarSubbaian/ExpiryCare`
3. Add all environment variables (see `DEPLOYMENT_NEXT_STEPS.md`)
4. Deploy

You'll get a default URL like: `https://expirycare.vercel.app`

**Keep this URL handy** - you'll need it for DNS setup.

---

### Step 2: Add Domain in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Domains**
3. Click **"Add Domain"**
4. Enter your domain: `expirycare.com`
5. Click **"Add"**

Vercel will show you DNS configuration instructions.

---

### Step 3: Configure DNS in GoDaddy

You have two options:

#### Option A: Use Vercel's Nameservers (Recommended - Easier)

**This gives Vercel full control of DNS:**

1. Go to [GoDaddy Domain Manager](https://dcc.godaddy.com)
2. Find `expirycare.com` and click **"DNS"** or **"Manage DNS"**
3. Look for **"Nameservers"** section
4. Click **"Change"** or **"Edit"**
5. Select **"Custom"** nameservers
6. Add Vercel's nameservers (Vercel will show these, typically):
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
7. Click **"Save"**

**Note:** DNS propagation can take 24-48 hours, but usually works within a few hours.

#### Option B: Use GoDaddy Nameservers with DNS Records (More Control)

**Keep GoDaddy nameservers but add DNS records:**

1. Go to [GoDaddy Domain Manager](https://dcc.godaddy.com)
2. Find `expirycare.com` and click **"DNS"**
3. In DNS Records section, add these records:

**For Root Domain (expirycare.com):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `76.76.21.21` | 600 |
| A | @ | `76.223.126.88` | 600 |
| CNAME | www | `cname.vercel-dns.com` | 600 |

**Or use CNAME (if GoDaddy supports it for root):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | `cname.vercel-dns.com` | 600 |
| CNAME | www | `cname.vercel-dns.com` | 600 |

**Note:** Vercel will show you the exact values to use. Check Vercel dashboard for current IP addresses.

---

### Step 4: Verify Domain in Vercel

1. Go back to Vercel → Settings → Domains
2. You should see `expirycare.com` listed
3. Status will show:
   - ⏳ **"Pending"** - DNS not propagated yet
   - ✅ **"Valid"** - Domain is connected and SSL is active

**Wait for DNS propagation** (can take a few minutes to 48 hours, usually 1-2 hours).

---

### Step 5: SSL Certificate (Automatic)

Vercel automatically provisions SSL certificates via Let's Encrypt:
- ✅ Free SSL certificate
- ✅ Auto-renewal
- ✅ HTTPS enabled automatically
- ✅ Works for both `expirycare.com` and `www.expirycare.com`

**No action needed** - Vercel handles this automatically once DNS is configured.

---

## 🔍 Verification Steps

### Check DNS Propagation

Use these tools to verify DNS is propagating:

1. **DNS Checker:** https://dnschecker.org
   - Enter `expirycare.com`
   - Check A records point to Vercel IPs

2. **What's My DNS:** https://www.whatsmydns.net
   - Enter `expirycare.com`
   - Verify records are updating globally

### Test Your Domain

Once DNS propagates:

1. Visit `https://expirycare.com`
2. Should load your Vercel app
3. Check SSL certificate (lock icon in browser)
4. Test `https://www.expirycare.com` (should redirect or work)

---

## 🎯 Complete Checklist

### Vercel Setup
- [ ] Project deployed to Vercel
- [ ] Domain added in Vercel dashboard
- [ ] DNS configuration instructions viewed

### GoDaddy DNS Setup
- [ ] Logged into GoDaddy Domain Manager
- [ ] DNS records added (or nameservers changed)
- [ ] DNS changes saved

### Verification
- [ ] DNS propagation checked (via dnschecker.org)
- [ ] Domain shows as "Valid" in Vercel
- [ ] `https://expirycare.com` loads correctly
- [ ] SSL certificate active (lock icon)
- [ ] `www.expirycare.com` works (or redirects)

---

## 🛠️ Troubleshooting

### Domain Shows "Pending" in Vercel

**Possible causes:**
1. DNS not propagated yet (wait 1-24 hours)
2. Incorrect DNS records
3. Nameservers not updated

**Solutions:**
- Check DNS records are correct
- Verify nameservers if using Option A
- Wait longer for propagation
- Check Vercel dashboard for specific error messages

### Domain Not Loading

**Check:**
1. DNS propagation: Use dnschecker.org
2. Vercel deployment: Is app deployed?
3. DNS records: Are they correct?
4. Browser cache: Try incognito mode

### SSL Certificate Not Working

**Usually resolves automatically:**
- Wait 5-10 minutes after DNS propagates
- Vercel auto-provisions SSL
- Check Vercel dashboard for SSL status

**If still not working:**
- Remove domain in Vercel and re-add
- Check DNS records are correct
- Contact Vercel support

### www vs Non-www

**Vercel automatically handles both:**
- `expirycare.com` ✅
- `www.expirycare.com` ✅

**To force one:**
- Vercel → Settings → Domains
- Configure redirect (www to non-www or vice versa)

---

## 📝 DNS Record Examples

### For GoDaddy (Option B - DNS Records)

**Root Domain (expirycare.com):**

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

**WWW Subdomain:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600
```

**Note:** Vercel will show you the exact current IP addresses to use. Always check Vercel dashboard for latest values.

---

## 🔄 After Domain is Connected

### Update Email Configuration

If using Resend with custom domain:

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add domain: `expirycare.com`
3. Add DNS records shown by Resend
4. Verify domain
5. Update `RESEND_FROM_EMAIL` in Vercel:
   ```
   ExpiryCare <reminders@expirycare.com>
   ```

### Update Any Hardcoded URLs

Search your codebase for:
- `localhost:3000` → Replace with `expirycare.com`
- `vercel.app` URLs → Replace with `expirycare.com`
- Any other hardcoded URLs

### Update Social Media / Marketing

- Update links to use `expirycare.com`
- Update email signatures
- Update any documentation

---

## 🎓 Best Practices

1. **Use Vercel Nameservers (Option A):**
   - Easier to manage
   - Automatic DNS management
   - Better performance

2. **Enable Both www and non-www:**
   - Vercel handles both automatically
   - Configure redirect preference

3. **Monitor DNS:**
   - Check propagation status
   - Verify SSL certificate
   - Test both www and non-www

4. **Keep GoDaddy Account Active:**
   - Domain registration must stay active
   - Renew domain before expiration

---

## 📞 Support Resources

### Vercel
- **Domain Docs:** https://vercel.com/docs/concepts/projects/domains
- **Support:** https://vercel.com/support

### GoDaddy
- **DNS Help:** https://www.godaddy.com/help
- **Support:** Contact GoDaddy support

### DNS Tools
- **DNS Checker:** https://dnschecker.org
- **What's My DNS:** https://www.whatsmydns.net

---

## ✅ Quick Summary

1. **Deploy to Vercel** (if not done)
2. **Add domain in Vercel** → Settings → Domains
3. **Configure DNS in GoDaddy:**
   - Option A: Change nameservers to Vercel's
   - Option B: Add DNS records (A and CNAME)
4. **Wait for DNS propagation** (1-24 hours)
5. **Verify domain works** → Visit `https://expirycare.com`
6. **SSL auto-provisions** → No action needed

---

**Your app will be live at:** `https://expirycare.com` 🚀

**Last Updated:** Custom domain setup guide
**Status:** Ready to use ✅

