# Environment Setup Guide - Dev & Prod

Complete guide for setting up separate development and production environments for ExpiryCare.

## 📋 Overview

This guide helps you:
- Set up isolated development and production environments
- Manage environment-specific configurations
- Safely develop and test new features
- Deploy to production with confidence

## 🏗️ Architecture

### Environment Structure

```
Development Environment:
├── Local Development (your machine)
│   ├── .env.local (or .env.development.local)
│   ├── Supabase Dev Project
│   └── Resend Test API Key
│
└── Preview/Staging (Vercel Preview)
    ├── Vercel Preview Environment Variables
    ├── Supabase Dev Project (shared)
    └── Resend Test API Key

Production Environment:
├── Production Deployment (Vercel Production)
│   ├── Vercel Production Environment Variables
│   ├── Supabase Production Project
│   └── Resend Production API Key
│
└── Production Database
    └── Supabase Production Project
```

## 🚀 Step 1: Create Supabase Projects

### Development Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Name it: `expirycare-dev` (or similar)
4. Choose a region close to you
5. Set a database password (save it securely)
6. Wait for project to be provisioned

### Production Project

1. Create another project: `expirycare-prod`
2. Use a region close to your users (e.g., Mumbai for Indian users)
3. Set a strong database password
4. Wait for project to be provisioned

