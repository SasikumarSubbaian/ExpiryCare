# ExpiryCare Launch Checklist

This checklist ensures your MVP is ready for production launch.

## ✅ Pre-Launch Checklist

### 1. Environment Variables

**Required for Basic Functionality:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key

**Required for Email Reminders:**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for reminder API)
- [ ] `RESEND_API_KEY` - Resend API key for sending emails
- [ ] `RESEND_FROM_EMAIL` - Email address for sending reminders (optional, defaults to Resend onboarding email)

**Where to get these:**
- Supabase keys: Dashboard → Settings → API
- Resend API key: https://resend.com/api-keys
- See `ENV_VARIABLES.md` for detailed setup

### 2. Database Setup

- [ ] All migrations run successfully in Supabase SQL Editor:
  - [ ] `001_initial_schema.sql` (if exists)
  - [ ] `002_core_schema.sql` - Core tables (profiles, life_items, family_members)
  - [ ] `003_update_categories.sql` - Category updates
  - [ ] `004_storage_setup.sql` - Storage bucket setup
  - [ ] `005_reminder_tracking.sql` - Reminder logs table
  - [ ] `006_family_sharing.sql` - Family sharing RLS policies
  - [ ] `007_pricing_plans.sql` - User plans table

- [ ] Storage bucket created:
  - [ ] Bucket name: `documents`
  - [ ] Public access: Disabled
  - [ ] RLS policies applied

- [ ] Verify RLS policies are active:
  - [ ] `profiles` table - users can read/update own profile
  - [ ] `life_items` table - users can CRUD own items, view shared items
  - [ ] `family_members` table - users can manage own family members
  - [ ] `user_plans` table - users can read own plan
  - [ ] `reminder_logs` table - service role only
  - [ ] **See `RLS_POLICIES_GUIDE.md` for detailed verification steps**

### 3. Authentication Protection

**Verified Routes:**
- [ ] `/dashboard` - Redirects to `/login` if not authenticated ✅
- [ ] `/upgrade` - Redirects to `/login` if not authenticated ✅
- [ ] `/login` - Redirects to `/dashboard` if already authenticated ✅
- [ ] `/signup` - Redirects to `/dashboard` if already authenticated ✅
- [ ] `/` (landing) - Accessible to all, redirects authenticated users to dashboard ✅

**Middleware Protection:**
- [ ] `middleware.ts` properly configured ✅
- [ ] Protected routes list includes `/dashboard` ✅
- [ ] Auth routes redirect logic working ✅

### 4. Reminder System

**Setup:**
- [ ] Resend account created and verified
- [ ] Resend API key added to environment variables
- [ ] Email domain verified (if using custom domain)
- [ ] `reminder_logs` table created and has unique constraint

**Testing:**
- [ ] Manual test: Visit `/api/reminders` endpoint
- [ ] Create test item with expiry date tomorrow
- [ ] Set reminder days to `[1]` (1 day before)
- [ ] Run reminder endpoint manually (see instructions below)
- [ ] Verify email received
- [ ] Check `reminder_logs` table for entry
- [ ] Verify no duplicate reminders sent

**How to Run Reminder Endpoint Manually:**

**Local Development:**
1. Start your dev server: `npm run dev`
2. Open browser or use curl:
   - **Browser:** Visit `http://localhost:3000/api/reminders`
   - **Terminal:** `curl http://localhost:3000/api/reminders`
3. Check the response - should return JSON with `success: true` and `remindersSent` count

**Production:**
1. Use curl or browser:
   - **Browser:** Visit `https://your-domain.com/api/reminders`
   - **Terminal:** `curl https://your-domain.com/api/reminders`
2. Check the response and verify emails were sent

**Expected Response:**
```json
{
  "success": true,
  "remindersSent": 1,
  "message": "Reminder check completed"
}
```

