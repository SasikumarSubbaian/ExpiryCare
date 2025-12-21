# Debug: 400 Bad Request from Supabase Auth

## 🔍 Step-by-Step Debugging

### Step 1: Check Network Tab for Detailed Error

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try logging in
4. Find the failed request: `auth/v1/token?grant_type=password`
5. Click on it
6. Check **Response** tab - this will show the actual error from Supabase

**Common Supabase 400 errors:**
- `invalid_grant` - Wrong credentials
- `email_not_confirmed` - Email not confirmed
- `user_not_found` - User doesn't exist
- `invalid_api_key` - Wrong anon key
- `invalid_request` - Malformed request

### Step 2: Verify Supabase Keys Match Exactly

**In Supabase Dashboard:**
1. Go to **Settings** → **API**
2. Copy **anon public** key (starts with `eyJ`)

**In Vercel:**
1. Go to **Settings** → **Environment Variables**
2. Click on `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Compare with Supabase anon key
4. **They must match EXACTLY** (character by character)

**Common issues:**
- Extra spaces
- Missing characters
- Wrong key (dev vs prod)
- Keys from different projects

### Step 3: Check User Exists in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Search for: `sasikumar.subbaiyan@gmail.com`
3. **If user doesn't exist:**
   - Go to `/signup` and create account
   - Or create user manually in Supabase dashboard

### Step 4: Check Email Confirmation Status

1. In Supabase → Authentication → Users
2. Find your user
3. Check **"Email Confirmed"** column
4. **If not confirmed:**
   - Check email inbox for confirmation link
   - Or disable email confirmation (see below)

### Step 5: Disable Email Confirmation (For Testing)

1. Go to Supabase → **Authentication** → **Settings** → **Auth Providers**
2. Find **Email** provider
3. Look for **"Confirm email"** or **"Enable email confirmations"**
4. **Disable** it (toggle off)
5. Save settings
6. Try logging in again

---

## 🧪 Test: Create New User

If existing user has issues, try creating a new one:

1. Go to `https://www.expirycare.com/signup`
2. Create a new account with different email
3. Try logging in with new account
4. If new account works, the issue is with the existing user

---

## 🔧 Quick Fixes to Try

### Fix 1: Re-copy Anon Key

1. Supabase → Settings → API
2. Copy **anon public** key fresh
3. Vercel → Environment Variables
4. Edit `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Paste new key (remove old one completely)
6. Save
7. Redeploy

### Fix 2: Verify All Keys Are From Same Project

**Make sure:**
- URL: `https://rfqwevpkydlwftraiqmn.supabase.co`
- Anon key: From same project
- Service role key: From same project

**Not mixing:**
- Dev project keys with prod project
- Different Supabase projects

### Fix 3: Check Supabase Project Status

1. Supabase Dashboard
2. Check project is **Active** (not paused)
3. Check for any service warnings
4. Verify project is in **Production** environment

### Fix 4: Test with Different Credentials

1. Try logging in with:
   - Different email (if you have one)
   - Reset password
   - Create new account

---

## 📋 Diagnostic Checklist

- [ ] Checked Network tab for actual Supabase error message
- [ ] Verified anon key matches exactly between Supabase and Vercel
- [ ] Verified user exists in Supabase Authentication → Users
- [ ] Checked email confirmation status
- [ ] Disabled email confirmation (for testing)
- [ ] Verified all keys are from same Supabase project
- [ ] Checked Supabase project is active
- [ ] Tried creating new user account
- [ ] Redeployed after any changes

---

## 🎯 Most Likely Causes

### Cause 1: Wrong Anon Key (70% chance)

**Problem:** Anon key in Vercel doesn't match Supabase

**Fix:**
- Copy anon key fresh from Supabase
- Update in Vercel (remove old, paste new)
- Redeploy

### Cause 2: User Doesn't Exist (20% chance)

**Problem:** Account not created in Supabase

**Fix:**
- Sign up at `/signup`
- Or create user in Supabase dashboard

### Cause 3: Email Not Confirmed (5% chance)

**Problem:** Email confirmation required

**Fix:**
- Check email for confirmation link
- Or disable email confirmation

### Cause 4: Wrong Project Keys (5% chance)

**Problem:** Using keys from different project

**Fix:**
- Verify all keys are from production project
- Not mixing dev and prod keys

---

## 🚀 Action Plan

**Right now:**

1. **Check Network tab** for actual error message
2. **Verify anon key** matches exactly
3. **Check user exists** in Supabase
4. **Disable email confirmation** (for testing)
5. **Re-copy all keys** fresh from Supabase
6. **Update in Vercel** and redeploy
7. **Test login** again

---

**The Network tab will show the exact error from Supabase. Check that first!** 🔍

