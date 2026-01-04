# Email Validation & OTP Verification Implementation

## Overview
Complete email validation and OTP-based email verification system for ExpiryCare MVP. This ensures only valid emails are accepted and users must verify their email before accessing the application.

## ✅ Implementation Complete

### 1. Frontend Email Validation
**File:** `lib/utils/emailValidation.ts`

- ✅ Strict email regex validation
- ✅ Real-time error messages below input
- ✅ Disables "Create Account" button until email is valid
- ✅ Rejects invalid patterns:
  - `abc@` ❌
  - `abc@gmail` ❌
  - `abc@.com` ❌
  - `abc@gmail..com` ❌
  - Spaces ❌
  - Multiple @ symbols ❌

**Features:**
- Normalizes email (lowercase, trim)
- Checks for disposable email domains (production only)
- Validates TLD length and format
- Prevents consecutive dots

### 2. Backend Validation (MANDATORY)
**File:** `lib/utils/emailValidation.ts` (validateEmailBackend function)

- ✅ Never trusts frontend alone
- ✅ Validates email format using regex
- ✅ Normalizes email (trim, lowercase)
- ✅ Additional backend checks:
  - Email length limit (254 chars)
  - Local part length limit (64 chars)
- ✅ Rejects malformed emails

### 3. OTP Email Verification Flow

#### Signup Flow:
1. User submits name, email, password
2. **Frontend:** Validates email format in real-time
3. **Backend:** Validates email again
4. **Backend:** Creates user account with `email_verified = false`
5. **Backend:** Generates 6-digit OTP
6. **Backend:** Hashes OTP with bcrypt
7. **Backend:** Saves OTP (hashed) + expiry (10 minutes) to database
8. **Backend:** Sends OTP email via Resend
9. **Frontend:** Redirects to `/verify-email` page

#### Verify Email Flow:
1. User enters 6-digit OTP
2. **Backend:** Compares OTP (bcrypt)
3. **Backend:** Checks expiry (10 minutes)
4. **Backend:** Checks attempt limit (max 5 attempts)
5. **If valid:** Sets `email_verified = true` in profiles table
6. **If valid:** Updates `auth.users.email_confirm` (Supabase internal)
7. **Frontend:** Redirects to login with success message

#### Login Flow:
1. User enters email and password
2. **Backend:** Authenticates credentials
3. **Backend:** Checks `profiles.email_verified`
4. **If not verified:** Blocks login, redirects to verification page
5. **If verified:** Allows login, redirects to dashboard

### 4. Database Schema

**Migration:** `supabase/migrations/014_add_email_verification.sql`

#### Tables Updated:

**profiles table:**
- Added `email_verified BOOLEAN DEFAULT FALSE NOT NULL`
- Index: `idx_profiles_email_verified` (for fast queries)

**email_verifications table (NEW):**
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,        -- Bcrypt hashed OTP
  expires_at TIMESTAMP NOT NULL, -- 10 minutes from creation
  attempts INTEGER DEFAULT 0,   -- Failed verification attempts
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Indexes:**
- `idx_email_verifications_user_id` - Fast user lookups
- `idx_email_verifications_email` - Fast email lookups
- `idx_email_verifications_expires_at` - Fast expiry checks
- `idx_email_verifications_user_active` - Unique constraint (one active OTP per user)

**Security Features:**
- OTPs are hashed (bcrypt) - never stored in plain text
- Rate limiting: Max 3 OTP requests per email per hour
- Attempt limit: Max 5 verification attempts per OTP
- Auto-cleanup: Expired OTPs deleted after 1 day

### 5. Security Best Practices

✅ **OTP Hashing:** All OTPs hashed with bcrypt (salt rounds: 10)
✅ **Rate Limiting:** Max 3 OTP requests per email per hour
✅ **Attempt Limit:** Max 5 failed attempts per OTP
✅ **Email Enumeration Prevention:** Generic error messages
✅ **Brute Force Protection:** Attempt tracking and lockout
✅ **Signup Spam Prevention:** Rate limiting on OTP requests
✅ **Expiration:** OTPs expire after 10 minutes
✅ **Case Insensitive:** Email normalization (lowercase)

### 6. Email Template

**File:** `lib/email/templates.ts` (getOTPEmail function)

**Features:**
- Clean, branded HTML email
- OTP highlighted prominently (36px, bold, letter-spaced)
- Expiry warning (10 minutes)
- Security tip (never share OTP)
- Mobile-responsive design
- Plain text fallback

**Subject:** `🔐 Verify your ExpiryCare account - Your OTP is 123456`

### 7. Edge Cases Handled

✅ **OTP Expired:** Shows error, allows resend
✅ **Resend OTP:** 60-second cooldown, rate-limited
✅ **Multiple Signup Attempts:** Deletes old OTPs, creates new one
✅ **Same Email Signup Again:** Handles gracefully
✅ **Case-Sensitive Email Issues:** Normalizes to lowercase
✅ **Invalid OTP Format:** Validates 6 digits only
✅ **Max Attempts Reached:** Locks OTP, requires new code
✅ **Email Send Failure:** OTP still stored, user can request resend
✅ **OAuth Users (Google):** Auto-verified (OAuth providers verify emails)

### 8. Code Examples

#### Frontend Email Validation
```typescript
import { validateEmail } from '@/lib/utils/emailValidation'

const validation = validateEmail(email)
if (!validation.valid) {
  setEmailError(validation.error)
  setIsEmailValid(false)
} else {
  setIsEmailValid(true)
  // Email is valid, enable submit button
}
```

