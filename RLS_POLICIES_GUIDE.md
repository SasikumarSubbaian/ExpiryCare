# RLS Policies Verification Guide

Complete guide to verify and create Row Level Security (RLS) policies in Supabase for ExpiryCare.

## Overview

RLS policies ensure that users can only access their own data. This guide shows you how to verify and create the required policies in Supabase Dashboard.

## Tables and Required Policies

### 1. `life_items` Table

**Required Policies:**
- ✅ Users can view their own items
- ✅ Users can view items shared with them (via family members)
- ✅ Users can insert their own items
- ✅ Users can update their own items
- ✅ Users can delete their own items

**Status:** Already created in `002_core_schema.sql` and `006_family_sharing.sql`

### 2. `family_members` Table

**Required Policies:**
- ✅ Users can view their own family members
- ✅ Users can insert their own family members
- ✅ Users can update their own family members
- ✅ Users can delete their own family members

**Status:** Already created in `002_core_schema.sql`

### 3. `user_plans` Table

**Required Policies:**
- ✅ Users can view their own plan
- ✅ Users can update their own plan

**Status:** Already created in `007_pricing_plans.sql`

### 4. `reminder_logs` Table

**Required Policies:**
- ✅ Users can view their own reminder logs
- ⚠️ Insert/update done by service role (no user policy needed)

**Status:** Already created in `005_reminder_tracking.sql`

## How to Verify RLS Policies in Supabase

### Method 1: Using Supabase Dashboard (Recommended)

#### Step 1: Access Authentication & Policies

1. Go to your Supabase project dashboard
2. Click on **"Authentication"** in the left sidebar
3. Click on **"Policies"** tab (or go to **"Table Editor"** → Select a table → **"Policies"** tab)

#### Step 2: Check Each Table

**For `life_items` table:**
1. Go to **"Table Editor"** → Click on `life_items` table
2. Click on the **"Policies"** tab (next to "Data" and "Structure")
3. You should see these policies:
   - ✅ "Family members can view shared items" (SELECT)
   - ✅ "Users can insert their own life items" (INSERT)
   - ✅ "Users can update their own life items" (UPDATE)
   - ✅ "Users can delete their own life items" (DELETE)

**For `family_members` table:**
1. Go to **"Table Editor"** → Click on `family_members` table
2. Click on the **"Policies"** tab
3. You should see:
   - ✅ "Users can view their own family members" (SELECT)
   - ✅ "Users can insert their own family members" (INSERT)
   - ✅ "Users can update their own family members" (UPDATE)
   - ✅ "Users can delete their own family members" (DELETE)

**For `user_plans` table:**
1. Go to **"Table Editor"** → Click on `user_plans` table
2. Click on the **"Policies"** tab
3. You should see:
   - ✅ "Users can view their own plan" (SELECT)
   - ✅ "Users can update their own plan" (UPDATE)

**For `reminder_logs` table:**
1. Go to **"Table Editor"** → Click on `reminder_logs` table
2. Click on the **"Policies"** tab
3. You should see:
   - ✅ "Users can view their own reminder logs" (SELECT)

#### Step 3: Verify RLS is Enabled

For each table, check that RLS is enabled:
1. Go to **"Table Editor"** → Select the table
2. Click on **"Structure"** tab
3. Look for **"Row Level Security"** - it should show **"Enabled"** ✅

### Method 2: Using SQL Editor

You can verify policies by running SQL queries:

```sql
-- Check if RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('life_items', 'family_members', 'user_plans', 'reminder_logs');

-- List all policies for a specific table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'life_items';
```

## How to Create RLS Policies (If Missing)

### Option 1: Run Migration Files (Recommended)

If policies are missing, run the migration files in order:

1. **`002_core_schema.sql`** - Creates policies for `profiles`, `life_items`, and `family_members`
2. **`005_reminder_tracking.sql`** - Creates policy for `reminder_logs`
3. **`006_family_sharing.sql`** - Updates `life_items` policy for family sharing
4. **`007_pricing_plans.sql`** - Creates policies for `user_plans`

**Steps:**
1. Go to **"SQL Editor"** in Supabase Dashboard
2. Click **"New query"**
3. Copy and paste the contents of each migration file
4. Click **"Run"** (or press Ctrl+Enter)
5. Verify success message

### Option 2: Create Policies Manually via Dashboard

#### For `life_items` Table:

1. Go to **"Table Editor"** → `life_items` → **"Policies"** tab
2. Click **"New Policy"**

**Policy 1: View Own and Shared Items (SELECT)**
- **Policy name:** "Family members can view shared items"
- **Allowed operation:** SELECT
- **Policy definition:**
  ```sql
  (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM family_members
    WHERE family_members.user_id = life_items.user_id
    AND family_members.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
  ```

**Policy 2: Insert Own Items (INSERT)**
- **Policy name:** "Users can insert their own life items"
- **Allowed operation:** INSERT
- **Policy definition:**
  ```sql
  auth.uid() = user_id
  ```

**Policy 3: Update Own Items (UPDATE)**
- **Policy name:** "Users can update their own life items"
- **Allowed operation:** UPDATE
- **Using expression:**
  ```sql
  auth.uid() = user_id
  ```
- **With check expression:**
  ```sql
  auth.uid() = user_id
  ```

