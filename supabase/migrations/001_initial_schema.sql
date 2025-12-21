-- Create expiries table
CREATE TABLE IF NOT EXISTS expiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('warranty', 'insurance', 'medicine', 'subscription')),
  name TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  reminder_days INTEGER NOT NULL DEFAULT 7 CHECK (reminder_days >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_expiries_user_id ON expiries(user_id);

-- Create index on expiry_date for reminder queries
CREATE INDEX IF NOT EXISTS idx_expiries_expiry_date ON expiries(expiry_date);

-- Enable Row Level Security
ALTER TABLE expiries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can view their own expiries" ON expiries;
DROP POLICY IF EXISTS "Users can insert their own expiries" ON expiries;
DROP POLICY IF EXISTS "Users can update their own expiries" ON expiries;
DROP POLICY IF EXISTS "Users can delete their own expiries" ON expiries;

-- Create policy: Users can only see their own expiries
CREATE POLICY "Users can view their own expiries"
  ON expiries FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own expiries
CREATE POLICY "Users can insert their own expiries"
  ON expiries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own expiries
CREATE POLICY "Users can update their own expiries"
  ON expiries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own expiries
CREATE POLICY "Users can delete their own expiries"
  ON expiries FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists (for idempotent migrations)
DROP TRIGGER IF EXISTS update_expiries_updated_at ON expiries;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_expiries_updated_at
  BEFORE UPDATE ON expiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