#### Backend API Route (Send OTP)
```typescript
// POST /api/auth/send-otp
const emailValidation = validateEmailBackend(email)
if (!emailValidation.valid) {
  return NextResponse.json({ error: emailValidation.error }, { status: 400 })
}

const otp = generateOTP()
const otpHash = await hashOTP(otp)
// Store in database, send email
```

#### OTP Verification
```typescript
// POST /api/auth/verify-otp
const isValid = await verifyOTP(otp, verification.otp_hash)
if (isValid && !isOTPExpired(expiresAt)) {
  // Mark as verified
  await updateProfile({ email_verified: true })
}
```

#### Login Check
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('email_verified')
  .eq('id', userId)
  .single()

if (!profile.email_verified) {
  // Block login, redirect to verification
  router.push('/verify-email')
}
```

## Files Created/Modified

### New Files:
1. `lib/utils/emailValidation.ts` - Email validation utilities
2. `lib/utils/otp.ts` - OTP generation and verification
3. `lib/utils/emailVerification.ts` - Email verification status helpers
4. `app/api/auth/send-otp/route.ts` - Send OTP API route
5. `app/api/auth/verify-otp/route.ts` - Verify OTP API route
6. `app/verify-email/page.tsx` - OTP verification page
7. `supabase/migrations/014_add_email_verification.sql` - Database migration

### Modified Files:
1. `app/signup/page.tsx` - Added email validation and OTP flow
2. `app/login/page.tsx` - Added email verification check
3. `components/Dashboard.tsx` - Added email verification check on load
4. `app/auth/callback/route.ts` - Auto-verify OAuth users
5. `lib/email/templates.ts` - Added OTP email template

## Database Migration Required

**⚠️ IMPORTANT:** Run this migration in Supabase SQL Editor before deploying:

```sql
-- File: supabase/migrations/014_add_email_verification.sql
-- Run this in Supabase Dashboard → SQL Editor
```

This migration:
- Adds `email_verified` column to `profiles` table
- Creates `email_verifications` table
- Adds indexes for performance
- Updates `handle_new_user()` function to set `email_verified = false`

## Environment Variables

No new environment variables required. Uses existing:
- `RESEND_API_KEY` - For sending OTP emails
- `RESEND_FROM_EMAIL` - Optional (defaults to onboarding@resend.dev)
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations (OTP management)

## User Flow

### New User Signup:
1. User enters name, email, password
2. **Real-time validation:** Email format checked as user types
3. **Submit:** Email validated again on backend
4. **Account created:** User account created with `email_verified = false`
5. **OTP sent:** 6-digit code sent to email
6. **Redirect:** User redirected to `/verify-email`
7. **Enter OTP:** User enters 6-digit code
8. **Verify:** OTP verified, `email_verified = true`
9. **Login:** User can now log in

### Existing User Login:
1. User enters email and password
2. **Auth check:** Credentials validated
3. **Verification check:** `email_verified` status checked
4. **If not verified:** Login blocked, redirect to `/verify-email`
5. **If verified:** Login allowed, redirect to `/dashboard`

### OAuth Users (Google):
1. User clicks "Sign up with Google"
2. **OAuth flow:** Google authentication
3. **Auto-verify:** Email marked as verified automatically
4. **Redirect:** Direct to dashboard (no OTP needed)

## Security Features Summary

| Feature | Implementation |
|---------|---------------|
| OTP Hashing | bcrypt (salt rounds: 10) |
| Rate Limiting | Max 3 requests/hour per email |
| Attempt Limit | Max 5 attempts per OTP |
| Expiration | 10 minutes |
| Email Validation | Frontend + Backend (double validation) |
| Disposable Emails | Blocked in production |
| Brute Force Protection | Attempt tracking + lockout |
| Email Enumeration | Generic error messages |

## Testing Checklist

- [ ] Invalid email formats rejected (abc@, abc@gmail, etc.)
- [ ] Valid email formats accepted
- [ ] OTP sent after signup
- [ ] OTP expires after 10 minutes
- [ ] Invalid OTP rejected (max 5 attempts)
- [ ] Resend OTP works (60s cooldown)
- [ ] Login blocked for unverified users
- [ ] Login allowed for verified users
- [ ] OAuth users auto-verified
- [ ] Rate limiting works (max 3/hour)
- [ ] Email normalization works (case-insensitive)

## Production Deployment

1. **Run Database Migration:**
   - Go to Supabase Dashboard → SQL Editor
   - Run `supabase/migrations/014_add_email_verification.sql`

2. **Verify Environment Variables:**
   - `RESEND_API_KEY` - Required for OTP emails
   - `SUPABASE_SERVICE_ROLE_KEY` - Required for OTP management

3. **Test Flow:**
   - Sign up with invalid email → Should be rejected
   - Sign up with valid email → Should receive OTP
   - Verify OTP → Should be able to login
   - Try login without verification → Should be blocked

## Notes

- **OAuth Users:** Google OAuth users are automatically verified (OAuth providers verify emails)
- **Existing Users:** Users created before this migration will have `email_verified = false` by default. They'll need to verify on next login.
- **Resend Cooldown:** 60 seconds between resend requests (prevents spam)
- **OTP Format:** 6-digit numeric code (100000-999999)
- **Email Service:** Uses Resend (already integrated)

## Support

For issues or questions:
- Check Supabase logs for OTP generation errors
- Check Resend dashboard for email delivery status
- Review API route logs for OTP verification errors
