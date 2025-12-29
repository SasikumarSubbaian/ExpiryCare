-- Abuse Protection Tables
-- Creates tables for OCR cache and reminder tracking
-- This migration is idempotent - safe to run multiple times

-- ============================================
-- 1. OCR Cache Table (for duplicate detection)
-- ============================================
CREATE TABLE IF NOT EXISTS ocr_cache (
  file_hash TEXT PRIMARY KEY,
  ocr_text TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ocr_cache_created_at ON ocr_cache(created_at);

-- Enable Row Level Security
ALTER TABLE ocr_cache ENABLE ROW LEVEL SECURITY;

-- OCR Cache Policy (read-only for all authenticated users)
-- Drop policy if exists to make it idempotent
DROP POLICY IF EXISTS "Users can read OCR cache" ON ocr_cache;
CREATE POLICY "Users can read OCR cache" ON ocr_cache FOR SELECT USING (true);

-- ============================================
-- 2. Reminder Logs Table Enhancement
-- Note: This table already exists from migration 005_reminder_tracking.sql
-- We're adding the reminder_type column and additional indexes for abuse protection
-- ============================================

-- Add reminder_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reminder_logs' 
    AND column_name = 'reminder_type'
  ) THEN
    ALTER TABLE reminder_logs 
    ADD COLUMN reminder_type TEXT NOT NULL DEFAULT 'email' 
    CHECK (reminder_type IN ('email', 'whatsapp'));
    
    -- Update existing rows to have 'email' as default
    UPDATE reminder_logs SET reminder_type = 'email' WHERE reminder_type IS NULL;
  END IF;
END $$;

-- Add created_at column if it doesn't exist (for tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reminder_logs' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE reminder_logs 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL;
    
    -- Set created_at to sent_at for existing rows
    UPDATE reminder_logs SET created_at = sent_at WHERE created_at IS NULL;
  END IF;
END $$;

-- Additional indexes for abuse protection (create if not exists)
CREATE INDEX IF NOT EXISTS idx_reminder_logs_type ON reminder_logs(reminder_type);

-- Composite index for daily/monthly queries (for rate limiting)
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_type_date ON reminder_logs(user_id, reminder_type, sent_at);

-- Note: reminder_logs RLS policies are already created in migration 005
-- No need to recreate them here

-- ============================================
-- Cleanup Script (run periodically, not in migration)
-- ============================================
-- DELETE FROM ocr_cache WHERE created_at < NOW() - INTERVAL '90 days';