**Troubleshooting:**
- If you get an error, check:
  - Environment variables are set (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`)
  - Items exist with appropriate expiry dates and reminder days
  - Resend account is active and verified
- **Not receiving emails?** See `REMINDER_DEBUGGING.md` for detailed debugging steps
- **Resend testing restriction?** See `RESEND_EMAIL_FIX.md` - Resend only allows sending to your own email in test mode. Verify a domain for production.

**Cron Job:**
- [ ] Vercel cron configured (if deploying to Vercel) ✅
- [ ] External cron service configured (if not using Vercel)
- [ ] Cron schedule: Daily at 9 AM UTC
- [ ] Endpoint URL: `https://your-domain.com/api/reminders`

See `REMINDER_TESTING.md` for detailed testing guide.

### 5. Mobile Responsiveness

**Test on Real Devices or Browser DevTools:**
- [ ] iPhone SE (375px) - Smallest common mobile
- [ ] iPhone 12/13 (390px) - Standard mobile
- [ ] iPad (768px) - Tablet
- [ ] Desktop (1920px) - Large screen

**Key Pages to Test:**
- [ ] Landing page (`/`) - Hero, sections, pricing cards
- [ ] Login page (`/login`) - Form, buttons, error messages
- [ ] Signup page (`/signup`) - Form, buttons, error messages
- [ ] Dashboard (`/dashboard`) - Header, items list, modals
- [ ] Add Item Modal - Form fields, file upload, buttons
- [ ] Family Members Section - Invite form, member list
- [ ] Upgrade page (`/upgrade`) - Pricing cards

**Responsive Elements:**
- [ ] Text sizes scale appropriately
- [ ] Buttons are easily tappable (min 44x44px)
- [ ] Forms are readable and usable
- [ ] Modals work on mobile (scrollable, closeable)
- [ ] Navigation menu works on mobile
- [ ] No horizontal scrolling

### 6. Error Handling

**Test Error Scenarios:**
- [ ] Network errors - Show helpful messages
- [ ] Invalid login credentials - Clear error message
- [ ] Duplicate email signup - Helpful error
- [ ] Plan limit reached - Clear upgrade prompt
- [ ] File upload errors - Helpful error message
- [ ] Missing required fields - Validation messages

**User Experience:**
- [ ] All errors show calm, helpful messages ✅
- [ ] Loading states visible during async operations ✅
- [ ] Success confirmations via toasts ✅
- [ ] Empty states are friendly and helpful ✅

### 7. Security

- [ ] `.env.local` is in `.gitignore` ✅
- [ ] No API keys committed to repository
- [ ] RLS policies prevent unauthorized access
- [ ] Service role key only used in server-side API route
- [ ] File uploads restricted to images and PDFs
- [ ] File size limits enforced (10MB max)
- [ ] User can only access own data (verified by RLS)

### 8. Performance

- [ ] Page load times acceptable (< 3s on 3G)
- [ ] Images optimized
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No linting errors

### 9. Content & Copy

- [ ] All placeholder text replaced
- [ ] Product name "ExpiryCare" used consistently
- [ ] Landing page copy is clear and compelling
- [ ] Error messages are user-friendly
- [ ] Empty states have helpful copy

### 10. Deployment

**Vercel (Recommended):**
- [ ] Project connected to GitHub
- [ ] Environment variables added in Vercel dashboard
- [ ] Build successful
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Cron job verified in Vercel dashboard

**Other Platforms:**
- [ ] Environment variables configured
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`
- [ ] Node version: 18+
- [ ] External cron job configured for reminders

### 11. Post-Launch Monitoring

- [ ] Error tracking set up (optional: Sentry, LogRocket)
- [ ] Analytics set up (optional: Google Analytics, Plausible)
- [ ] Monitor reminder email delivery
- [ ] Check Supabase logs for errors
- [ ] Monitor API endpoint response times

## 🚀 Launch Day

1. **Final Checks:**
   - [ ] Run through checklist one more time
   - [ ] Test critical user flows
   - [ ] Verify reminder system works
   - [ ] Check mobile experience

2. **Deploy:**
   - [ ] Deploy to production
   - [ ] Verify all environment variables are set
   - [ ] Test production URL
   - [ ] Verify cron job is scheduled

3. **Smoke Tests:**
   - [ ] Sign up new account
   - [ ] Add test item
   - [ ] Test reminder email
   - [ ] Verify mobile experience
   - [ ] Test family sharing (if applicable)

4. **Monitor:**
   - [ ] Watch for errors in first hour
   - [ ] Check email delivery
   - [ ] Monitor user signups
   - [ ] Verify reminder cron runs successfully

## 📝 Notes

- Keep this checklist updated as you add features
- Document any platform-specific requirements
- Save production environment variable values securely
- Keep backup of database migrations

---

**Last Updated:** Launch preparation
**Status:** Ready for launch ✅

