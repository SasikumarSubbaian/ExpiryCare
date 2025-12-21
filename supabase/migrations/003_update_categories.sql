-- Update life_items table to include AMC and Other categories
ALTER TABLE life_items 
DROP CONSTRAINT IF EXISTS life_items_category_check;

ALTER TABLE life_items
ADD CONSTRAINT life_items_category_check 
CHECK (category IN ('warranty', 'insurance', 'amc', 'subscription', 'medicine', 'other'));

