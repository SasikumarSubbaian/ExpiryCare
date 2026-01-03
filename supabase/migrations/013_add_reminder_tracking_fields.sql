-- Migration: Add reminder tracking fields to life_items table
-- This allows us to track if first reminder (expiryDate - reminderDays) and last day reminder (expiryDate - 1) have been sent
-- DO NOT delete or rename existing fields

-- Add first_reminder_sent field (tracks if reminder at expiryDate - reminderDays was sent)
ALTER TABLE life_items 
ADD COLUMN IF NOT EXISTS first_reminder_sent BOOLEAN DEFAULT FALSE NOT NULL;

-- Add last_day_reminder_sent field (tracks if reminder at expiryDate - 1 day was sent)
ALTER TABLE life_items 
ADD COLUMN IF NOT EXISTS last_day_reminder_sent BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for faster queries on reminder tracking
CREATE INDEX IF NOT EXISTS idx_life_items_first_reminder_sent ON life_items(first_reminder_sent) WHERE first_reminder_sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_life_items_last_day_reminder_sent ON life_items(last_day_reminder_sent) WHERE last_day_reminder_sent = FALSE;

-- Add comment for documentation
COMMENT ON COLUMN life_items.first_reminder_sent IS 'Tracks if first reminder (expiryDate - reminderDays) has been sent';
COMMENT ON COLUMN life_items.last_day_reminder_sent IS 'Tracks if last day reminder (expiryDate - 1 day) has been sent';
