# 🔧 Production Dashboard Items Not Showing - Fix Guide

## Problem
Production users cannot see their added items on the dashboard, even though items are being added successfully.

## Root Cause
This is typically caused by:
1. **RLS (Row Level Security) policies not properly configured** in production Supabase
2. **Query not using explicit user_id filter** (fixed in code)
3. **Missing database migrations** in production

## Solution

### Step 1: Run Database Migration in Supabase

1. **Go to your Supabase Dashboard:**
   - Visit https://supabase.com/dashboard
   - Select your production project

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration:**
   - Open the file: `supabase/migrations/011_ensure_rls_policies_production.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Migration Success:**
   - You should see: "Successfully created 4 RLS policies for life_items table"
   - Check for any errors in the output

### Step 2: Verify RLS Policies

Run this query to verify policies are created:

```sql
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'life_items'
ORDER BY policyname;
```

You should see 4 policies:
- `Users can view their own life items` (SELECT)
- `Users can insert their own life items` (INSERT)
- `Users can update their own life items` (UPDATE)
- `Users can delete their own life items` (DELETE)

### Step 3: Test the Fix

1. **Clear browser cache** or use incognito mode
2. **Log in** to your production app
3. **Add a test item** (if you don't have any)
4. **Check dashboard** - items should now be visible

### Step 4: Verify Items Exist

If items still don't show, verify they exist in the database:

```sql
-- Check if items exist (replace with your user ID)
SELECT id, title, category, expiry_date, user_id
FROM life_items
WHERE user_id = 'your-user-id-here'
ORDER BY expiry_date;
```

**To get your user ID:**
- In Supabase Dashboard → Authentication → Users
- Find your user and copy the UUID

## Code Changes Made

### 1. Dashboard Query Improvement
- **File:** `app/dashboard/page.tsx`
- **Change:** Always use explicit `user_id` filter instead of relying solely on RLS
- **Why:** More reliable and explicit, works even if RLS has issues

### 2. New Migration
- **File:** `supabase/migrations/011_ensure_rls_policies_production.sql`
- **Purpose:** Ensures RLS policies are correctly configured
- **Includes:** 
  - Policy recreation with explicit `auth.uid() IS NOT NULL` checks
  - Policy verification
  - Index creation for performance

## Troubleshooting

### Items Still Not Showing?

1. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for `[Dashboard]` error messages
   - Share these errors for debugging

2. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs
   - Check for any database errors
   - Look for permission denied errors (code 42501)

3. **Verify User Authentication:**
   - Check if user is properly authenticated
   - Verify session is valid
   - Try logging out and back in

4. **Check Item Count vs Items:**
   - If `itemCount > 0` but `items.length === 0`, it's an RLS/query issue
   - Run the migration again
   - Verify policies with the SQL query above

### Common Errors

**Error: `42501` - Permission Denied**
- **Solution:** Run migration `011_ensure_rls_policies_production.sql`
- **Cause:** RLS policies missing or incorrect

**Error: `relation "life_items" does not exist`**
- **Solution:** Run migration `002_core_schema.sql` first
- **Cause:** Table not created

**Error: `column "user_id" does not exist`**
- **Solution:** Run migration `002_core_schema.sql`
- **Cause:** Table schema outdated

## Prevention

To prevent this issue in the future:

1. **Always run migrations in production** after deploying code changes
2. **Test RLS policies** after any database changes
3. **Monitor Supabase logs** for permission errors
4. **Use explicit user_id filters** in queries (as we've done)

## Verification Checklist

- [ ] Migration `011_ensure_rls_policies_production.sql` run successfully
- [ ] 4 RLS policies visible in `pg_policies` query
- [ ] Items visible in dashboard after refresh
- [ ] No errors in browser console
- [ ] No errors in Supabase logs
- [ ] Can add new items successfully
- [ ] Can view existing items

## Support

If items still don't show after following these steps:

1. **Check Vercel deployment logs** for any build/runtime errors
2. **Check Supabase logs** for database errors
3. **Share browser console errors** for debugging
4. **Verify environment variables** are set correctly in Vercel

---

**Status:** ✅ Code changes committed and ready to deploy
**Action Required:** Run migration `011_ensure_rls_policies_production.sql` in production Supabase

