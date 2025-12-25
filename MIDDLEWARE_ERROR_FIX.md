# Fix: 500 MIDDLEWARE_INVOCATION_FAILED Error

## ❌ Error You're Seeing

```
500: INTERNAL_SERVER_ERROR
Code: MIDDLEWARE_INVOCATION_FAILED
```

**Problem:** Middleware is failing, likely due to missing environment variables in Vercel.

---

## ✅ Solution 1: Add Environment Variables in Vercel (Most Important)

### Step 1: Go to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project (`expiry-care`)
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Required Variables

**Add these for Production environment:**

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production |
| `RESEND_API_KEY` | Your Resend API key | Production |
| `RESEND_FROM_EMAIL` | `ExpiryCare <reminders@expirycare.com>` | Production |
| `NODE_ENV` | `production` | Production |

### Step 3: How to Add

1. Click **"Add New"**
2. Enter **Key** (variable name)
3. Enter **Value** (your actual key)
4. Select **Environment**: **Production** (and Preview if needed)
5. Click **"Save"**

### Step 4: Redeploy

After adding variables:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Or push a new commit to trigger redeploy

---

## ✅ Solution 2: Get Your Supabase Keys

If you don't have the keys yet:

### For Production Supabase Project:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **production** project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Solution 3: Verify Environment Variables

### Check in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Verify all variables are set for **Production**
3. Check for typos in variable names
4. Make sure values are correct (no extra spaces)

### Test Locally First:

1. Create `.env.local` with production keys
2. Test locally: `npm run dev`
3. If it works locally, the issue is missing vars in Vercel

---

## 🔧 Code Fix Applied

I've updated `middleware.ts` to:
- ✅ Check if environment variables exist before using them
- ✅ Handle errors gracefully
- ✅ Prevent 500 errors if env vars are missing

**But you still need to add environment variables in Vercel!**

---

## 📋 Quick Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` added in Vercel (Production)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added in Vercel (Production)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added in Vercel (Production)
- [ ] `RESEND_API_KEY` added in Vercel (Production)
- [ ] `RESEND_FROM_EMAIL` added in Vercel (Production)
- [ ] Variables set for **Production** environment
- [ ] Redeployed after adding variables
- [ ] Checked deployment logs for errors

---

## 🧪 Verify Fix

After adding environment variables and redeploying:

1. **Wait for deployment to complete**
2. **Visit:** `https://www.expirycare.com`
3. **Should load:** Your landing page (not error)
4. **Check browser console:** No errors

---

## 🚨 If Still Getting Error

### Check Deployment Logs:

1. Go to Vercel → **Deployments**
2. Click on latest deployment
3. Check **Build Logs** and **Function Logs**
4. Look for error messages

### Common Issues:

1. **Wrong environment:** Variables set for Development, not Production
2. **Typos:** Variable names have typos
3. **Missing values:** Variables added but values are empty
4. **Wrong project:** Using dev Supabase keys instead of prod

---

## 📝 Environment Variables Reference

**Required for middleware:**
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅

**Required for reminders:**
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `RESEND_API_KEY` ✅
- `RESEND_FROM_EMAIL` ✅

**Optional:**
- `NODE_ENV=production` ✅

---

## 🎯 Quick Action Plan

**Right now:**

1. **Go to Vercel** → Settings → Environment Variables
2. **Add all required variables** for Production
3. **Redeploy** (Deployments → Redeploy)
4. **Wait for deployment**
5. **Test:** Visit `https://www.expirycare.com`

**The error will be fixed once environment variables are added!** ✅

---

**Most likely cause: Missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables.**

