# Fix: Login Error in Production

## ❌ Error You're Seeing

- **Error message:** "Unable to sign in. Please check your email and confirm your account first."
- **Console error:** `Failed to load resource: the server responded with a status of 400`
- **Supabase URL in error:** `rfqwevpkydlwftraiqmn` (incomplete)

## 🔍 Root Cause

The `NEXT_PUBLIC_SUPABASE_URL` in Vercel is **missing the full URL format**. 

**Current (Wrong):**
```
rfqwevpkydlwftraiqmn
```

**Should be:**
```
https://rfqwevpkydlwftraiqmn.supabase.co
```

This causes Supabase client to fail with 400 errors because it can't connect to the API.

---

## ✅ Solution: Fix Supabase URL in Vercel

### Step 1: Get Correct Supabase URL

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **production** project
3. Go to **Settings** → **API**
4. Copy the **Project URL** (should be like `https://xxx.supabase.co`)

### Step 2: Update in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project (`expiry-care`)
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_SUPABASE_URL`
5. Click **Edit** (three dots menu)
6. **Change value to full URL:**
   ```
   https://rfqwevpkydlwftraiqmn.supabase.co
   ```
   (Replace with your actual Supabase project URL)
7. Click **Save**

### Step 3: Redeploy

After updating the variable:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Or push a new commit to trigger redeploy
4. Wait for deployment to complete

### Step 4: Test Login

1. Visit: `https://www.expirycare.com/login`
2. Try logging in again
3. Should work now! ✅

---

## 🔧 Code Fix Applied

I've updated `lib/supabase/client.ts` to:
- ✅ Validate Supabase URL format
- ✅ Show clear error if URL is malformed
- ✅ Prevent connection errors

**But you still need to fix the URL in Vercel!**

---

## 📋 Verification Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is full URL: `https://xxx.supabase.co`
- [ ] URL starts with `https://`
- [ ] URL ends with `.supabase.co`
- [ ] Updated in Vercel Environment Variables
- [ ] Redeployed after updating
- [ ] Tested login - should work now

---

## 🧪 How to Verify URL is Correct

### In Vercel:

1. Go to Environment Variables
2. Click on `NEXT_PUBLIC_SUPABASE_URL`
3. **Should see:** `https://your-project-id.supabase.co`
4. **NOT:** `your-project-id` or `rfqwevpkydlwftraiqmn`

### In Supabase Dashboard:

1. Go to Settings → API
2. **Project URL** should match what's in Vercel
3. Copy the exact value

---

## 🚨 Common Mistakes

### ❌ Wrong Formats:
```
rfqwevpkydlwftraiqmn                    (missing https:// and .supabase.co)
http://rfqwevpkydlwftraiqmn.supabase.co (should be https://)
rfqwevpkydlwftraiqmn.supabase.co        (missing https://)
```

### ✅ Correct Format:
```
https://rfqwevpkydlwftraiqmn.supabase.co
```

---

## 🎯 Quick Action Plan

**Right now:**

1. **Go to Supabase Dashboard** → Settings → API
2. **Copy Project URL** (full URL)
3. **Go to Vercel** → Settings → Environment Variables
4. **Edit** `NEXT_PUBLIC_SUPABASE_URL`
5. **Paste full URL** (should start with `https://` and end with `.supabase.co`)
6. **Save**
7. **Redeploy**
8. **Test login** - should work! ✅

---

## 💡 Why This Happens

The Supabase URL got truncated or copied incorrectly when adding to Vercel. The full URL format is required for the Supabase client to connect properly.

**The fix is simple: Update the URL in Vercel to the full format!** 🔧

