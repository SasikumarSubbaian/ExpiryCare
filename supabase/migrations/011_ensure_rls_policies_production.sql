-- Ensure RLS policies are correctly set up for production
-- This migration ensures users can view their own items

-- First, ensure RLS is enabled
ALTER TABLE life_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own life items" ON life_items;
DROP POLICY IF EXISTS "Users can insert their own life items" ON life_items;
DROP POLICY IF EXISTS "Users can update their own life items" ON life_items;
DROP POLICY IF EXISTS "Users can delete their own life items" ON life_items;
DROP POLICY IF EXISTS "Family members can view shared items" ON life_items;

-- Recreate SELECT policy - users can only see their own items
-- This is critical for dashboard visibility
CREATE POLICY "Users can view their own life items"
  ON life_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

-- Recreate INSERT policy
CREATE POLICY "Users can insert their own life items"
  ON life_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

-- Recreate UPDATE policy
CREATE POLICY "Users can update their own life items"
  ON life_items FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

-- Recreate DELETE policy
CREATE POLICY "Users can delete their own life items"
  ON life_items FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

-- Verify policies are created correctly
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'life_items';
  
  IF policy_count < 4 THEN
    RAISE EXCEPTION 'Expected 4 RLS policies for life_items, found %', policy_count;
  END IF;
  
  RAISE NOTICE 'Successfully created % RLS policies for life_items table', policy_count;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON life_items TO authenticated;

-- Create index if it doesn't exist (for performance)
CREATE INDEX IF NOT EXISTS idx_life_items_user_id ON life_items(user_id);
CREATE INDEX IF NOT EXISTS idx_life_items_expiry_date ON life_items(expiry_date);

