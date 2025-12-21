# Google OAuth Setup Guide

Complete guide for setting up Google OAuth authentication in ExpiryCare.

## 🎯 Overview

Google OAuth allows users to sign up and sign in using their Google account, providing a seamless authentication experience.

---

## 📋 Step 1: Set Up Google OAuth in Supabase

### 1.1 Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. Configure OAuth consent screen (if not done):
   - User Type: External
   - App name: ExpiryCare
   - User support email: Your email
   - Developer contact: Your email
   - Save and continue
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: ExpiryCare Web
   - **Authorized redirect URIs:** Add BOTH:
     ```
     https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/callback
     https://kmbpjdgiqrohvophfbes.supabase.co/auth/v1/callback
     ```
     (Add both production and development Supabase project URLs)
   - Click **"Create"**
7. **Copy:**
   - **Client ID** (looks like: `123456789-abc...googleusercontent.com`)
   - **Client Secret** (looks like: `GOCSPX-abc...`)

### 1.2 Configure in Supabase

**⚠️ IMPORTANT: You need to enable Google OAuth in BOTH projects!**

#### For Production Project (Vercel):

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **production** project (`rfqwevpkydlwftraiqmn`)
3. Go to **Authentication** → **Providers**
4. Find **Google** provider
5. Click **"Enable"** or toggle it on
6. Enter:
   - **Client ID (for OAuth):** Your Google Client ID
   - **Client Secret (for OAuth):** Your Google Client Secret
7. Click **"Save"**

#### For Development Project (Local Testing):

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **development** project (`kmbpjdgiqrohvophfbes`)
3. Go to **Authentication** → **Providers**
4. Find **Google** provider
5. Click **"Enable"** or toggle it on
6. Enter:
   - **Client ID (for OAuth):** Same Google Client ID (can reuse)
   - **Client Secret (for OAuth):** Same Google Client Secret (can reuse)
7. Click **"Save"**

**Note:** You can use the same Google OAuth credentials for both dev and prod projects.

### 1.3 Add Redirect URL

In Supabase → Authentication → URL Configuration:

**Site URL:**
```
https://www.expirycare.com
```

**Redirect URLs:** Add:
```
https://www.expirycare.com/auth/callback
https://expirycare.com/auth/callback
http://localhost:3000/auth/callback
```

---

## 🔧 Step 2: Update Environment Variables

### For Local Development (.env.local)

No additional variables needed! Google OAuth uses Supabase configuration.

### For Production (Vercel)

No additional variables needed! The OAuth flow uses Supabase's built-in Google provider.

---

## ✅ Step 3: Test Locally

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit:** `http://localhost:3000/signup`
3. **Click:** "Sign up with Google"
4. **Should redirect:** To Google sign-in
5. **After sign-in:** Should redirect back to `/dashboard`

---

## 🧪 Testing Checklist

### Sign Up Page
- [ ] Name field visible
- [ ] Email field visible
- [ ] Password field visible
- [ ] "Sign up" button works
- [ ] "Sign up with Google" button visible
- [ ] Google button redirects to Google sign-in
- [ ] After Google sign-in, redirects to dashboard

### Login Page
- [ ] Email field visible
- [ ] Password field visible
- [ ] "Sign in" button works
- [ ] "Sign in with Google" button visible
- [ ] Google button redirects to Google sign-in
- [ ] After Google sign-in, redirects to dashboard

---

## 🚨 Troubleshooting

### "Google OAuth not configured"

**Fix:**
- Enable Google provider in Supabase
- Add Client ID and Client Secret
- Save settings

### "Redirect URI mismatch"

**Fix:**
- Check redirect URLs in Supabase match your domain
- Check Google Cloud Console redirect URIs
- Must match exactly (including https/http)

### "OAuth callback error"

**Fix:**
- Verify `/auth/callback` route exists
- Check redirect URL in Supabase settings
- Check browser console for errors

---

## 📝 Important Notes

1. **Redirect URLs must match exactly:**
   - In Google Cloud Console
   - In Supabase settings
   - In your code (`/auth/callback`)

2. **For production:**
   - Use production Supabase project
   - Use production domain in redirect URLs
   - Test in production environment

3. **For development:**
   - Can use same Google OAuth credentials
   - Add `http://localhost:3000/auth/callback` to redirect URLs

---

## ✅ Quick Setup Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth client ID created (Web application)
- [ ] Redirect URI added in Google Console
- [ ] Google provider enabled in Supabase
- [ ] Client ID and Secret added in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Tested locally
- [ ] Tested in production

---

**Google OAuth is now set up! Users can sign up and sign in with their Google accounts.** 🚀

