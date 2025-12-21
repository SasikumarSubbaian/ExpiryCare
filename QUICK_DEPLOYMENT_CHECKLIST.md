# Quick Deployment Checklist

Use this checklist during your actual deployment process.

## Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] All environment variables documented
- [ ] Domain purchased (or using Vercel subdomain)
- [ ] Supabase project ready
- [ ] Resend account created
- [ ] All migrations run in Supabase

## Vercel Setup

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Project imported to Vercel
- [ ] Environment variables added:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `RESEND_FROM_EMAIL` (optional)
- [ ] First deployment successful
- [ ] Build logs checked (no errors)

## Domain Configuration

- [ ] Domain added in Vercel dashboard
- [ ] DNS records added at registrar:
  - [ ] A record for root domain
  - [ ] CNAME record for www
- [ ] DNS propagation verified
- [ ] SSL certificate active
- [ ] Site accessible on custom domain

## Cron Job Verification

- [ ] `vercel.json` present in root
- [ ] Cron configuration correct
- [ ] Manual test: Visit `/api/reminders`
- [ ] Response received (JSON)
- [ ] Emails sent successfully
- [ ] `reminder_logs` table updated
- [ ] Cron scheduled in Vercel (check next day)

## Production Testing

- [ ] Landing page loads
- [ ] Sign up works
- [ ] Login works
- [ ] Add item works
- [ ] Edit item works
- [ ] Delete item works
- [ ] File upload works
- [ ] Reminder email received
- [ ] Mobile responsive
- [ ] No console errors

## Post-Deployment

- [ ] Monitoring setup (Vercel Analytics)
- [ ] Error tracking (optional: Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Social media accounts created
- [ ] Launch announcement posted
- [ ] Product Hunt submission (if applicable)

## Revenue Setup (When Ready)

- [ ] Payment gateway account (Razorpay/Stripe)
- [ ] Pricing page created
- [ ] Payment API routes implemented
- [ ] Subscription tracking in database
- [ ] Upgrade flow tested

---

**Quick Reference:**
- Full Guide: See `DEPLOYMENT_GUIDE.md`
- Environment Variables: See `LAUNCH_CHECKLIST.md`
- Troubleshooting: See `DEPLOYMENT_GUIDE.md` → Troubleshooting section

