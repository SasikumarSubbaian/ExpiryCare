# Feature Update Summary: Signup Page with Google OAuth

## ✅ What Was Updated

### 1. Signup Page (`app/signup/page.tsx`)
- ✅ Added **Name** field (new requirement)
- ✅ Kept **Email** and **Password** fields
- ✅ Added **"Sign up with Google"** button with Google logo
- ✅ Added **"or"** separator between email/password and Google auth
- ✅ Updated layout to match new design format
- ✅ Kept existing styling and colors (primary-600 blue)

### 2. Login Page (`app/login/page.tsx`)
- ✅ Added **"Sign in with Google"** button with Google logo
- ✅ Added **"or"** separator
- ✅ Same styling as signup page

### 3. OAuth Callback Route (`app/auth/callback/route.ts`)
- ✅ Created new route to handle Google OAuth callback
- ✅ Redirects to dashboard after successful authentication
- ✅ Handles errors gracefully

---

## 🧪 How to Test Locally

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Test Signup Page

1. Visit: `http://localhost:3000/signup`
2. **Verify:**
   - ✅ Name field is visible
   - ✅ Email field is visible
   - ✅ Password field is visible
   - ✅ "Sign up" button works
   - ✅ "Sign up with Google" button is visible
   - ✅ "or" separator is visible
   - ✅ "Already have an account? Log In" link works

### Step 3: Test Login Page

1. Visit: `http://localhost:3000/login`
2. **Verify:**
   - ✅ Email field is visible
   - ✅ Password field is visible
   - ✅ "Sign in" button works
   - ✅ "Sign in with Google" button is visible
   - ✅ "or" separator is visible

### Step 4: Test Google OAuth (After Supabase Setup)

**Note:** Google OAuth requires setup in Supabase first (see `GOOGLE_OAUTH_SETUP.md`)

1. Click "Sign up with Google" or "Sign in with Google"
2. Should redirect to Google sign-in
3. After signing in, should redirect back to `/dashboard`

---

## 🔧 Setup Required: Google OAuth in Supabase

**Before Google OAuth will work, you need to:**

1. **Set up Google OAuth in Supabase:**
   - See `GOOGLE_OAUTH_SETUP.md` for detailed instructions
   - Enable Google provider in Supabase dashboard
   - Add Google Client ID and Secret

2. **Configure redirect URLs:**
   - In Supabase: Add `http://localhost:3000/auth/callback` (for dev)
   - In Supabase: Add `https://www.expirycare.com/auth/callback` (for prod)
   - In Google Cloud Console: Add Supabase callback URL

---

## 📋 Feature Branch Information

**Branch:** `feature/update-signup-with-google-auth`

**Files Changed:**
- `app/signup/page.tsx` - Updated with Name field and Google OAuth
- `app/login/page.tsx` - Added Google OAuth button
- `app/auth/callback/route.ts` - New OAuth callback handler
- `GOOGLE_OAUTH_SETUP.md` - Setup guide

**Status:** ✅ Pushed to GitHub

---

## 🎯 Next Steps

### For Local Testing:

1. **Test the UI:**
   ```bash
   npm run dev
   ```
   - Visit `/signup` - verify new format
   - Visit `/login` - verify Google button

2. **Set up Google OAuth** (optional for now):
   - Follow `GOOGLE_OAUTH_SETUP.md`
   - Test Google sign-in/sign-up

### For Production:

1. **Set up Google OAuth in Supabase:**
   - Use production Supabase project
   - Configure Google OAuth provider
   - Add production redirect URLs

2. **Test in Preview:**
   - Vercel will create preview deployment
   - Test Google OAuth in preview environment

3. **Merge to Main:**
   - After testing, create pull request
   - Merge to main branch
   - Deploy to production

---

## ✅ Checklist

### Code Changes
- [x] Signup page updated with Name field
- [x] Google OAuth button added to signup
- [x] Google OAuth button added to login
- [x] OAuth callback route created
- [x] Build successful
- [x] No linting errors
- [x] Pushed to feature branch

### Testing
- [ ] Test signup page locally
- [ ] Test login page locally
- [ ] Test email/password signup
- [ ] Test email/password login
- [ ] Set up Google OAuth in Supabase
- [ ] Test Google OAuth signup
- [ ] Test Google OAuth signin

---

## 🚀 Quick Test Commands

```bash
# Start dev server
npm run dev

# Visit signup page
# http://localhost:3000/signup

# Visit login page
# http://localhost:3000/login
```

---

**Feature branch is ready! Test locally and then set up Google OAuth in Supabase.** 🎉

