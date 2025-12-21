# Feature Development Workflow

Complete guide for developing new features using dev and prod environments.

## 🎯 Overview

This workflow ensures:
- Safe development and testing
- No impact on production data
- Smooth deployment process
- Easy rollback if needed

## 🔄 Development Workflow

### Step 1: Plan Your Feature

1. **Document the feature:**
   - What problem does it solve?
   - What are the requirements?
   - What database changes are needed?
   - What API endpoints are needed?

2. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
# Example: git checkout -b feature/export-data
```

### Step 2: Set Up Local Development

1. **Ensure dev environment is configured:**
   - Check `.env.local` exists with dev Supabase keys
   - Verify dev server runs: `npm run dev`

2. **Create test data in dev:**
   - Sign up test users
   - Create test items
   - Set up test scenarios

### Step 3: Develop the Feature

1. **Write code:**
   - Follow existing code patterns
   - Add TypeScript types
   - Write clean, readable code

2. **Test locally:**
   - Test all user flows
   - Test edge cases
   - Test error handling
   - Test on mobile (browser dev tools)

3. **Use environment utilities:**
```typescript
import { envConfig, featureFlags } from '@/lib/config/env'

// Check environment
if (envConfig.isDevelopment) {
  console.log('Debug info:', data)
}

// Use feature flags
if (featureFlags.enableBetaFeatures()) {
  // Show beta feature
}
```

### Step 4: Database Changes (If Needed)

1. **Create migration file:**
```bash
# Create new migration
supabase/migrations/008_your_feature.sql
```

2. **Test migration in dev:**
   - Run migration in dev Supabase project
   - Test application with new schema
   - Verify RLS policies work
   - Test rollback if needed

3. **Example migration:**
```sql
-- Migration: 008_your_feature.sql
-- Description: Add new table for feature

CREATE TABLE IF NOT EXISTS your_new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Add your columns here
);

-- Add RLS policies
ALTER TABLE your_new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON your_new_table
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
  ON your_new_table
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Step 5: Test in Preview Environment

1. **Push to GitHub:**
```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

2. **Vercel creates preview:**
   - Vercel automatically creates preview deployment
   - Uses preview environment variables (dev keys)
   - Get preview URL from Vercel dashboard

3. **Test preview:**
   - Test all functionality
   - Share with team for review
   - Fix any issues found

### Step 6: Code Review

1. **Create Pull Request:**
   - Add description of changes
   - Link to related issues
   - Add screenshots if UI changes

2. **Review checklist:**
   - [ ] Code follows project patterns
   - [ ] TypeScript types are correct
   - [ ] No console.logs in production code
   - [ ] Error handling is proper
   - [ ] Mobile responsive
   - [ ] Database migrations tested
   - [ ] RLS policies correct

### Step 7: Deploy to Production

1. **Merge to main:**
   - After PR approval, merge to main
   - Vercel automatically deploys to production

2. **Run production migration:**
   - Go to prod Supabase project
   - Run migration in SQL Editor
   - Verify no errors

3. **Monitor deployment:**
   - Check Vercel deployment logs
   - Monitor Supabase logs
   - Test production site
   - Watch for errors

## 🗄️ Database Migration Workflow

### Safe Migration Process

1. **Always test in dev first:**
   ```sql
   -- Run in dev Supabase project
   -- Test thoroughly
   -- Verify RLS policies
   ```

2. **Create rollback plan:**
   ```sql
   -- Document how to rollback
   -- Example:
   -- DROP TABLE IF EXISTS your_new_table;
   ```

3. **Run in production:**
   ```sql
   -- Run in prod Supabase project
   -- Monitor for errors
   -- Verify application works
   ```

4. **Best practices:**
   - Use transactions when possible
   - Add indexes for performance
   - Update RLS policies
   - Test with real data structure

## 🧪 Testing Strategy

### Local Testing

1. **Unit tests (if applicable):**
```bash
npm test
```

2. **Manual testing:**
   - Test happy path
   - Test error cases
   - Test edge cases
   - Test on different devices

3. **Database testing:**
   - Test with empty database
   - Test with existing data
   - Test with large datasets

### Preview Testing

1. **Smoke tests:**
   - Basic functionality works
   - No console errors
   - No TypeScript errors

2. **Integration tests:**
   - Test with real Supabase
   - Test email sending (if applicable)
   - Test file uploads (if applicable)

### Production Testing

1. **Post-deployment:**
   - Test critical paths
   - Monitor error logs
   - Check performance

2. **Gradual rollout:**
   - Use feature flags if needed
   - Monitor user feedback
   - Rollback if issues found

## 🚨 Rollback Procedure

### Code Rollback

1. **Revert commit:**
```bash
git revert <commit-hash>
git push origin main
```

2. **Vercel auto-deploys:**
   - Previous version is restored
   - Monitor for issues

### Database Rollback

1. **Create rollback migration:**
```sql
-- Rollback migration
-- Example: Drop table
DROP TABLE IF EXISTS your_new_table CASCADE;
```

2. **Run in production:**
   - Execute rollback SQL
   - Verify application works
   - Monitor for issues

## 📝 Feature Flag Usage

### Using Feature Flags

```typescript
import { featureFlags } from '@/lib/config/env'

