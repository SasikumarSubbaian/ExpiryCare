# Fix: Google OAuth Not Working Locally

## ❌ Error You're Seeing

```
400 Bad Request
"Unsupported provider: provider is not enabled"
```

**Problem:** Google OAuth is enabled in **production** Supabase project, but **NOT** in **development** project.

Your local dev server uses: `kmbpjdgiqrohvophfbes.supabase.co` (dev project)
But Google OAuth is only set up in: `rfqwevpkydlwftraiqmn.supabase.co` (prod project)

---

## ✅ Solution: Enable Google OAuth in Dev Project

### Step 1: Go to Development Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **development** project (`kmbpjdgiqrohvophfbes`)
3. Go to **Authentication** → **Providers**

### Step 2: Enable Google Provider

1. Find **Google** provider in the list
2. Click **"Enable"** or toggle it **ON**
3. Enter the **same** Google OAuth credentials:
   - **Client ID (for OAuth):** Your Google Client ID
   - **Client Secret (for OAuth):** Your Google Client Secret
   - (Same ones you used for production)
4. Click **"Save"**

### Step 3: Add Redirect URLs for Dev

In Supabase → Authentication → URL Configuration:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs:** Add:
```
http://localhost:3000/auth/callback
```

### Step 4: Update Google Cloud Console (If Needed)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Go to **APIs & Services** → **Credentials**
3. Find your OAuth client ID
4. Click **Edit**
5. In **Authorized redirect URIs**, make sure you have:
   ```
   https://kmbpjdgiqrohvophfbes.supabase.co/auth/v1/callback
   ```
   (Your dev Supabase project callback URL)
6. Click **Save**

### Step 5: Test Again

1. Restart dev server (if running):
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. Visit: `http://localhost:3000/signup`
3. Click "Sign up with Google"
4. Should work now! ✅

---

## 🔍 Quick Verification

### Check Dev Project Has Google Enabled:

1. Supabase Dashboard → Dev Project
2. Authentication → Providers
3. Google should show **"Enabled"** (green toggle)

### Check Redirect URLs:

1. Supabase Dashboard → Dev Project
2. Authentication → URL Configuration
3. Should have: `http://localhost:3000/auth/callback`

---

## 📋 Checklist

- [ ] Google provider enabled in **dev** Supabase project
- [ ] Google Client ID added in dev project
- [ ] Google Client Secret added in dev project
- [ ] Redirect URL added: `http://localhost:3000/auth/callback`
- [ ] Google Cloud Console has dev callback URL
- [ ] Restarted dev server
- [ ] Tested Google OAuth - should work

---

## 💡 Why This Happens

- **Local dev** uses `.env.local` → points to **dev** Supabase project
- **Production** uses Vercel env vars → points to **prod** Supabase project
- Google OAuth must be enabled in **both** projects

**You can use the same Google OAuth credentials for both projects!**

---

## 🎯 Quick Fix

**Right now:**

1. **Supabase Dashboard** → Select **dev** project (`kmbpjdgiqrohvophfbes`)
2. **Authentication** → **Providers** → **Google**
3. **Enable** and add Client ID/Secret
4. **Save**
5. **Test again** - should work! ✅

---

**The issue is Google OAuth is only enabled in production. Enable it in your dev project too!** 🔧

