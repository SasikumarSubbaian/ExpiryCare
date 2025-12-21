# Fix: Google OAuth redirect_uri_mismatch Error

## ❌ Error You're Seeing

```
Error 400: redirect_uri_mismatch
"Access blocked: This app's request is invalid"
```

**Problem:** The redirect URI in Google Cloud Console doesn't match what Supabase is sending to Google.

---

## 🔍 Understanding the Flow

**How Google OAuth works with Supabase:**

1. User clicks "Sign up with Google"
2. App calls Supabase OAuth
3. **Supabase redirects to Google** with its own callback URL
4. Google redirects back to **Supabase's callback URL** (not your app)
5. Supabase processes OAuth
6. Supabase redirects to your app's `/auth/callback`
7. Your app redirects to `/dashboard`

**Important:** Google needs to redirect to **Supabase's callback URL**, not your app's URL!

---

## ✅ Solution: Fix Redirect URI in Google Cloud Console

### Step 1: Get Supabase Callback URL

**For Development Project:**
```
https://kmbpjdgiqrohvophfbes.supabase.co/auth/v1/callback
```

**For Production Project:**
```
https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback
```

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Go to **APIs & Services** → **Credentials**
3. Find your **OAuth 2.0 Client ID**
4. Click **Edit** (pencil icon)
5. In **Authorized redirect URIs**, you should have **ONLY**:

```
https://kmbpjdgiqrohvophfbes.supabase.co/auth/v1/callback
https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback
```

6. **Remove these if present:**
   - ❌ `http://localhost:3000/auth/callback`
   - ❌ `https://localhost:3000/auth/callback`
   - ❌ Any other localhost URLs

7. **Important:**
   - URLs must match **exactly** (including `https://`)
   - No trailing slashes
   - Must include `/auth/v1/callback` path

8. Click **Save**

### Step 3: Verify Supabase Configuration

1. Go to Supabase Dashboard → **Development** project
2. Go to **Authentication** → **URL Configuration**
3. **Site URL:** Should be `http://localhost:3000` (for dev)
4. **Redirect URLs:** Should include:
   ```
   http://localhost:3000/auth/callback
   ```

**Note:** This is where Supabase redirects AFTER processing OAuth, not where Google redirects.

### Step 4: Clear Browser Cache

1. **Clear cookies:**
   - `Ctrl + Shift + Delete`
   - Select "Cookies and other site data"
   - Clear for `accounts.google.com`

2. **Or use Incognito:**
   - `Ctrl + Shift + N`
   - Test in incognito window

### Step 5: Test Again

1. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Visit:** `http://localhost:3000/signup`
3. **Click:** "Sign up with Google"
4. **Should work now!** ✅

---

## 🔍 Common Mistakes

### ❌ Wrong Redirect URIs in Google Console:
```
http://localhost:3000/auth/callback          (Wrong - Google doesn't redirect here)
https://localhost:3000/auth/callback          (Wrong - localhost with https)
https://kmbpjdgiqrohvophfbes.supabase.co     (Wrong - missing /auth/v1/callback)
https://kmbpjdgiqrohvophfbes.supabase.co/    (Wrong - trailing slash)
```

### ✅ Correct Redirect URIs in Google Console:
```
https://kmbpjdgiqrohvophfbes.supabase.co/auth/v1/callback
https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback
```

**These are Supabase's callback URLs, not your app's URLs!**

---

## 📋 Verification Checklist

- [ ] Google Cloud Console has **Supabase callback URLs** (not localhost)
- [ ] Dev URL: `https://kmbpjdgiqrohvophfbes.supabase.co/auth/v1/callback`
- [ ] Prod URL: `https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback`
- [ ] URLs match exactly (no typos, correct https, correct path)
- [ ] Removed any localhost URLs from Google Console
- [ ] Supabase has redirect URL: `http://localhost:3000/auth/callback`
- [ ] Cleared browser cache/cookies
- [ ] Restarted dev server
- [ ] Tested Google OAuth - should work

---

## 🎯 Quick Fix (Do This Now)

**Right now:**

1. **Google Cloud Console:**
   - APIs & Services → Credentials
   - Edit your OAuth Client ID
   - **Authorized redirect URIs** should be:
     - `https://kmbpjdgiqrohvophfbes.supabase.co/auth/v1/callback`
     - `https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback`
   - **Remove** any `localhost` URLs
   - **Save**

2. **Clear browser cache:**
   - `Ctrl + Shift + Delete` → Clear cookies

3. **Test:**
   - Visit `http://localhost:3000/signup`
   - Click "Sign up with Google"
   - Should work! ✅

---

## 💡 Key Point

**Google Cloud Console redirect URIs = Supabase callback URLs**
**NOT your app's callback URLs!**

- **Google redirects to:** `https://xxx.supabase.co/auth/v1/callback`
- **Supabase redirects to:** `http://localhost:3000/auth/callback` (your app)
- **Your app redirects to:** `/dashboard`

---

**The fix: Use Supabase's callback URL in Google Cloud Console, not localhost!** 🔧
