-- Table to track sent reminders and avoid duplicates
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  life_item_id UUID NOT NULL REFERENCES life_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_day INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reminder_logs_life_item_id ON reminder_logs(life_item_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_id ON reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at);

-- Unique index to prevent duplicate reminders (same item, reminder day, and date)
-- This ensures we don't send the same reminder twice on the same day
-- Using DATE_TRUNC with AT TIME ZONE 'UTC' to make it immutable for index
DROP INDEX IF EXISTS idx_reminder_logs_unique;
CREATE UNIQUE INDEX idx_reminder_logs_unique 
  ON reminder_logs(life_item_id, reminder_day, DATE_TRUNC('day', sent_at AT TIME ZONE 'UTC'));

-- Enable Row Level Security
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotent migrations)
DROP POLICY IF EXISTS "Users can view their own reminder logs" ON reminder_logs;

-- RLS Policies: Users can only see their own reminder logs
CREATE POLICY "Users can view their own reminder logs"
  ON reminder_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Insert/update will be done by service role or server-side code
-- For MVP, we'll use service role key in the API route

