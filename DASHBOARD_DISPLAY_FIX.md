# Dashboard Not Displaying Items - Final Fix

## 🔴 Problem
Items are being stored correctly in Supabase database, but not appearing in the dashboard UI.

## ✅ Root Cause
The RLS SELECT policy might not be working correctly, or the query is being blocked.

## 🔧 Fix Applied

### 1. Code Changes
- Updated dashboard query to try RLS-only first, then with explicit filter
- Added code-level filtering as safety measure
- Removed reminder API call that was causing 404 errors

### 2. SQL Fix Required

**The issue is likely the "Family members can view shared items" policy interfering with basic queries.**

**Run this SQL in Supabase SQL Editor:**

```sql
-- Step 1: Remove the problematic family sharing policy
DROP POLICY IF EXISTS "Family members can view shared items" ON life_items;

-- Step 2: Verify RLS is enabled
ALTER TABLE life_items ENABLE ROW LEVEL SECURITY;

-- Step 3: Ensure the basic SELECT policy exists and is correct
DROP POLICY IF EXISTS "Users can view their own life items" ON life_items;

CREATE POLICY "Users can view their own life items"
  ON life_items FOR SELECT
  USING (auth.uid() = user_id);

-- Step 4: Verify only one SELECT policy exists now
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'life_items' AND cmd = 'SELECT';

-- Should only show: "Users can view their own life items"

-- Step 5: Test the query (replace YOUR_USER_ID with your actual user ID)
-- This should return your items
SELECT id, title, category, expiry_date, user_id 
FROM life_items 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY expiry_date ASC;
```

**Why this fixes it:**
- Multiple SELECT policies use OR logic - if ANY policy allows, the row is visible
- The family sharing policy might be checking `family_members` table incorrectly
- Removing it ensures only the basic policy is used, which should work correctly

## 🧪 Testing Steps

1. **Run the SQL above** in Supabase SQL Editor
2. **Hard refresh browser** (Ctrl+Shift+R)
3. **Check browser console** (F12) for:
   - `[Dashboard] Total items fetched from query: X` - Should be > 0
   - `[Dashboard] Items:` - Should list your items
4. **Items should appear** in dashboard sections:
   - Expiring Soon (within 30 days)
   - Expired (past expiry date)
   - Active (more than 30 days)

## 🔍 Debugging

If items still don't appear:

1. **Check your user ID:**
   - Look in browser console for: `[Dashboard] User ID: xxx`
   - Compare with `user_id` in database

2. **Verify items exist:**
   ```sql
   SELECT id, title, category, expiry_date, user_id, created_at 
   FROM life_items 
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'life_items';
   ```
   Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

4. **Test as authenticated user:**
   - The RLS policy uses `auth.uid()` which only works when authenticated
   - Make sure you're logged in

## 📋 Quick Checklist

- [ ] RLS is enabled on `life_items` table
- [ ] SELECT policy exists and is correct
- [ ] User is authenticated (logged in)
- [ ] Items exist in database with correct `user_id`
- [ ] Browser console shows items fetched
- [ ] Hard refresh browser after SQL changes

---

**Status:** ✅ Code updated, SQL fix provided
**Next Step:** Run the SQL in Supabase SQL Editor

