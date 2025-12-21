# Environment Setup - Summary

## ✅ What Has Been Set Up

I've created a complete environment setup system for your project with separate dev and prod environments. Here's what's been added:

### 📚 Documentation Files

1. **ENVIRONMENT_SETUP.md** - Complete guide for setting up dev and prod environments
   - Step-by-step instructions
   - Supabase project setup
   - Environment variable configuration
   - Security best practices
   - Troubleshooting guide

2. **FEATURE_DEVELOPMENT_WORKFLOW.md** - Workflow for developing new features
   - Development process
   - Database migration workflow
   - Testing strategy
   - Rollback procedures
   - Feature flag usage

3. **ENVIRONMENT_QUICK_START.md** - Quick reference guide
   - 5-minute setup checklist
   - Common commands
   - Quick troubleshooting

### 🛠️ Code Files

1. **lib/config/env.ts** - Environment configuration utility
   - Centralized environment access
   - Feature flags support
   - Environment validation
   - Type-safe configuration

### 📝 Example Files

1. **.env.development.example** - Template for development environment
2. **.env.production.example** - Template for production environment

## 🚀 Next Steps

### 1. Create Supabase Projects

You need to create two separate Supabase projects:

**Development Project:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Create new project: `expirycare-dev`
- Run all migrations from `supabase/migrations/`
- Copy URL and keys

**Production Project:**
- Create another project: `expirycare-prod`
- Run all migrations
- Copy URL and keys

### 2. Set Up Local Development

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
RESEND_API_KEY=re_your-dev-key
RESEND_FROM_EMAIL=ExpiryCare <onboarding@resend.dev>
```

### 3. Set Up Vercel Production

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables for **Production** environment
3. Use production Supabase project keys
4. Use production Resend API key

### 4. Start Developing

```bash
# Start dev server (uses .env.local)
npm run dev

# Your app will use dev Supabase project
# Test data goes to dev database
# Safe to experiment!
```

## 💡 How to Use for Feature Development

### Typical Workflow

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop locally:**
   - Code uses dev Supabase (from `.env.local`)
   - Test data in dev database
   - Safe to experiment

3. **Test in preview:**
   - Push to GitHub
   - Vercel creates preview deployment
   - Test before merging

4. **Deploy to production:**
   - Merge to main
   - Vercel deploys to production
   - Run migrations in prod if needed

### Using Environment Config

```typescript
import { envConfig, featureFlags } from '@/lib/config/env'

// Check if in development
if (envConfig.isDevelopment) {
  console.log('Debug info:', data)
}

// Use feature flags
if (featureFlags.enableBetaFeatures()) {
  // Show beta feature
}
```

## 📋 Key Benefits

1. **Isolated Environments:**
   - Dev and prod are completely separate
   - No risk of affecting production data
   - Safe to experiment

2. **Easy Testing:**
   - Test features in dev first
   - Preview deployments for review
   - Confident production deployments

3. **Feature Flags:**
   - Enable/disable features per environment
   - Gradual rollouts
   - Easy rollback

4. **Type Safety:**
   - TypeScript types for all config
   - Compile-time checks
   - Better IDE support

## 🔍 Quick Reference

**Check environment:**
```typescript
import { envConfig } from '@/lib/config/env'
console.log(envConfig.environment) // 'development' or 'production'
```

**Use feature flags:**
```typescript
import { featureFlags } from '@/lib/config/env'
if (featureFlags.enableBetaFeatures()) {
  // Beta feature code
}
```

**Get Supabase config:**
```typescript
import { getSupabaseConfig } from '@/lib/config/env'
const { url, anonKey } = getSupabaseConfig()
```

## 📖 Full Documentation

- **Complete Setup:** See `ENVIRONMENT_SETUP.md`
- **Feature Workflow:** See `FEATURE_DEVELOPMENT_WORKFLOW.md`
- **Quick Start:** See `ENVIRONMENT_QUICK_START.md`

## ❓ Need Help?

1. Check `ENVIRONMENT_SETUP.md` for detailed instructions
2. Check `FEATURE_DEVELOPMENT_WORKFLOW.md` for development process
3. Check troubleshooting sections in the guides

---

**You're all set!** Start by creating your Supabase projects and setting up `.env.local`. 🚀

