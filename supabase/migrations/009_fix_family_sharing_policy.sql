-- Fix family sharing policy that might be causing dashboard display issues
-- The complex EXISTS subquery in the family sharing policy might be causing RLS evaluation issues

-- Step 1: Drop the problematic family sharing policy
DROP POLICY IF EXISTS "Family members can view shared items" ON life_items;

-- Step 2: Ensure the basic policy exists and is correct
DROP POLICY IF EXISTS "Users can view their own life items" ON life_items;

CREATE POLICY "Users can view their own life items"
  ON life_items FOR SELECT
  USING (auth.uid() = user_id);

-- Step 3: Verify only one SELECT policy exists now
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'life_items' AND cmd = 'SELECT';

-- Should only show: "Users can view their own life items"
-- This simple policy should work correctly for displaying items in dashboard

-- Note: If you need family sharing later, we can add it back with a better implementation
-- that doesn't interfere with basic queries

