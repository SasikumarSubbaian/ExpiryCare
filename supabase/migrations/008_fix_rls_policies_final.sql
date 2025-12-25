-- Final fix for RLS policies on life_items table
-- This ensures inserts work correctly without foreign key constraint

-- First, ensure RLS is enabled
ALTER TABLE life_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own life items" ON life_items;
DROP POLICY IF EXISTS "Users can insert their own life items" ON life_items;
DROP POLICY IF EXISTS "Users can update their own life items" ON life_items;
DROP POLICY IF EXISTS "Users can delete their own life items" ON life_items;

-- Recreate SELECT policy - users can only see their own items
CREATE POLICY "Users can view their own life items"
  ON life_items FOR SELECT
  USING (auth.uid() = user_id);

-- Recreate INSERT policy - users can only insert items with their own user_id
-- This is the critical one for fixing the 403 error
CREATE POLICY "Users can insert their own life items"
  ON life_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Recreate UPDATE policy
CREATE POLICY "Users can update their own life items"
  ON life_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recreate DELETE policy
CREATE POLICY "Users can delete their own life items"
  ON life_items FOR DELETE
  USING (auth.uid() = user_id);

-- Verify policies are created
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
WHERE tablename = 'life_items'
ORDER BY policyname;

-- Test query to verify RLS is working (run as authenticated user via app)
-- This should return your items if RLS is correct
-- SELECT * FROM life_items WHERE user_id = auth.uid();

