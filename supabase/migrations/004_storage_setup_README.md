# Supabase Storage Setup

## Manual Steps Required

The storage bucket needs to be created manually in the Supabase Dashboard:

### 1. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `documents`
   - **Public**: `false` (private bucket - users can only access their own files)
   - **File size limit**: `10MB` (or adjust as needed)
   - **Allowed MIME types**: 
     - `image/*` (for images)
     - `application/pdf` (for PDFs)

### 2. Set Up Storage Policies

After creating the bucket, run the SQL from `004_storage_setup.sql` in the SQL Editor:

```sql
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
```

### 3. Verify Setup

- Files are stored in user-specific folders: `{user_id}/{filename}`
- Each user can only access their own documents
- Documents are private by default

## File Structure

Files are organized as:
```
documents/
  ├── {user_id_1}/
  │   ├── 1234567890-abc123.pdf
  │   └── 1234567891-def456.jpg
  ├── {user_id_2}/
  │   └── 1234567892-ghi789.png
  └── ...
```

## Security

- Row Level Security (RLS) policies ensure users can only access their own files
- Files are stored in user-specific folders
- Public URLs are generated for viewing, but access is still controlled by RLS