**Why separate projects?**
- Isolated data (dev won't affect prod)
- Different configurations
- Safe testing of migrations
- Independent scaling

## 📝 Step 2: Set Up Database Migrations

### Development Database

1. Go to your **dev** Supabase project
2. Navigate to **SQL Editor**
3. Run all migrations in order:
   - `001_initial_schema.sql`
   - `002_core_schema.sql`
   - `003_update_categories.sql`
   - `004_storage_setup.sql`
   - `005_reminder_tracking.sql`
   - `006_family_sharing.sql`
   - `007_pricing_plans.sql`

### Production Database

1. Go to your **prod** Supabase project
2. Run the same migrations in the same order
3. **Important:** Test migrations in dev first!

## 🔑 Step 3: Configure Environment Variables

### Local Development (.env.local)

Create `.env.local` in your project root:

```env
# Environment
NODE_ENV=development

# Supabase Development
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# Resend Development (Test Mode)
RESEND_API_KEY=re_your-dev-resend-key
RESEND_FROM_EMAIL=ExpiryCare <onboarding@resend.dev>

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_BETA_FEATURES=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true
```

**Where to get keys:**
- Supabase: Dashboard → Settings → API
- Resend: Dashboard → API Keys → Create new key

### Production Environment (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables for **Production** environment:

```env
# Environment
NODE_ENV=production

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# Resend Production
RESEND_API_KEY=re_your-prod-resend-key
RESEND_FROM_EMAIL=ExpiryCare <reminders@yourdomain.com>

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
```

3. Also add to **Preview** environment (for testing before production)

## 📁 Step 4: Create Environment Files

### Create Example Files

We'll create example files you can reference:

- `.env.development.example` - Template for development
- `.env.production.example` - Template for production

These files are safe to commit (no real keys).

## 🔧 Step 5: Update Configuration

### Next.js Environment Loading

Next.js automatically loads environment files in this order:
1. `.env.local` (always loaded, ignored by git)
2. `.env.development` or `.env.production` (based on NODE_ENV)
3. `.env` (default)

**Best Practice:** Use `.env.local` for local development.

### Vercel Environment Variables

Vercel supports three environments:
- **Production:** Live site
- **Preview:** Pull requests and branches
- **Development:** Local development (not commonly used)

## 🧪 Step 6: Testing Your Setup

### Test Development Environment

1. Start dev server:
```bash
npm run dev
```

2. Verify environment:
   - Visit `http://localhost:3000`
   - Check browser console for errors
   - Try signing up (creates user in dev database)

3. Check Supabase:
   - Go to dev project → Authentication → Users
   - Verify test user was created

### Test Production Environment

1. Deploy to Vercel:
```bash
# If using Vercel CLI
vercel --prod
```

2. Verify:
   - Visit production URL
   - Check Vercel logs for errors
   - Test signup (creates user in prod database)

## 🔄 Step 7: Workflow for Feature Development

### Development Workflow

1. **Create Feature Branch:**
```bash
git checkout -b feature/new-feature
```

2. **Develop Locally:**
   - Use `.env.local` with dev Supabase project
   - Test thoroughly in dev environment
   - Create test data in dev database

3. **Test in Preview:**
   - Push branch to GitHub
   - Vercel creates preview deployment
   - Test preview URL (uses dev environment variables)

4. **Merge to Main:**
   - Create pull request
   - Review and merge
   - Vercel deploys to production

### Database Migration Workflow

1. **Create Migration:**
```bash
# Create new migration file
supabase/migrations/008_new_feature.sql
```

2. **Test in Dev:**
   - Run migration in dev Supabase project
   - Test application with new schema
   - Fix any issues

3. **Deploy to Prod:**
   - Run migration in prod Supabase project
   - Verify no errors
   - Monitor application

## 🛡️ Security Best Practices

### Environment Variables

1. **Never commit secrets:**
   - ✅ `.env.local` is in `.gitignore`
   - ✅ Use `.env.example` files (no real keys)

2. **Use different keys:**
   - Dev and prod should have separate Supabase projects
   - Use different Resend API keys

3. **Rotate keys regularly:**
   - Especially service role keys
   - Update in both local and Vercel

4. **Limit access:**
   - Only team members who need access
   - Use Vercel team permissions

### Database Security

1. **RLS Policies:**
   - Test RLS in dev first
   - Verify policies work before deploying

2. **Backups:**
   - Enable automatic backups in Supabase
   - Test restore process

3. **Monitoring:**
   - Set up alerts in Supabase
   - Monitor error logs

## 📊 Environment Comparison

| Aspect | Development | Production |
|--------|------------|------------|
| **Supabase Project** | Separate dev project | Separate prod project |
| **Database** | Test data, can reset | Real user data |
| **Resend API** | Test mode (limited) | Production mode |
| **Email Domain** | `onboarding@resend.dev` | Custom domain |
| **Feature Flags** | Beta features enabled | Only stable features |
| **Debug Mode** | Enabled | Disabled |
| **Cron Jobs** | Manual testing | Automated (Vercel Cron) |
| **Error Tracking** | Console logs | Production error tracking |

## 🐛 Troubleshooting

### "Environment variable not found"

**Local:**
- Check `.env.local` exists
- Verify variable name (case-sensitive)
- Restart dev server

**Production:**
- Check Vercel environment variables
- Verify environment (Production vs Preview)
- Redeploy after adding variables

### "Wrong database being used"

- Check `NEXT_PUBLIC_SUPABASE_URL` matches intended project
- Verify you're using correct `.env.local` file
- Clear browser cache and cookies

### "Migration failed in production"

- Always test migrations in dev first
- Check Supabase logs for errors
- Verify RLS policies are correct
- Have rollback plan ready

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Multiple Projects](https://supabase.com/docs/guides/getting-started/local-development#multiple-projects)

## ✅ Checklist

### Development Setup
- [ ] Dev Supabase project created
- [ ] Dev database migrations run
- [ ] `.env.local` configured with dev keys
- [ ] Dev server runs without errors
- [ ] Can create test users in dev

### Production Setup
- [ ] Prod Supabase project created
- [ ] Prod database migrations run
- [ ] Vercel production environment variables set
- [ ] Production deployment successful
- [ ] Production site works correctly

### Workflow
- [ ] Feature branch workflow understood
- [ ] Preview deployments working
- [ ] Migration process documented
- [ ] Team members have access

---

**Last Updated:** Environment setup guide
**Status:** Ready for use ✅

