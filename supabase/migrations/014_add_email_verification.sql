-- Migration: Add Email Verification System with OTP
-- This adds email verification using OTP (One-Time Password) for ExpiryCare

-- 1. Add email_verified column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for faster queries on email verification status
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified) WHERE email_verified = FALSE;

-- 2. Create email_verifications table for OTP management
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL, -- Hashed OTP (bcrypt)
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for email_verifications
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_verified ON email_verifications(verified) WHERE verified = FALSE;

-- Unique constraint: One active verification per user (not verified yet)
-- Note: We can't use NOW() in index predicate (not IMMUTABLE)
-- Instead, we'll enforce uniqueness at application level and use a simpler index
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verifications_user_active 
ON email_verifications(user_id) 
WHERE verified = FALSE;

-- Enable Row Level Security
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_verifications
-- Users can only view their own verification records
DROP POLICY IF EXISTS "Users can view their own email verifications" ON email_verifications;
CREATE POLICY "Users can view their own email verifications"
  ON email_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Insert/update will be done by service role or server-side code
-- For MVP, we'll use service role key in the API route

-- 3. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_email_verifications_updated_at ON email_verifications;
CREATE TRIGGER update_email_verifications_updated_at
  BEFORE UPDATE ON email_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_verifications_updated_at();

-- 4. Function to clean up expired OTPs (can be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verifications
  WHERE expires_at < TIMEZONE('utc', NOW()) - INTERVAL '1 day';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update handle_new_user function to set email_verified = false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, email_verified)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    FALSE -- New users start as unverified
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = FALSE; -- Reset verification status if user already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON COLUMN profiles.email_verified IS 'Tracks if user has verified their email address via OTP';
COMMENT ON TABLE email_verifications IS 'Stores OTP verification codes for email verification';
COMMENT ON COLUMN email_verifications.otp_hash IS 'Bcrypt hashed OTP for security';
COMMENT ON COLUMN email_verifications.attempts IS 'Number of failed OTP verification attempts';
COMMENT ON COLUMN email_verifications.expires_at IS 'OTP expiration timestamp (typically 10 minutes)';
