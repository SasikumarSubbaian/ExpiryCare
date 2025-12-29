# Abuse Protection Implementation

## Overview

Comprehensive abuse protection system for ExpiryCare OCR-based SaaS, including rate limiting, file validation, duplicate detection, reminder limits, and data sanitization.

## Features Implemented

### 1. OCR Limits ✅
- **FREE Plan**: Max 5 OCR calls total
- **PRO Plan**: Max 10 OCR/day, 200 OCR/month
- Enforced in `app/api/ocr/route.ts`

### 2. File Validation ✅
- **Max file size**: 10MB
- **Max image dimension**: 4000px (width or height)
- **Max PDF pages**: 5 pages
- Implemented in `lib/abuse/fileValidation.ts`
- Graceful degradation if `sharp` or `pdf-lib` not available

### 3. Duplicate Detection ✅
- SHA-256 hash generation for uploaded files
- Cached OCR results in `ocr_cache` table
- Reuses stored OCR result if hash exists
- Implemented in `lib/abuse/duplicateDetection.ts`

### 4. Rate Limiting ✅
- **OCR API**: 5 requests/min/user
- **Upload API**: 10 requests/min/IP (ready for implementation)
- In-memory rate limiting (use Redis in production)
- Implemented in `lib/abuse/rateLimiting.ts`

### 5. Data Sanitization ✅
- Strips PII (Aadhaar, PAN, phone numbers, emails, addresses)
- Only allows fields based on category schema
- Validates against forbidden patterns
- Implemented in `lib/abuse/dataSanitization.ts`

### 6. Reminder Limits ✅
- **Max reminders per item**: 3
- **Email reminders**: Max 5/day per user
- **WhatsApp reminders (PRO)**: Max 30/month per user
- Implemented in `lib/abuse/reminderLimits.ts`
- Enforced in `app/api/reminders/route.ts`

### 7. User-Friendly Error Messages ✅
- All error messages are non-technical
- Clear, actionable messages for users
- No internal details exposed

## Database Migration

Run the migration to create required tables:

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/010_abuse_protection.sql
```

This creates:
- `ocr_cache` table for duplicate detection
- `reminder_logs` table for reminder tracking
- Proper indexes and RLS policies

## Installation

1. **Install dependencies:**
```bash
npm install pdf-lib
```

2. **Run database migration:**
   - Copy `supabase/migrations/010_abuse_protection.sql`
   - Run in Supabase SQL Editor

3. **Optional dependencies (for full validation):**
```bash
npm install sharp pdf-lib
```
Note: If not installed, validation will be more lenient (graceful degradation)

## Usage

### OCR API Protection

The OCR API (`/api/ocr`) now includes:
- Authentication check
- Rate limiting (5/min/user)
- Plan-based OCR limits
- File validation (size, dimensions, PDF pages)
- Duplicate detection (SHA-256 hashing)
- User-friendly error messages

### Reminder Limits

The reminders API (`/api/reminders`) now includes:
- Item reminder limit (max 3 per item)
- Daily email limit (max 5 per user)
- Monthly WhatsApp limit (max 30 per PRO user)
- Automatic logging to `reminder_logs` table

### Data Sanitization

Use in extraction pipeline:
```typescript
import { sanitizeExtractedData, validateNoForbiddenData } from '@/lib/abuse/dataSanitization'

// Sanitize extracted data
const sanitized = sanitizeExtractedData(extractedData, category)

// Validate no forbidden data
const validation = validateNoForbiddenData(sanitized, category)
```

## Production Considerations

1. **Rate Limiting**: Current implementation uses in-memory store. For production, use Redis:
   - Install `@upstash/redis` or similar
   - Update `lib/abuse/rateLimiting.ts` to use Redis

2. **OCR Cache Cleanup**: Set up a cron job to clean old cache entries:
   ```sql
   DELETE FROM ocr_cache WHERE created_at < NOW() - INTERVAL '90 days';
   ```

3. **Monitoring**: Add logging/monitoring for:
   - Rate limit violations
   - File validation failures
   - Reminder limit hits

## Error Messages

All error messages are user-friendly:
- ❌ "Too many requests. Please wait X seconds before trying again."
- ❌ "File size exceeds the maximum allowed size of 10MB."
- ❌ "Image is too large. Maximum size is 4000px."
- ❌ "PDF has too many pages. Maximum allowed is 5 pages."
- ❌ "Daily email reminder limit reached. Please try again tomorrow."
- ❌ "You've used all free scans. Upgrade to Pro for unlimited document uploads & WhatsApp reminders"

## Files Created

- `lib/abuse/fileValidation.ts` - File validation utilities
- `lib/abuse/duplicateDetection.ts` - SHA-256 hashing and caching
- `lib/abuse/rateLimiting.ts` - Rate limiting middleware
- `lib/abuse/reminderLimits.ts` - Reminder limit enforcement
- `lib/abuse/dataSanitization.ts` - PII stripping and validation
- `supabase/migrations/010_abuse_protection.sql` - Database schema

## Files Updated

- `app/api/ocr/route.ts` - Added comprehensive abuse protection
- `app/api/reminders/route.ts` - Added reminder limits
- `package.json` - Added `pdf-lib` dependency

## Testing

1. **Test rate limiting:**
   - Make 6 OCR requests in 1 minute → Should get rate limit error

2. **Test file validation:**
   - Upload file > 10MB → Should get size error
   - Upload image > 4000px → Should get dimension error
   - Upload PDF > 5 pages → Should get page count error

3. **Test duplicate detection:**
   - Upload same file twice → Second request should return cached result

4. **Test reminder limits:**
   - Send 6 emails in one day → 6th should be blocked
   - Send 4 reminders for same item → 4th should be blocked

## Security Notes

- All PII is stripped before storage
- Rate limiting prevents brute force attacks
- File validation prevents resource exhaustion
- Duplicate detection reduces unnecessary API calls
- Reminder limits prevent spam