**Policy 4: Delete Own Items (DELETE)**
- **Policy name:** "Users can delete their own life items"
- **Allowed operation:** DELETE
- **Policy definition:**
  ```sql
  auth.uid() = user_id
  ```

#### For `family_members` Table:

**Policy 1: View Own Family Members (SELECT)**
- **Policy name:** "Users can view their own family members"
- **Allowed operation:** SELECT
- **Policy definition:**
  ```sql
  auth.uid() = user_id
  ```

**Policy 2: Insert Own Family Members (INSERT)**
- **Policy name:** "Users can insert their own family members"
- **Allowed operation:** INSERT
- **Policy definition:**
  ```sql
  auth.uid() = user_id
  ```

**Policy 3: Update Own Family Members (UPDATE)**
- **Policy name:** "Users can update their own family members"
- **Allowed operation:** UPDATE
- **Using expression:**
  ```sql
  auth.uid() = user_id
  ```
- **With check expression:**
  ```sql
  auth.uid() = user_id
  ```

**Policy 4: Delete Own Family Members (DELETE)**
- **Policy name:** "Users can delete their own family members"
- **Allowed operation:** DELETE
- **Policy definition:**
  ```sql
  auth.uid() = user_id
  ```

#### For `user_plans` Table:

**Policy 1: View Own Plan (SELECT)**
- **Policy name:** "Users can view their own plan"
- **Allowed operation:** SELECT
- **Policy definition:**
  ```sql
  auth.uid() = user_id
  ```

**Policy 2: Update Own Plan (UPDATE)**
- **Policy name:** "Users can update their own plan"
- **Allowed operation:** UPDATE
- **Using expression:**
  ```sql
  auth.uid() = user_id
  ```
- **With check expression:**
  ```sql
  auth.uid() = user_id
  ```

#### For `reminder_logs` Table:

**Policy 1: View Own Reminder Logs (SELECT)**
- **Policy name:** "Users can view their own reminder logs"
- **Allowed operation:** SELECT
- **Policy definition:**
  ```sql
  auth.uid() = user_id
  ```

**Note:** INSERT and UPDATE for `reminder_logs` are done by the service role in the API route, so no user policies are needed.

## Quick Verification Checklist

Use this checklist to verify all RLS policies:

### `life_items` Table
- [ ] RLS is enabled
- [ ] "Family members can view shared items" (SELECT) exists
- [ ] "Users can insert their own life items" (INSERT) exists
- [ ] "Users can update their own life items" (UPDATE) exists
- [ ] "Users can delete their own life items" (DELETE) exists

### `family_members` Table
- [ ] RLS is enabled
- [ ] "Users can view their own family members" (SELECT) exists
- [ ] "Users can insert their own family members" (INSERT) exists
- [ ] "Users can update their own family members" (UPDATE) exists
- [ ] "Users can delete their own family members" (DELETE) exists

### `user_plans` Table
- [ ] RLS is enabled
- [ ] "Users can view their own plan" (SELECT) exists
- [ ] "Users can update their own plan" (UPDATE) exists

### `reminder_logs` Table
- [ ] RLS is enabled
- [ ] "Users can view their own reminder logs" (SELECT) exists

## Testing RLS Policies

### Test 1: User Can Only See Own Items

1. Create two test users in Supabase Auth
2. User A creates a `life_item`
3. User B logs in - should NOT see User A's item
4. ✅ **Expected:** User B sees empty list or only their own items

### Test 2: Family Sharing Works

1. User A creates a `life_item`
2. User A invites User B's email to `family_members`
3. User B signs up with that email
4. User B logs in - should see User A's item
5. ✅ **Expected:** User B sees shared items in "Shared with Me" section

### Test 3: User Can Only Manage Own Family Members

1. User A invites User C's email
2. User B tries to delete User A's family member
3. ✅ **Expected:** Error or no permission

### Test 4: Service Role Can Access All Data

1. Use service role key in API route (`/api/reminders`)
2. Should be able to read all `reminder_logs` and `life_items`
3. ✅ **Expected:** No RLS restrictions (service role bypasses RLS)

## Troubleshooting

### RLS is Enabled but Policies Not Working

1. **Check policy expressions:**
   - Verify `auth.uid()` is being used correctly
   - Check for typos in column names (`user_id` vs `user_id`)

2. **Check user authentication:**
   - Ensure user is logged in
   - Verify `auth.uid()` returns a valid UUID

3. **Check policy order:**
   - Some policies might conflict
   - Check if multiple SELECT policies exist (should use OR logic)

### Policies Not Showing in Dashboard

1. **Refresh the page**
2. **Check you're looking at the correct table**
3. **Verify RLS is enabled** (policies won't work if RLS is disabled)

### Service Role Access Issues

- Service role key bypasses RLS by design
- If reminders aren't working, check:
  - `SUPABASE_SERVICE_ROLE_KEY` is set correctly
  - Service role client is being used in API route

## Summary

✅ **All RLS policies are already created in the migration files**

To verify:
1. Run all migration files in order
2. Check each table's Policies tab in Supabase Dashboard
3. Verify RLS is enabled for each table
4. Test with multiple users to ensure policies work

**If policies are missing:** Run the migration files again (they're idempotent and safe to run multiple times).

---

**Last Updated:** Launch preparation

