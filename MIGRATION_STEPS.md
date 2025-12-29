# Migration Steps for Abuse Protection

## Step 1: Run the Migration

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/010_abuse_protection.sql`
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

## Step 2: Verify Success

After running, you should see:
- ✅ Success message
- No errors

## Step 3: Verify Tables Created

Run this query to verify:

```sql
-- Check if ocr_cache table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ocr_cache', 'reminder_logs');

-- Check reminder_logs columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reminder_logs' 
ORDER BY ordinal_position;

-- Check ocr_cache columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ocr_cache' 
ORDER BY ordinal_position;
```

## Expected Results

### ocr_cache table should have:
- file_hash (TEXT, PRIMARY KEY)
- ocr_text (TEXT)
- confidence (TEXT)
- created_at (TIMESTAMP WITH TIME ZONE)

### reminder_logs table should have:
- All original columns from migration 005
- **reminder_type** (TEXT) - NEW
- **created_at** (TIMESTAMP WITH TIME ZONE) - NEW (if not already present)

## Troubleshooting

If you get an error about a policy already existing:
- The migration is now fixed to handle this
- It uses `DROP POLICY IF EXISTS` before creating policies
- Re-run the migration - it should work now

## Next Steps After Migration

1. ✅ Migration complete
2. ✅ Abuse protection is now active
3. ✅ OCR duplicate detection enabled
4. ✅ Reminder limits enforced
5. ✅ Rate limiting active

