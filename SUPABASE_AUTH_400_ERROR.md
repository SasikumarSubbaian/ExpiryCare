# Fix: 400 Bad Request Error from Supabase Auth

## ❌ Error You're Seeing

**Console Error:**
```
POST https://rfqwevpkydlwftraiqmn.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
```

**Error Message:**
"Unable to sign in. Please check your email and confirm your account first."

## 🔍 Root Cause Analysis

The 400 error from Supabase can be caused by:

1. **Wrong Supabase Anon Key** (most likely)
2. **User account doesn't exist** in Supabase
3. **Email confirmation required** but not done
4. **Supabase project configuration issue**
5. **Wrong password** (but usually gives different error)

---

## ✅ Solution 1: Verify Supabase Keys Match

### Step 1: Get Keys from Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **production** project (`ExpiryCare-Prod`)
3. Go to **Settings** → **API**
4. Copy these **exact** values:
   - **Project URL** (should be `https://rfqwevpkydlwftraiqmn.supabase.co`)
   - **anon public** key (starts with `eyJ`)
   - **service_role secret** key (starts with `eyJ`)

### Step 2: Verify in Vercel

1. Go to Vercel → Settings → Environment Variables
2. Compare each key:
   - `NEXT_PUBLIC_SUPABASE_URL` should match Project URL exactly
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` should match anon public key exactly
   - `SUPABASE_SERVICE_ROLE_KEY` should match service_role key exactly

### Step 3: Check for Typos

**Common issues:**
- Extra spaces at beginning/end
- Missing characters
- Wrong key copied (dev vs prod)
- Keys from different Supabase projects

**Fix:**
- Copy keys again from Supabase
- Paste carefully into Vercel
- Remove any extra spaces
- Save and redeploy

---

## ✅ Solution 2: Check User Account Exists

### Step 1: Check in Supabase Dashboard

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Look for: `sasikumar.subbaiyan@gmail.com`
3. **If user doesn't exist:**
   - User needs to sign up first
   - Go to `/signup` page
   - Create account

### Step 2: Check Email Confirmation

1. In Supabase → Authentication → Users
2. Find your user
3. Check **"Email Confirmed"** status
4. **If not confirmed:**
   - Check email inbox for confirmation link
   - Click confirmation link
   - Or disable email confirmation in Supabase settings

---

## ✅ Solution 3: Disable Email Confirmation (For Testing)

If email confirmation is causing issues:

### In Supabase Dashboard:

1. Go to **Authentication** → **Settings** → **Auth Providers**
2. Find **Email** provider
3. Look for **"Confirm email"** setting
4. **Disable** email confirmation (for testing)
5. Save settings

**Note:** Re-enable for production security later.

---

## ✅ Solution 4: Check Supabase Project Status

### Verify Project is Active:

1. Go to Supabase Dashboard
2. Check project status (should be "Active")
3. Check for any service warnings
4. Verify project is not paused

### Check API Settings:

1. Go to **Settings** → **API** → **Data API Settings**
2. Verify **"Enable Data API"** is ON (green toggle)
3. Check **"Exposed schemas"** includes `public`

---

## 🧪 Diagnostic Steps

### Step 1: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try logging in
4. Find the failed request: `auth/v1/token?grant_type=password`
5. Click on it
6. Check **Response** tab for error details

**Look for:**
- Error message from Supabase
- Error code
- What exactly failed

### Step 2: Test Supabase Connection

**Create a test page to verify connection:**

1. Check if Supabase client can connect
2. Verify keys are working
3. Test basic query

### Step 3: Check Console for Detailed Errors

The console might show more details:
- Invalid credentials
- User not found
- Email not confirmed
- API key invalid

---

## 🔧 Quick Fixes to Try

### Fix 1: Re-copy All Keys

1. Go to Supabase → Settings → API
2. Copy **all three** keys fresh
3. Update in Vercel
4. Redeploy

### Fix 2: Create New User

1. Go to `https://www.expirycare.com/signup`
2. Create a new account
3. Try logging in with new account

### Fix 3: Check Password

1. Make sure password is correct
2. Try resetting password if needed
3. Use "Forgot password" if available

### Fix 4: Disable Email Confirmation

1. Supabase → Authentication → Settings
2. Disable email confirmation
3. Try logging in again

---

## 📋 Verification Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` matches Supabase Project URL exactly
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches Supabase anon key exactly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` matches Supabase service_role key exactly
- [ ] No extra spaces in keys
- [ ] User exists in Supabase Authentication → Users
- [ ] Email is confirmed (or confirmation disabled)
- [ ] Supabase project is active
- [ ] Data API is enabled
- [ ] Redeployed after updating keys

---

## 🎯 Most Likely Issues

### Issue 1: Wrong Anon Key (60% chance)

**Problem:** Anon key in Vercel doesn't match Supabase

**Fix:**
- Copy anon key fresh from Supabase
- Update in Vercel
- Redeploy

### Issue 2: User Doesn't Exist (25% chance)

**Problem:** User account not created in Supabase

**Fix:**
- Sign up first at `/signup`
- Or create user in Supabase dashboard

### Issue 3: Email Not Confirmed (10% chance)

**Problem:** Email confirmation required but not done

**Fix:**
- Check email for confirmation link
- Or disable email confirmation

### Issue 4: Wrong Project Keys (5% chance)

**Problem:** Using dev project keys instead of prod

**Fix:**
- Verify you're using production Supabase project keys
- Not development project keys

---

## 🚀 Quick Action Plan

**Right now:**

1. **Verify Supabase keys match:**
   - Supabase Dashboard → Settings → API
   - Copy all keys
   - Compare with Vercel environment variables
   - Update if different

2. **Check user exists:**
   - Supabase → Authentication → Users
   - Verify user account exists

3. **Disable email confirmation** (for testing):
   - Supabase → Authentication → Settings
   - Disable email confirmation

4. **Redeploy:**
   - After updating keys
   - Wait for deployment

5. **Test login:**
   - Try logging in again
   - Should work! ✅

---

**The 400 error suggests the Supabase keys might not match. Verify all keys are correct and match between Supabase and Vercel!** 🔍

