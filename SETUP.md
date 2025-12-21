# ExpiryCare Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **Settings** → **API** and copy:
   - Project URL
   - `anon` public key

## Step 3: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run it in the SQL Editor
4. This will create the `expiries` table with proper RLS policies

## Step 4: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Set up Automated Reminders (Optional)

The app includes a reminders API endpoint at `/api/reminders` that checks for expiries needing reminders.

### Option A: Vercel Cron (Recommended if deploying to Vercel)

The `vercel.json` file is already configured. Just deploy to Vercel and the cron job will run daily at 9 AM UTC.

### Option B: External Cron Service

1. Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com)
2. Set up a daily cron job that calls: `https://your-domain.com/api/reminders`
3. Schedule it to run once per day (e.g., 9 AM)

### Option C: Add Email Notifications

To actually send email reminders:

1. Choose an email service (Resend, SendGrid, AWS SES, etc.)
2. Add the service's SDK to `package.json`
3. Modify `app/api/reminders/route.ts` to send emails after fetching reminders
4. You'll need user email addresses from Supabase Auth

Example with Resend:
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

// In the reminders loop:
await resend.emails.send({
  from: 'reminders@expirycare.app',
  to: userEmail,
  subject: `Reminder: ${expiry.name} expires soon`,
  html: `Your ${expiry.name} expires in ${daysUntil} days.`
})
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The cron job will automatically be set up from `vercel.json`.

### Deploy to Other Platforms

- Ensure environment variables are set
- The app will work on any platform that supports Next.js
- Set up the reminders cron job separately if not using Vercel

## Features

✅ User authentication (sign up, sign in, sign out)
✅ Add, edit, and delete expiries
✅ Four categories: Warranty, Insurance, Medicine, Subscription
✅ Custom reminder days before expiry
✅ Filter by category
✅ Visual status indicators (expired, urgent, soon, upcoming)
✅ Mobile-first responsive design
✅ Reminder API endpoint for automated notifications

## Support

For issues or questions, check the code comments or Supabase/Next.js documentation.

