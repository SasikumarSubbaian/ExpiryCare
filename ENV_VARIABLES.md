# Environment Variables Guide

Complete guide to all environment variables required for ExpiryCare.

## Required Variables

### 1. Supabase Configuration

**`NEXT_PUBLIC_SUPABASE_URL`**
- **Required:** Yes
- **Type:** Public (exposed to browser)
- **Description:** Your Supabase project URL
- **Example:** `https://abcdefghijklmnop.supabase.co`
- **Where to get:** Supabase Dashboard → Settings → API → Project URL
- **Used in:** Client-side and server-side Supabase connections

**`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
- **Required:** Yes
- **Type:** Public (exposed to browser)
- **Description:** Supabase anonymous/public key (safe to expose)
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to get:** Supabase Dashboard → Settings → API → `anon` `public` key
- **Used in:** Client-side and server-side Supabase connections
- **Security:** This is safe to expose - RLS policies protect your data

**`SUPABASE_SERVICE_ROLE_KEY`**
- **Required:** Yes (for reminder system)
- **Type:** Secret (server-side only)
- **Description:** Supabase service role key (bypasses RLS - keep secret!)
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to get:** Supabase Dashboard → Settings → API → `service_role` `secret` key
- **Used in:** `/app/api/reminders/route.ts` only
- **Security:** ⚠️ **NEVER expose this key** - it bypasses all RLS policies
- **Why needed:** Reminder system needs to check all users' items

### 2. Email Service (Resend)

**`RESEND_API_KEY`**
- **Required:** Yes (for reminder emails)
- **Type:** Secret (server-side only)
- **Description:** Resend API key for sending emails
- **Example:** `re_1234567890abcdefghijklmnop`
- **Where to get:** 
  1. Sign up at https://resend.com
  2. Go to API Keys section
  3. Create new API key
  4. Copy the key (starts with `re_`)
- **Used in:** `lib/email/sender.ts`
- **Free tier:** 3,000 emails/month free

**`RESEND_FROM_EMAIL`**
- **Required:** No (optional)
- **Type:** Public
- **Description:** Email address to send reminders from
- **Example:** `ExpiryCare <reminders@yourdomain.com>`
- **Default:** `ExpiryCare <onboarding@resend.dev>` (if not set)
- **Where to set:** 
  - For custom domain: Verify domain in Resend dashboard first
  - For testing: Use default `onboarding@resend.dev`
- **Used in:** `lib/email/sender.ts`

## Setup Instructions

### Local Development

1. Create `.env.local` file in project root:
```bash
# Copy from example (if exists) or create new
cp .env.local.example .env.local
```

2. Add all required variables:
```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role (Required for reminders)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Resend (Required for reminders)
RESEND_API_KEY=re_your-resend-api-key-here
RESEND_FROM_EMAIL=ExpiryCare <reminders@yourdomain.com>
```

3. Restart development server:
```bash
npm run dev
```

### Production (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add each variable:
   - **Key:** Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value:** Variable value
   - **Environment:** Production (and Preview if needed)

3. Variables to add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` (optional)

4. Redeploy after adding variables

### Production (Other Platforms)

Follow platform-specific instructions for environment variables:
- **Netlify:** Site settings → Environment variables
- **Railway:** Project → Variables
- **Render:** Environment → Environment Variables
- **AWS/Docker:** Use platform's secret management

## Verification

### Check if variables are set:

**Local:**
```bash
# Check .env.local exists and has values
cat .env.local
```

**Production:**
- Vercel: Dashboard → Project → Settings → Environment Variables
- Check application logs for missing variable errors

### Test in code:

```typescript
// This will throw if not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
```

## Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore` ✅
2. **Use different keys for dev/prod** - Create separate Supabase projects if needed
3. **Rotate keys regularly** - Especially service role key
4. **Limit service role key usage** - Only in server-side API routes
5. **Monitor API usage** - Check Resend and Supabase dashboards

📖 **For detailed implementation steps, see [SECURITY_BEST_PRACTICES.md](./SECURITY_BEST_PRACTICES.md)**

## Troubleshooting

### "NEXT_PUBLIC_SUPABASE_URL is not defined"
- Check `.env.local` exists in project root
- Verify variable name is exact (case-sensitive)
- Restart dev server after adding variables

### "SUPABASE_SERVICE_ROLE_KEY is not configured"
- Add to `.env.local` for local development
- Add to production environment variables
- Verify key is correct (starts with `eyJ`)

### "RESEND_API_KEY is not configured"
- Sign up for Resend account
- Create API key in Resend dashboard
- Add to environment variables
- Restart server

### Emails not sending
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for errors
- Verify email domain (if using custom domain)
- Check spam folder
- Verify `RESEND_FROM_EMAIL` format is correct

## Variable Reference Table

| Variable | Required | Type | Used In | Security |
|----------|----------|------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public | All | Safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public | All | Safe (RLS protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Secret | API only | ⚠️ Keep secret |
| `RESEND_API_KEY` | Yes* | Secret | Email service | ⚠️ Keep secret |
| `RESEND_FROM_EMAIL` | No | Public | Email service | Safe |

*Required for reminder system to work

---

**Last Updated:** Launch preparation

