# Vercel Environment Variables Fix

## Critical Issue: NODE_ENV in Production

**Problem:** If `NODE_ENV` is set to `"development"` in Vercel production environment, it can cause:
- Next.js to behave incorrectly
- Development-only code to run in production
- Potential 500 errors

## Solution

**Remove the `NODE_ENV` environment variable from Vercel.**

Vercel automatically sets `NODE_ENV=production` for production deployments. You should NOT manually set this variable.

### Steps to Fix:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `NODE_ENV` in the list
3. Click the three dots (⋯) next to it
4. Click "Delete"
5. Redeploy your application

### Why This Matters:

- `NODE_ENV=production` enables production optimizations
- `NODE_ENV=development` can cause Next.js to skip optimizations
- Manual override can break production builds

## Other Required Environment Variables

Make sure these are set in Vercel:

- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)
- ❌ `NODE_ENV` - **DO NOT SET THIS** - Vercel sets it automatically

## After Removing NODE_ENV

1. The deployment will automatically use `NODE_ENV=production`
2. All production optimizations will be enabled
3. The 500 error should be resolved

