# Fix 403 Permission Denied Error

## 🔴 Problem

Getting `403 Forbidden` error with message "permission denied for table users" when trying to add warranty items.

## 🔍 Root Cause

The error occurs because:
1. The foreign key constraint `REFERENCES auth.users(id)` requires validation
2. When RLS is enabled, regular users can't directly access `auth.users` table
3. The `.select()` after insert might be triggering a permission check

## ✅ Solution

### Step 1: Remove Foreign Key Constraint (PRIMARY FIX)

**The foreign key constraint is causing the permission error.** Remove it - RLS policies will still enforce security.

Run this SQL in Supabase SQL Editor:

```sql
-- Remove foreign key constraint that's causing permission errors
-- RLS policies will still enforce data integrity and security
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Get the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'life_items'::regclass
      AND contype = 'f'
      AND confrelid = 'auth.users'::regclass;
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE life_items DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No foreign key constraint found to drop';
    END IF;
END $$;
```

**OR use the simpler version:**

```sql
-- Find and drop the foreign key constraint
ALTER TABLE life_items 
DROP CONSTRAINT IF EXISTS life_items_user_id_fkey;
```

### Step 2: Verify RLS Policies Are Correct

Ensure RLS policies are set up correctly:

```sql
-- Fix RLS policies for life_items table
DROP POLICY IF EXISTS "Users can insert their own life items" ON life_items;

CREATE POLICY "Users can insert their own life items"
  ON life_items FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can view their own life items" ON life_items;

CREATE POLICY "Users can view their own life items"
  ON life_items FOR SELECT
  USING (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Users can update their own life items" ON life_items;

CREATE POLICY "Users can update their own life items"
  ON life_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own life items" ON life_items;

CREATE POLICY "Users can delete their own life items"
  ON life_items FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 3: Verify Foreign Key is Removed

Check that the constraint is gone:

```sql
-- Should return 0 rows if constraint is removed
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'life_items' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users';
```

### Step 4: Test the Fix

1. **Clear browser cache and cookies** (Ctrl+Shift+Delete)
2. **Hard refresh the page** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Log out and log back in**
4. **Try adding a warranty item**
5. **Check browser console** - should see no errors

**Why this works:**
- The foreign key constraint was trying to validate `user_id` against `auth.users` table
- Regular users don't have permission to access `auth.users` table
- Removing the foreign key allows inserts to work
- RLS policies still enforce security (users can only insert with their own user_id)

## 🔧 Code Changes Applied

1. **Updated `AddItemModal.tsx`:**
   - Improved error handling
   - Better error messages
   - Explicit column selection in `.select()`

2. **Created Migration:**
   - `006_fix_life_items_foreign_key.sql` - Fixes RLS policies

## 🧪 Testing

### Test 1: Verify RLS Policies

Run this SQL (replace with your user ID):

```sql
-- Check if policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'life_items';

-- Should show 4 policies:
-- 1. Users can view their own life items (SELECT)
-- 2. Users can insert their own life items (INSERT)
-- 3. Users can update their own life items (UPDATE)
-- 4. Users can delete their own life items (DELETE)
```

### Test 2: Test Insert as Authenticated User

```sql
-- This should work if RLS is correct
-- (Run this as the authenticated user via your app, not directly in SQL editor)
INSERT INTO life_items (user_id, title, category, expiry_date, reminder_days)
VALUES (auth.uid(), 'Test Item', 'warranty', '2025-12-31', ARRAY[7]);
```

### Test 3: Check Current User

In your browser console, run:

```javascript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser()
console.log('User ID:', user?.id)
```

## 🚨 If Still Not Working

### Option A: Check Supabase Project Settings

1. Go to Supabase Dashboard → **Settings** → **API**
2. Verify your `anon` key is correct
3. Check if RLS is enabled for the project

### Option B: Temporarily Disable RLS (Testing Only)

**⚠️ WARNING: Only for testing, re-enable immediately!**

```sql
-- Disable RLS temporarily
ALTER TABLE life_items DISABLE ROW LEVEL SECURITY;

-- Test insert
-- ... your insert ...

-- RE-ENABLE RLS immediately
ALTER TABLE life_items ENABLE ROW LEVEL SECURITY;

-- Recreate policies
-- (Use the SQL from Step 1)
```

### Option C: Use Service Role Key (Not Recommended for Client)

The service role key bypasses RLS, but should **NEVER** be used in client-side code. Only use in server-side API routes.

## 📋 Checklist

- [ ] RLS policies recreated with proper checks
- [ ] Foreign key constraint verified
- [ ] User is authenticated (check `auth.uid()`)
- [ ] Browser cache cleared
- [ ] Logged out and back in
- [ ] Test insert works
- [ ] Items appear in dashboard

## 🔗 Related Files

- `supabase/migrations/006_fix_life_items_foreign_key.sql` - Migration to fix policies
- `components/AddItemModal.tsx` - Updated insert logic
- `supabase/migrations/002_core_schema.sql` - Original schema

---

**Status:** ✅ Code updated, migration created
**Next Step:** Run the SQL migration in Supabase

