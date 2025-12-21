# Complete Guide: Hide Supabase URL in Google OAuth

## 🎯 Goal

Hide `kmbpjdgiqrohvophfbes.supabase.co` from Google OAuth pages and show "ExpiryCare" instead.

---

## ⚠️ Important Limitation

**Google shows the domain that makes the OAuth request.** Since Supabase handles OAuth, Google will show the Supabase domain. However, we can make "ExpiryCare" the prominent name.

---

## ✅ Solution: Complete OAuth Consent Screen Setup

### Step 1: Configure Google Cloud Console (CRITICAL)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**

4. **Edit App Information:**
   - **App name:** `ExpiryCare` ⭐ (This is what users will see)
   - **User support email:** `your-email@example.com`
   - **App logo:** Upload ExpiryCare logo (256x256px PNG, recommended)
   - **App domain:** `expirycare.com`
   - **Application home page:** `https://expirycare.com`
   - **Privacy policy link:** `https://expirycare.com/privacy` ⭐ (Required)
   - **Terms of service link:** `https://expirycare.com/terms` ⭐ (Required)
   - **Authorized domains:** Add `expirycare.com`
   - **Developer contact information:** Your email

5. **Scopes:**
   - Click **"Add or Remove Scopes"**
   - Select ONLY:
     - ✅ `.../auth/userinfo.email` (Email address)
     - ✅ `.../auth/userinfo.profile` (Name and profile picture)
   - Remove any other scopes
   - Click **Update**

6. **Test users (if in Testing mode):**
   - Add: `sasikumar.subbaiyan@gmail.com`
   - Add any other test emails

7. **IMPORTANT: Publish the App** ⭐
   - Scroll to bottom
   - Click **"PUBLISH APP"** button
   - Confirm publishing
   - **This is critical!** Testing mode shows Supabase URL more prominently.

8. Click **Save and Continue** through all steps

### Step 2: Verify OAuth Client Configuration

1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID
3. Click **Edit**
4. Verify:
   - **Name:** `ExpiryCare Web`
   - **Authorized redirect URIs:**
     ```
     https://kmbpjdgiqrohvophfbes.supabase.co/auth/v1/callback
     https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback
     ```
5. Click **Save**

### Step 3: Configure Supabase Site Name

**Development Project:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select **development** project (`kmbpjdgiqrohvophfbes`)
3. Go to **Authentication** → **URL Configuration**
4. Set:
   - **Site Name:** `ExpiryCare` ⭐
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:**
     ```
     http://localhost:3000/auth/callback
     https://expirycare.com/auth/callback
     ```
5. Click **Save**

**Production Project:**
1. Select **production** project (`rfqwevpkydlwftraiqmn`)
2. Go to **Authentication** → **URL Configuration**
3. Set:
   - **Site Name:** `ExpiryCare` ⭐
   - **Site URL:** `https://expirycare.com`
   - **Redirect URLs:**
     ```
     https://expirycare.com/auth/callback
     ```
4. Click **Save**

### Step 4: Create Privacy Policy & Terms Pages

**These are REQUIRED for OAuth consent screen!**

Create these pages in your app:

1. **`app/privacy/page.tsx`** - Privacy Policy
2. **`app/terms/page.tsx`** - Terms of Service

**Quick templates:**

**`app/privacy/page.tsx`:**
```tsx
export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>ExpiryCare ("we", "our", "us") is committed to protecting your privacy...</p>
        {/* Add your privacy policy content */}
      </div>
    </div>
  )
}
```

**`app/terms/page.tsx`:**
```tsx
export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>By using ExpiryCare, you agree to these terms...</p>
        {/* Add your terms content */}
      </div>
    </div>
  )
}
```

### Step 5: Clear Cache & Test

1. **Clear browser cache:**
   - `Ctrl + Shift + Delete`
   - Select "Cookies and other site data"
   - Clear for `accounts.google.com` and `expirycare.com`

2. **Or use Incognito:**
   - `Ctrl + Shift + N`
   - Test in fresh incognito window

3. **Test OAuth:**
   - Visit: `http://localhost:3000/signup`
   - Click: "Sign up with Google"
   - **Should see:** "Sign in to ExpiryCare" (or similar)
   - Supabase URL may still appear in small text, but "ExpiryCare" will be prominent

---

## 🔍 What You'll See After Fix

### Before (Current):
```
Choose an account
to continue to kmbpjdgiqrohvophfbes.supabase.co
```

### After (Expected):
```
Sign in with Google
ExpiryCare
to continue to kmbpjdgiqrohvophfbes.supabase.co
```

**Note:** The Supabase URL may still appear in small text because that's the domain making the OAuth request. However, "ExpiryCare" will be the prominent app name.

---

## 🚀 Advanced: Completely Hide Supabase URL (Pro Plan)

**To completely hide the Supabase URL, you need:**

1. **Supabase Pro Plan** ($25/month)
2. **Custom Domain Setup:**
   - Supabase Dashboard → Settings → Custom Domain
   - Add `auth.expirycare.com`
   - Configure DNS records
3. **Update OAuth Redirect URIs:**
   - Google Cloud Console → Use `https://auth.expirycare.com/auth/v1/callback`
   - Supabase → Update redirect URLs

**Result:** Users will see `auth.expirycare.com` instead of Supabase URL.

---

## 📋 Verification Checklist

- [ ] Google OAuth consent screen shows "ExpiryCare" as app name
- [ ] App logo uploaded to Google Cloud Console
- [ ] Privacy policy URL: `https://expirycare.com/privacy` (page created)
- [ ] Terms of service URL: `https://expirycare.com/terms` (page created)
- [ ] OAuth app is **PUBLISHED** (not just Testing mode)
- [ ] Supabase Site Name set to "ExpiryCare" (both projects)
- [ ] Only required OAuth scopes enabled
- [ ] Tested OAuth flow - "ExpiryCare" is prominent
- [ ] Browser cache cleared
- [ ] Tested in incognito window

---

## 🔒 Security Reminder

**All keys are secure:**
- ✅ `.env.local` is gitignored
- ✅ No keys committed to git
- ✅ Only placeholders in example files

**Keep secure:**
- Never commit `.env.local`
- Use different keys for dev/prod
- Rotate keys periodically

---

**After completing these steps, "ExpiryCare" will be the prominent name in Google OAuth!** ✨