// In your component
if (featureFlags.enableBetaFeatures()) {
  return <BetaFeature />
}

// In API route
if (featureFlags.enableDebugMode()) {
  console.log('Debug:', requestData)
}
```

### Adding New Feature Flags

1. **Add to environment files:**
```env
# .env.local (dev)
NEXT_PUBLIC_ENABLE_NEW_FEATURE=true

# Production (Vercel)
NEXT_PUBLIC_ENABLE_NEW_FEATURE=false
```

2. **Add to env.ts:**
```typescript
export const featureFlags = {
  // ... existing flags
  enableNewFeature: (): boolean => {
    return process.env.NEXT_PUBLIC_ENABLE_NEW_FEATURE === 'true'
  },
}
```

3. **Use in code:**
```typescript
if (featureFlags.enableNewFeature()) {
  // New feature code
}
```

## 🔍 Debugging

### Local Debugging

1. **Use debug mode:**
```typescript
import { envConfig } from '@/lib/config/env'

if (envConfig.enableDebugMode) {
  console.log('Debug info:', data)
}
```

2. **Check Supabase logs:**
   - Dev project → Logs
   - Check for errors
   - Monitor queries

3. **Check browser console:**
   - Open DevTools
   - Check for errors
   - Monitor network requests

### Production Debugging

1. **Vercel logs:**
   - Dashboard → Deployments → Logs
   - Check for errors
   - Monitor performance

2. **Supabase logs:**
   - Prod project → Logs
   - Check for errors
   - Monitor slow queries

3. **Error tracking:**
   - Set up Sentry or similar
   - Monitor error rates
   - Get alerts for critical errors

## 📊 Monitoring

### What to Monitor

1. **Application:**
   - Error rates
   - Response times
   - User signups
   - Active users

2. **Database:**
   - Query performance
   - Connection pool usage
   - Storage usage
   - Backup status

3. **Email:**
   - Delivery rates
   - Bounce rates
   - API usage

### Setting Up Alerts

1. **Vercel:**
   - Set up deployment notifications
   - Monitor build failures

2. **Supabase:**
   - Set up database alerts
   - Monitor storage usage

3. **Resend:**
   - Monitor email delivery
   - Check API usage

## ✅ Feature Checklist

Before deploying a feature:

- [ ] Code written and tested locally
- [ ] Database migrations tested in dev
- [ ] Preview deployment tested
- [ ] Code reviewed and approved
- [ ] Migration ready for production
- [ ] Rollback plan documented
- [ ] Feature flags configured (if needed)
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Error handling implemented
- [ ] Mobile responsive
- [ ] Performance acceptable

## 🎓 Best Practices

1. **Always test in dev first**
2. **Use feature flags for risky changes**
3. **Document database changes**
4. **Have a rollback plan**
5. **Monitor after deployment**
6. **Keep dev and prod in sync (structure-wise)**
7. **Use meaningful commit messages**
8. **Review code before merging**
9. **Test on multiple devices**
10. **Monitor error logs**

## 📚 Related Documentation

- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Launch Checklist](./LAUNCH_CHECKLIST.md)
- [Database Schema](./supabase/SCHEMA.md)
- [RLS Policies Guide](./RLS_POLICIES_GUIDE.md)

---

**Last Updated:** Feature development workflow
**Status:** Ready for use ✅

