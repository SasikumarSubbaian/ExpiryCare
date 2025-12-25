# 🔒 Hide Supabase URL in Google OAuth - Production Fix

## Problem
Users see the Supabase project URL (`rfqwevpkydlwftraiqmn.supabase.co`) in the Google OAuth sign-in page instead of your brand name "ExpiryCare".

## Solution
Configure Supabase Authentication settings to show "ExpiryCare" as the app name in the OAuth consent screen.

---

## Step-by-Step Fix

### Step 1: Configure Supabase Authentication Settings

1. **Go to Supabase Dashboard:**
   - Visit https://supabase.com/dashboard
   - Select your **production** project (`rfqwevpkydlwftraiqmn`)

2. **Navigate to Authentication Settings:**
   - Click **"Authentication"** in the left sidebar
   - Click **"URL Configuration"** (or **"Settings"** → **"URL Configuration"**)

3. **Update Site Name:**
   - Find the **"Site Name"** field
   - Change from: (empty or default)
   - To: **`ExpiryCare`**
   - Click **"Save"**

4. **Optional - Update Site Logo:**
   - Upload your ExpiryCare logo (if you have one)
   - This will appear in the OAuth consent screen

### Step 2: Verify Google OAuth Provider Settings

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Providers**
   - Find **"Google"** provider
   - Click to open settings

2. **Verify Redirect URLs:**
   - Make sure these URLs are configured:
     ```
     https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback
     https://expirycare.com/auth/callback (if you have custom domain)
     ```

3. **Save Settings:**
   - Click **"Save"** if you made any changes

### Step 3: Update Google Cloud Console (If Needed)

1. **Go to Google Cloud Console:**
   - Visit https://console.cloud.google.com
   - Select your OAuth project

2. **OAuth Consent Screen:**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Update **App name** to: **`ExpiryCare`**
   - Update **App logo** (upload your logo)
   - Update **Application home page** to: `https://expirycare.com` (or your domain)
   - Update **Privacy policy URL** to: `https://expirycare.com/privacy`
   - Update **Terms of service URL** to: `https://expirycare.com/terms`
   - Click **"Save and Continue"**

3. **Verify Authorized Redirect URIs:**
   - Go to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, ensure:
     ```
     https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback
     ```
   - Click **"Save"**

### Step 4: Test the Fix

1. **Clear browser cache** or use incognito mode
2. **Go to your production app:** `https://expirycare.com` (or your domain)
3. **Click "Log in with Google"** or **"Sign up with Google"**
4. **Verify the OAuth screen shows:**
   - ✅ "Sign in with Google" header
   - ✅ "to continue to **ExpiryCare**" (instead of Supabase URL)
   - ✅ Your logo (if uploaded)

---

## Expected Result

### Before:
```
Sign in
to continue to rfqwevpkydlwftraiqmn.supabase.co
```

### After:
```
Sign in with Google
to continue to ExpiryCare
```

**Note:** The Supabase URL (`rfqwevpkydlwftraiqmn.supabase.co`) may still appear in small text at the bottom of the OAuth screen (this is normal - it's the technical domain making the request). However, "ExpiryCare" will be the prominent app name that users see.

---

## Alternative: Custom Domain for OAuth (Advanced)

If you want to completely hide the Supabase URL, you can:

1. **Set up a custom domain** in Supabase (requires Pro plan)
2. **Use your own domain** for OAuth callbacks
3. **Configure DNS** to point to Supabase

This is more complex and requires:
- Supabase Pro plan
- Custom domain configuration
- DNS setup

For most use cases, setting the Site Name to "ExpiryCare" is sufficient.

---

## Troubleshooting

### Still Seeing Supabase URL?

1. **Clear browser cache** completely
2. **Try incognito/private mode**
3. **Wait 5-10 minutes** for changes to propagate
4. **Verify Site Name is saved** in Supabase Dashboard
5. **Check Google OAuth consent screen** settings

### OAuth Not Working After Changes?

1. **Verify redirect URLs** are correct in both:
   - Supabase Dashboard → Authentication → Providers → Google
   - Google Cloud Console → Credentials → OAuth 2.0 Client ID

2. **Check for errors** in browser console (F12)

3. **Verify environment variables** in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Code Changes Made

The code has been updated to include OAuth query parameters for better branding:

**Files Updated:**
- `app/login/page.tsx` - Added OAuth query parameters
- `app/signup/page.tsx` - Added OAuth query parameters

These changes help ensure consistent OAuth behavior, but the main fix is in Supabase Dashboard settings.

---

## Quick Checklist

- [ ] Updated Site Name in Supabase Dashboard → Authentication → URL Configuration
- [ ] Updated App name in Google Cloud Console → OAuth consent screen
- [ ] Verified redirect URLs in both Supabase and Google Console
- [ ] Tested OAuth flow in production
- [ ] Verified "ExpiryCare" appears instead of Supabase URL
- [ ] Cleared browser cache and tested again

---

**Status:** ✅ Code changes committed
**Action Required:** Update Supabase Dashboard settings (Step 1) and Google Cloud Console (Step 3)

---

## Support

If you need help:
- **Supabase Docs:** https://supabase.com/docs/guides/auth
- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2

