# Fix: Hide Supabase URL in Google OAuth Consent Screen

## ❌ Current Issue

The Google OAuth consent screen shows:
```
Sign in to kmbpjdgiqrohvophfbes.supabase.co
```

**Problem:** Users see the technical Supabase project URL instead of your app name.

---

## ✅ Solution: Configure OAuth Consent Screen

### Step 1: Configure Google Cloud Console OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**

4. **Configure the consent screen:**

   **App Information:**
   - **App name:** `ExpiryCare` (or your preferred name)
   - **User support email:** Your email
   - **App logo:** Upload your app logo (optional, recommended)
   - **App domain:** `expirycare.com`
   - **Developer contact information:** Your email

   **Scopes:**
   - Click **Add or Remove Scopes**
   - Select:
     - `.../auth/userinfo.email` (Email address)
     - `.../auth/userinfo.profile` (Name and profile picture)
   - Click **Update**

   **Test users (if app is in Testing mode):**
   - Add your email: `sasikumar.subbaiyan@gmail.com`
   - Add any other test emails

5. Click **Save and Continue** through all steps
6. Click **Back to Dashboard**

### Step 2: Configure Supabase Site Name

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **development** project (`kmbpjdgiqrohvophfbes`)
3. Go to **Authentication** → **URL Configuration**
4. Set **Site Name:** `ExpiryCare`
5. **Site URL:** `http://localhost:3000` (for dev)
6. **Redirect URLs:** Add:
   ```
   http://localhost:3000/auth/callback
   https://expirycare.com/auth/callback
   ```
7. Click **Save**

### Step 3: Configure Production Supabase (if different)

1. Select your **production** project (`rfqwevpkydlwftraiqmn`)
2. Go to **Authentication** → **URL Configuration**
3. Set **Site Name:** `ExpiryCare`
4. **Site URL:** `https://expirycare.com`
5. **Redirect URLs:** Add:
   ```
   https://expirycare.com/auth/callback
   ```
6. Click **Save**

### Step 4: Update OAuth Provider Settings in Supabase

1. Go to **Authentication** → **Providers** → **Google**
2. Verify:
   - **Client ID:** Your Google Client ID
   - **Client Secret:** Your Google Client Secret
   - **Enabled:** ✅ Toggled ON
3. Click **Save**

### Step 5: Test

1. **Clear browser cache:**
   - `Ctrl + Shift + Delete` → Clear cookies
   - Or use Incognito: `Ctrl + Shift + N`

2. **Visit:** `http://localhost:3000/signup`
3. **Click:** "Sign up with Google"
4. **Should now show:**
   ```
   Sign in to ExpiryCare
   ```
   Instead of the Supabase URL! ✅

---

## 🔒 Security Best Practices

### 1. OAuth Consent Screen Configuration

**Required Settings:**
- ✅ **App name:** Use your brand name (ExpiryCare)
- ✅ **User support email:** Your support email
- ✅ **Developer contact:** Your email
- ✅ **Privacy policy URL:** `https://expirycare.com/privacy` (create this page)
- ✅ **Terms of service URL:** `https://expirycare.com/terms` (create this page)

**Recommended:**
- ✅ **App logo:** Upload your logo (builds trust)
- ✅ **App domain:** `expirycare.com`
- ✅ **Authorized domains:** `expirycare.com`

### 2. Supabase Security Settings

1. **Authentication** → **Settings:**
   - ✅ **Enable email confirmations:** ON (recommended)
   - ✅ **Enable phone confirmations:** ON (if using phone auth)
   - ✅ **Enable email change confirmations:** ON

2. **Authentication** → **URL Configuration:**
   - ✅ **Site URL:** Your production domain
   - ✅ **Redirect URLs:** Only your app's callback URLs
   - ✅ **Site Name:** Your app name (not Supabase URL)

3. **Authentication** → **Providers:**
   - ✅ **Google:** Enabled with correct Client ID/Secret
   - ✅ **Email:** Enabled (for email/password auth)

### 3. Environment Variables Security

**Never commit:**
- ❌ Real API keys
- ❌ Service role keys
- ❌ Client secrets

**Always use:**
- ✅ `.env.local` for local development (gitignored)
- ✅ Vercel environment variables for production
- ✅ `.env*.example` files with placeholders

### 4. Google Cloud Console Security

1. **OAuth Client ID:**
   - ✅ **Application type:** Web application
   - ✅ **Authorized redirect URIs:** Only Supabase callback URLs
   - ✅ **Authorized JavaScript origins:** Only your domains

2. **OAuth Consent Screen:**
   - ✅ **Publishing status:** Published (after testing)
   - ✅ **Scopes:** Only required scopes (email, profile)
   - ✅ **Test users:** Remove after publishing

3. **API Restrictions:**
   - ✅ Restrict API access if possible
   - ✅ Use service accounts for server-to-server calls

---

## 📋 Verification Checklist

- [ ] Google OAuth consent screen shows "ExpiryCare" (not Supabase URL)
- [ ] Supabase Site Name set to "ExpiryCare"
- [ ] Google Cloud Console OAuth app name is "ExpiryCare"
- [ ] Privacy policy URL added (create `/privacy` page)
- [ ] Terms of service URL added (create `/terms` page)
- [ ] App logo uploaded to Google Cloud Console
- [ ] Only required OAuth scopes enabled
- [ ] Authorized redirect URIs are only Supabase URLs
- [ ] Tested OAuth flow - shows correct app name
- [ ] Environment variables secured (not in git)

---

## 🎯 Quick Fix Steps

**Right now:**

1. **Google Cloud Console:**
   - OAuth consent screen → Edit
   - **App name:** `ExpiryCare`
   - **App logo:** Upload logo (optional)
   - **Privacy policy:** `https://expirycare.com/privacy`
   - **Terms of service:** `https://expirycare.com/terms`
   - **Save**

2. **Supabase Dashboard:**
   - Authentication → URL Configuration
   - **Site Name:** `ExpiryCare`
   - **Save**

3. **Test:**
   - Clear browser cache
   - Visit `http://localhost:3000/signup`
   - Click "Sign up with Google"
   - Should show "Sign in to ExpiryCare" ✅

---

## 💡 Additional Security Recommendations

### Create Privacy Policy & Terms Pages

**Create these pages in your app:**

1. **`app/privacy/page.tsx`** - Privacy policy
2. **`app/terms/page.tsx`** - Terms of service

**These are required for:**
- Google OAuth consent screen
- App Store submissions (if mobile app)
- GDPR compliance
- User trust

### Example Privacy Policy URL Structure:
```
https://expirycare.com/privacy
```

### Example Terms URL Structure:
```
https://expirycare.com/terms
```

---

**After these changes, users will see "Sign in to ExpiryCare" instead of the Supabase URL!** 🔒✨

