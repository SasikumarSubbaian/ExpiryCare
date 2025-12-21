# ExpiryCare

ExpiryCare helps Indian individuals and families track important expiries (warranty, insurance, medicine, subscriptions) and get reminders before they forget.

## Tech Stack

- Next.js 14 (App Router)
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- TypeScript
- Resend (Email reminders)

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**
   - Create a new Supabase project
   - Run database migrations (see `supabase/migrations/`)
   - Get your Supabase URL and keys

3. **Configure environment variables:**
   - See `ENV_VARIABLES.md` for complete guide
   - Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - For reminders: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`

4. **Run development server:**
```bash
npm run dev
```

## Documentation

### Setup & Configuration
- **Quick Start:** `ENVIRONMENT_QUICK_START.md` - Quick 5-minute setup guide
- **Environment Setup:** `ENVIRONMENT_SETUP.md` - Complete dev/prod environment guide
- **Feature Workflow:** `FEATURE_DEVELOPMENT_WORKFLOW.md` - How to develop features safely
- **Setup Guide:** `SETUP.md` - Complete setup instructions
- **Environment Variables:** `ENV_VARIABLES.md` - All required env vars

### Launch & Testing
- **Launch Checklist:** `LAUNCH_CHECKLIST.md` - Pre-launch verification
- **Reminder Testing:** `REMINDER_TESTING.md` - Test email reminders
- **Mobile Responsiveness:** `MOBILE_RESPONSIVENESS.md` - Responsive design verification
- **Auth Verification:** `AUTH_VERIFICATION.md` - Route protection status

## Features

- ✅ User authentication (sign up, sign in, sign out)
- ✅ Track expiries by category (warranty, insurance, AMC, medicine, subscription, other)
- ✅ Set custom reminder days before expiry
- ✅ Medicine tracking with person assignment (Self, Dad, Mom, Custom)
- ✅ Document uploads (images/PDFs)
- ✅ Family sharing (view-only access)
- ✅ Email reminders (daily cron job)
- ✅ Pricing plans (Free, Pro, Family)
- ✅ Mobile-first responsive design
- ✅ Calm, reassuring UX

## Launch Readiness

See `LAUNCH_CHECKLIST.md` for complete pre-launch verification checklist.

**Status:** ✅ Ready for launch
