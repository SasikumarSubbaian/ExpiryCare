# Environment Setup - Quick Start

Quick reference guide for setting up dev and prod environments.

## 🚀 Quick Setup (5 Minutes)

### 1. Create Supabase Projects

**Development:**
- Create project: `expirycare-dev`
- Run all migrations
- Copy URL and keys

**Production:**
- Create project: `expirycare-prod`
- Run all migrations
- Copy URL and keys

### 2. Set Up Local Development

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
RESEND_API_KEY=re_your-dev-key
RESEND_FROM_EMAIL=ExpiryCare <onboarding@resend.dev>
```

### 3. Set Up Vercel Production

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables for **Production** environment
3. Use production Supabase project keys
4. Use production Resend API key

### 4. Test

**Local:**
```bash
npm run dev
# Visit http://localhost:3000
```

**Production:**
- Deploy to Vercel
- Test production URL

## 📋 Environment Variables Checklist

### Development (.env.local)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (dev project)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (dev project)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (dev project)
- [ ] `RESEND_API_KEY` (dev/test key)
- [ ] `RESEND_FROM_EMAIL` (optional)

### Production (Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` (prod project)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (prod project)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (prod project)
- [ ] `RESEND_API_KEY` (prod key)
- [ ] `RESEND_FROM_EMAIL` (custom domain)

## 🔄 Development Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop locally:**
   - Use `.env.local` (dev keys)
   - Test in dev environment
   - Create test data in dev database

3. **Test in preview:**
   - Push to GitHub
   - Vercel creates preview
   - Test preview URL

4. **Deploy to production:**
   - Merge to main
   - Vercel deploys to production
   - Run migrations in prod if needed

## 🗄️ Database Migrations

1. **Test in dev first:**
   - Run migration in dev Supabase
   - Test application
   - Fix any issues

2. **Deploy to prod:**
   - Run migration in prod Supabase
   - Verify no errors
   - Monitor application

## 🛠️ Using Environment Config

```typescript
import { envConfig, featureFlags } from '@/lib/config/env'

// Check environment
if (envConfig.isDevelopment) {
  console.log('Debug:', data)
}

// Use feature flags
if (featureFlags.enableBetaFeatures()) {
  // Beta feature code
}
```

## 📚 Full Documentation

- **Complete Setup:** [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **Feature Workflow:** [FEATURE_DEVELOPMENT_WORKFLOW.md](./FEATURE_DEVELOPMENT_WORKFLOW.md)
- **Environment Variables:** [ENV_VARIABLES.md](./ENV_VARIABLES.md)

## ⚠️ Common Issues

**"Environment variable not found"**
- Check `.env.local` exists
- Restart dev server
- Verify variable name (case-sensitive)

**"Wrong database"**
- Check `NEXT_PUBLIC_SUPABASE_URL` matches intended project
- Clear browser cache

**"Migration failed"**
- Always test in dev first
- Check Supabase logs
- Verify RLS policies

---

**Need help?** See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed guide.

