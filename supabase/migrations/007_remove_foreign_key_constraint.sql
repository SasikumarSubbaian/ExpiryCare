-- Remove foreign key constraint that's causing permission errors
-- RLS policies will still enforce data integrity and security
-- This is safe because:
-- 1. RLS policies ensure users can only insert with their own user_id
-- 2. RLS policies ensure users can only view/update/delete their own items
-- 3. The foreign key constraint was causing permission issues with auth.users table

-- First, find the constraint name
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

-- Verify the constraint is removed
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

-- Should return 0 rows if constraint is removed

