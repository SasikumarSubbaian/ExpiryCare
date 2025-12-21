# Reminder Email System

This API endpoint handles the daily reminder email system for ExpiryCare.

## Setup

### 1. Environment Variables

Add these to your `.env.local` (and production environment):

```env
# Supabase Service Role Key (for bypassing RLS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Resend API Key
RESEND_API_KEY=re_your_resend_api_key_here

# Resend From Email (optional, defaults to reminders@expirycare.app)
RESEND_FROM_EMAIL=ExpiryCare <reminders@yourdomain.com>
```

**Getting the keys:**
- **Supabase Service Role Key**: Supabase Dashboard → Settings → API → `service_role` key (keep secret!)
- **Resend API Key**: https://resend.com/api-keys → Create API Key

### 2. Database Migration

Run the migration to create the reminder tracking table:

```sql
-- Run supabase/migrations/005_reminder_tracking.sql in Supabase SQL Editor
```

### 3. Install Dependencies

```bash
npm install resend
```

### 4. Configure Cron Job

#### Option A: Vercel Cron (Recommended)

The `vercel.json` is already configured. Just deploy to Vercel and the cron job will run daily at 9 AM UTC.

#### Option B: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- GitHub Actions (scheduled workflows)

Point them to: `https://your-domain.com/api/reminders`

## How It Works

1. **Daily Execution**: Cron job runs once per day (9 AM UTC)
2. **Item Check**: Fetches all life_items that need reminders
3. **Reminder Logic**: 
   - Checks `reminder_days` array for each item
   - Sends reminder when `daysUntil == reminderDay`
   - For `reminderDay = 0`, sends on expiry day
4. **Duplicate Prevention**: Tracks sent reminders in `reminder_logs` table
5. **Email Sending**: Sends friendly HTML emails via Resend
6. **Logging**: Records all sent reminders to prevent duplicates

## Email Templates

Emails are sent with:
- Friendly, simple design
- Color-coded urgency (red for expired/urgent, yellow for soon, blue for normal)
- Clear item information
- Indian date format
- Person name for medicine items

## Testing

### Manual Test

```bash
# Test the endpoint
curl -X POST https://your-domain.com/api/reminders
```

Or visit: `https://your-domain.com/api/reminders` in browser (GET request)

### Local Testing

1. Set up environment variables
2. Run: `npm run dev`
3. Visit: `http://localhost:3000/api/reminders`

## Troubleshooting

### Emails not sending
- Check `RESEND_API_KEY` is set correctly
- Verify Resend account is active
- Check email domain is verified in Resend (for custom domains)

### Duplicate reminders
- Check `reminder_logs` table is created
- Verify unique constraint is working
- Check timezone settings

### Service role key errors
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify the key has correct permissions
- Check Supabase project settings
