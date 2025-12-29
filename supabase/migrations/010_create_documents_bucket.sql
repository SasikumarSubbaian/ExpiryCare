-- Create storage bucket for documents
-- Note: Buckets must be created via Supabase Storage API or Dashboard
-- This SQL creates the bucket via the storage API

-- Insert bucket into storage.buckets table
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Storage bucket policy: Users can upload their own documents
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

-- Verify bucket was created (optional - may require elevated permissions)
-- If you get permission errors, you can verify via Supabase Dashboard > Storage
-- SELECT id, name, public, file_size_limit 
-- FROM storage.buckets 
-- WHERE id = 'documents';

