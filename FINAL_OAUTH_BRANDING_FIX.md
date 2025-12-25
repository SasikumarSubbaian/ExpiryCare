# 🔒 Final Fix: Hide Supabase URL in Google OAuth

## Current Issue
Production users still see `rfqwevpkydlwftraiqmn.supabase.co` in Google OAuth screen instead of "ExpiryCare".

## Important Note About OAuth Server Feature

**Question: Is OAuth Server useful for our project?**

**Answer: NO** - The **"OAuth Server"** feature in Supabase is for making Supabase act as an OAuth **provider** (like Google). 

- **What we're doing:** Using Google as the OAuth provider, Supabase as the client
- **What OAuth Server does:** Makes Supabase an OAuth provider for other apps
- **Conclusion:** **You can ignore/disable the OAuth Server feature** - it's not needed for Google OAuth login

**Action:** If OAuth Server is enabled, you can leave it as-is (it won't interfere), or disable it if you want to keep things simple.

---

## Solution: Configure Google Cloud Console (Primary Fix)

The Supabase URL appears because **Google shows the domain making the OAuth request**. Since Supabase handles the OAuth flow, Google displays the Supabase domain. However, we can make "ExpiryCare" the prominent app name.

### Step 1: Update Google Cloud Console OAuth Consent Screen

1. **Go to Google Cloud Console:**
   - Visit https://console.cloud.google.com
   - Select your OAuth project

2. **Navigate to OAuth Consent Screen:**
   - Go to **APIs & Services** → **OAuth consent screen**

3. **Update App Information:**
   - **App name:** `ExpiryCare` ⭐ (This is what users will see prominently)
   - **User support email:** Your email
   - **App logo:** Upload ExpiryCare logo (256x256px PNG)
   - **Application home page:** `https://expirycare.com` (or your domain)
   - **Privacy policy link:** `https://expirycare.com/privacy` ⭐ (REQUIRED)
   - **Terms of service link:** `https://expirycare.com/terms` ⭐ (REQUIRED)
   - **Authorized domains:** Add `expirycare.com` (or your domain)

4. **CRITICAL: Publish the App** ⭐
   - Scroll to the bottom of the OAuth consent screen
   - If you see **"PUBLISH APP"** button, click it
   - Confirm publishing
   - **Why this matters:** Testing mode shows Supabase URL more prominently. Published apps show your app name more prominently.

5. **Save all changes**

### Step 2: Verify OAuth Client Configuration

1. **Go to Credentials:**
   - **APIs & Services** → **Credentials**
   - Find your **OAuth 2.0 Client ID**
   - Click to edit

2. **Verify Authorized Redirect URIs:**
   ```
   https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback
   ```
   - Make sure this exact URL is listed
   - Remove any localhost URLs if in production

3. **Save changes**

### Step 3: Update Supabase URL Configuration

1. **Go to Supabase Dashboard:**
   - Visit https://supabase.com/dashboard
   - Select your **production** project (`rfqwevpkydlwftraiqmn`)

2. **Navigate to URL Configuration:**
   - Go to **Authentication** → **URL Configuration**
   - (Note: "Site Name" option may not be available in newer Supabase versions)

3. **Update these settings:**
   - **Site URL:** `https://expirycare.com` (or your production domain)
   - **Redirect URLs:** Add:
     ```
     https://expirycare.com/auth/callback
     ```

4. **Save changes**

### Step 4: Alternative - Check Authentication Settings

If "Site Name" is not visible in URL Configuration, try:

1. **Authentication** → **Settings** (or **General**)
2. Look for:
   - "Application Name"
   - "App Name"
   - "Site Name"
   - "Display Name"
3. Set to: `ExpiryCare`

---

## Why Supabase URL Still Appears

**Important:** Google will always show the domain making the OAuth request. Since Supabase handles OAuth (`rfqwevpkydlwftraiqmn.supabase.co`), Google displays it.

**However:**
- ✅ Your app name "ExpiryCare" will be **prominent** if Google Cloud Console is configured correctly
- ✅ The Supabase URL will appear in **smaller text** (this is normal)
- ✅ Users will see "Sign in to **ExpiryCare**" as the main heading

---

## Expected Result After Fix

### What Users Will See:

```
Sign in with Google
ExpiryCare                    ← Your app name (prominent)
to continue to rfqwevpkydlwftraiqmn.supabase.co  ← Supabase URL (smaller, technical)
```

The Supabase URL is unavoidable because that's the domain making the request, but "ExpiryCare" will be the prominent name users see.

---

## Complete Hide Supabase URL (Advanced - Requires Custom Domain)

To **completely** hide the Supabase URL, you need:

1. **Supabase Pro Plan** ($25/month) - Required for custom domains
2. **Enable Custom Domains Add-on:**
   - Supabase Dashboard → Billing → Enable Custom Domains add-on
3. **Configure Custom Domain:**
   - Set up CNAME record: `auth.expirycare.com` → `rfqwevpkydlwftraiqmn.supabase.co`
   - Use Supabase CLI to verify domain
   - Configure in Supabase Dashboard → Settings → Custom Domain
4. **Update OAuth Redirect URIs:**
   - Google Cloud Console → Use `https://auth.expirycare.com/auth/v1/callback`
   - Supabase → Update redirect URLs

**Result:** Users will see `auth.expirycare.com` instead of `rfqwevpkydlwftraiqmn.supabase.co`

**Cost:** $25/month for Supabase Pro plan + Custom Domains add-on

**Note:** This is optional. Most apps work fine with the Supabase URL showing in small text, as long as "ExpiryCare" is prominent.

---

## Verification Checklist

- [ ] Google Cloud Console OAuth consent screen shows "ExpiryCare" as app name
- [ ] App is **PUBLISHED** (not in Testing mode)
- [ ] Privacy policy URL: `https://expirycare.com/privacy` (accessible)
- [ ] Terms of service URL: `https://expirycare.com/terms` (accessible)
- [ ] App logo uploaded to Google Cloud Console
- [ ] Supabase Site URL set to your production domain
- [ ] Redirect URLs configured correctly
- [ ] Tested OAuth flow - "ExpiryCare" appears prominently
- [ ] Cleared browser cache and tested in incognito

---

## Troubleshooting

### Still Seeing Supabase URL Prominently?

1. **Check Google Cloud Console:**
   - Is app **PUBLISHED**? (Not just Testing mode)
   - Is app name set to "ExpiryCare"?
   - Are privacy policy and terms URLs accessible?

2. **Clear Browser Cache:**
   - Clear cookies for `accounts.google.com`
   - Use incognito/private mode
   - Wait 5-10 minutes for changes to propagate

3. **Verify URLs:**
   - Privacy policy: `https://expirycare.com/privacy` (must be accessible)
   - Terms: `https://expirycare.com/terms` (must be accessible)

### Site Name Option Not Available?

**Confirmed:** Supabase has removed or moved the "Site Name" option in newer versions. This is normal.

**The primary branding is controlled by:**
- ✅ **Google Cloud Console OAuth consent screen** (MOST IMPORTANT - this is what users see)
- ✅ **Supabase Site URL** (for redirects only, doesn't affect OAuth branding)

**Action:** Focus on Google Cloud Console configuration. The app name there is what users see prominently in the OAuth screen.

---

## Quick Action Items

**Right Now:**

1. ✅ **Google Cloud Console:**
   - OAuth consent screen → App name: `ExpiryCare`
   - **PUBLISH APP** (if in Testing mode)
   - Privacy policy: `https://expirycare.com/privacy`
   - Terms: `https://expirycare.com/terms`

2. ✅ **Supabase Dashboard:**
   - Authentication → URL Configuration
   - Site URL: `https://expirycare.com`
   - Redirect URLs: `https://expirycare.com/auth/callback`

3. ✅ **Test:**
   - Clear browser cache
   - Try OAuth in incognito
   - Verify "ExpiryCare" appears prominently

---

**The Google Cloud Console OAuth consent screen configuration is the most important step!** This is where users will see "ExpiryCare" instead of the Supabase URL.

