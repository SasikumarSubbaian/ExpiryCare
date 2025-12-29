-- Create OCR logs table for tracking OCR usage and abuse protection
CREATE TABLE IF NOT EXISTS ocr_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_hash TEXT NOT NULL, -- SHA-256 hash for duplicate detection
  category TEXT, -- Predicted or user-selected category
  success BOOLEAN NOT NULL DEFAULT true,
  ocr_result JSONB, -- Store OCR result for duplicate reuse
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_id ON ocr_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_file_hash ON ocr_logs(file_hash);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_created_at ON ocr_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_created ON ocr_logs(user_id, created_at);

-- Enable Row Level Security
ALTER TABLE ocr_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own OCR logs" ON ocr_logs;
DROP POLICY IF EXISTS "Users can insert their own OCR logs" ON ocr_logs;

-- Create policy: Users can only see their own OCR logs
CREATE POLICY "Users can view their own OCR logs"
  ON ocr_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own OCR logs
CREATE POLICY "Users can insert their own OCR logs"
  ON ocr_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

