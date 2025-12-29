-- Create storage bucket for documents
-- Note: In Supabase, buckets should be created via Dashboard or Storage API
-- This migration creates the bucket if it doesn't exist and sets up RLS policies
-- IMPORTANT: Run this as the postgres role (default in Supabase SQL Editor)

-- Insert bucket into storage.buckets table (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS is already enabled on storage.objects by default in Supabase
-- We don't need to ALTER the table - just create policies

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Storage bucket policy: Users can upload their own documents
-- Files must be in a folder named with the user's UUID
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage bucket policy: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage bucket policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: Verification query removed to avoid permission errors
-- To verify bucket creation:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Check if 'documents' bucket exists
-- 3. Or use: SELECT * FROM storage.buckets WHERE id = 'documents'; (requires service_role)

