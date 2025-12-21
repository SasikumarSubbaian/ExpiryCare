-- Update RLS policies to allow family members to view shared items

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Family members can view shared items" ON life_items;
DROP POLICY IF EXISTS "Users can view their own life items" ON life_items;

-- Policy: Family members can view items from users who have invited them
-- This policy replaces "Users can view their own life items" and includes both own items and shared items
CREATE POLICY "Family members can view shared items"
  ON life_items FOR SELECT
  USING (
    -- User owns the item
    auth.uid() = user_id
    OR
    -- User is a family member of the item owner
    EXISTS (
      SELECT 1 FROM family_members
      WHERE family_members.user_id = life_items.user_id
      AND family_members.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

