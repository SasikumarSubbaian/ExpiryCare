-- Create user_plans table for managing subscription plans
CREATE TABLE IF NOT EXISTS user_plans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'family')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Users can view their own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can update their own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can insert their own plan" ON user_plans;

-- RLS Policies for user_plans
CREATE POLICY "Users can view their own plan"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan"
  ON user_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan"
  ON user_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index on plan for faster queries
CREATE INDEX IF NOT EXISTS idx_user_plans_plan ON user_plans(plan);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(status);

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_plans_updated_at ON user_plans;
CREATE TRIGGER update_user_plans_updated_at
  BEFORE UPDATE ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

