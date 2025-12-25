-- Fix 403 Permission Denied Error for life_items table
-- This migration fixes RLS policies that may be causing permission errors

-- Drop and recreate INSERT policy with explicit checks
DROP POLICY IF EXISTS "Users can insert their own life items" ON life_items;

CREATE POLICY "Users can insert their own life items"
  ON life_items FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL
  );

-- Drop and recreate SELECT policy
DROP POLICY IF EXISTS "Users can view their own life items" ON life_items;

CREATE POLICY "Users can view their own life items"
  ON life_items FOR SELECT
  USING (
    auth.uid() = user_id AND
    auth.uid() IS NOT NULL
  );

-- Ensure UPDATE policy is correct
DROP POLICY IF EXISTS "Users can update their own life items" ON life_items;

CREATE POLICY "Users can update their own life items"
  ON life_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure DELETE policy is correct
DROP POLICY IF EXISTS "Users can delete their own life items" ON life_items;

CREATE POLICY "Users can delete their own life items"
  ON life_items FOR DELETE
  USING (auth.uid() = user_id);

-- If the foreign key is still causing issues, we can temporarily disable it
-- But first, let's try a different approach - use a trigger to validate instead

-- Create a function to validate user_id (only if needed)
CREATE OR REPLACE FUNCTION validate_life_item_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called before insert/update
  -- We can add custom validation here if needed
  -- For now, we'll just ensure user_id matches auth.uid()
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS validate_life_item_user_id_trigger ON life_items;

-- Create trigger (optional - RLS should handle this)
-- CREATE TRIGGER validate_life_item_user_id_trigger
--   BEFORE INSERT OR UPDATE ON life_items
--   FOR EACH ROW
--   EXECUTE FUNCTION validate_life_item_user_id();

-- Note: The foreign key constraint to auth.users should work fine
-- The issue might be with how Supabase validates it
-- If problems persist, we can remove the foreign key and rely on RLS + triggers

