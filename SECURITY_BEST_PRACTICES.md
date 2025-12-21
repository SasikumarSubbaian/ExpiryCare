# Security Best Practices Implementation Guide

This guide provides actionable steps to implement the security best practices for your NeverMiss application.

## Overview

Your application uses sensitive credentials that must be protected:
- **SUPABASE_SERVICE_ROLE_KEY** - Bypasses RLS, full database access
- **RESEND_API_KEY** - Email sending capabilities
- **NEXT_PUBLIC_SUPABASE_URL** & **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Public (safe to expose)

---

## 1. Never Commit `.env.local` ✅

**Status:** Already implemented in `.gitignore`

### Verification Steps:

1. **Check `.gitignore` includes:**
   ```bash
   # Should see these lines:
   .env*.local
   .env
   ```
   ```powershell
   # PowerShell equivalent:
   Get-Content .gitignore | Select-String -Pattern "\.env"
   # Should see these lines:
   # .env*.local
   # .env
   ```

2. **Verify `.env.local` is not tracked:**
   ```bash
   git status
   # Should NOT see .env.local in the output
   ```
   ```powershell
   # PowerShell equivalent:
   git status
   # Should NOT see .env.local in the output
   # Or check specifically:
   git status --porcelain | Select-String "\.env\.local"
   # Should return nothing
   ```

3. **If `.env.local` was previously committed:**
   ```bash
   # Remove from git history (if needed)
   git rm --cached .env.local
   git commit -m "Remove .env.local from tracking"
   ```
   ```powershell
   # PowerShell equivalent (same commands work):
   git rm --cached .env.local
   git commit -m "Remove .env.local from tracking"
   ```

### Additional Protection:

- ✅ **Pre-commit hook** (optional but recommended):
  Create `.husky/pre-commit`:
  ```bash
  #!/bin/sh
  if git diff --cached --name-only | grep -E '\.env'; then
    echo "❌ Error: Attempted to commit .env file"
    exit 1
  fi
  ```
  
  **PowerShell alternative** (for Windows without Git Bash):
  Create `.husky/pre-commit.ps1`:
  ```powershell
  # PowerShell pre-commit hook
  $stagedFiles = git diff --cached --name-only
  if ($stagedFiles -match '\.env') {
    Write-Host "❌ Error: Attempted to commit .env file" -ForegroundColor Red
    exit 1
  }
  ```
  
  **Note:** If using Husky, you may need to configure it to use PowerShell:
  ```json
  // package.json
  {
    "husky": {
      "hooks": {
        "pre-commit": "powershell -File .husky/pre-commit.ps1"
      }
    }
  }
  ```

---

## 2. Use Different Keys for Dev/Prod

### Current Situation:
- Development: Uses `.env.local` with dev Supabase project
- Production: Uses Vercel environment variables with prod Supabase project

### Implementation Steps:

#### Option A: Separate Supabase Projects (Recommended)

**For Development:**
1. Create a separate Supabase project for development:
   - Go to [supabase.com](https://supabase.com)
   - Create new project: `nevermiss-dev`
   - Copy dev credentials to `.env.local`

**For Production:**
1. Use your production Supabase project: `nevermiss-prod`
   - Add credentials to Vercel environment variables
   - Settings → Environment Variables → Add each variable

**Benefits:**
- ✅ Complete isolation between environments
- ✅ No risk of affecting production data during development
- ✅ Can test migrations safely in dev

#### Option B: Environment-Specific Keys (If using same project)

If you must use the same Supabase project:

1. **Create separate API keys in Supabase:**
   - Go to Supabase Dashboard → Settings → API
   - Note: Service role key is shared, but you can use different anon keys via RLS policies

2. **Use environment-specific variables:**
   ```env
   # .env.local (dev)
   NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
   SUPABASE_SERVICE_ROLE_KEY=dev-service-role-key
   ```

   ```env
   # Vercel Production
   NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
   SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key
   ```

### Verification:

```bash
# Check dev environment
npm run dev
# Verify it connects to dev Supabase project

# Check production (after deployment)
# Verify production uses different project
```
```powershell
# PowerShell equivalent (same commands):
# Check dev environment
npm run dev
# Verify it connects to dev Supabase project

# Check production (after deployment)
# Verify production uses different project
```

---

## 3. Rotate Keys Regularly

### Rotation Schedule:

| Key | Rotation Frequency | Priority |
|-----|-------------------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Every 90 days | 🔴 High |
| `RESEND_API_KEY` | Every 180 days | 🟡 Medium |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Every 180 days | 🟢 Low |

### Step-by-Step Rotation Process:

#### Rotating Supabase Service Role Key:

1. **Generate new key:**
   - Supabase Dashboard → Settings → API
   - Click "Reset service_role key" (⚠️ This invalidates old key immediately)
   - Copy the new key

2. **Update environment variables:**
   - **Local:** Update `.env.local`
   - **Production:** Update Vercel environment variables
   - **Important:** Do both simultaneously to avoid downtime

3. **Redeploy:**
   ```bash
   # Local: Restart dev server
   npm run dev
   
   # Production: Redeploy on Vercel
   # (Automatic after env var update, or manual redeploy)
   ```
   ```powershell
   # PowerShell equivalent (same commands):
   # Local: Restart dev server
   npm run dev
   
   # Production: Redeploy on Vercel
   # (Automatic after env var update, or manual redeploy)
   ```

4. **Verify:**
   - Test reminder API: `POST /api/reminders`
   - Check logs for errors
   - Verify emails are sending

#### Rotating Resend API Key:

1. **Create new key:**
   - Resend Dashboard → API Keys → Create API Key
   - Copy the new key (starts with `re_`)

2. **Update both environments:**
   - Update `.env.local` (dev)
   - Update Vercel environment variables (prod)

3. **Test:**
   - Trigger a test reminder
   - Verify email is received

4. **Delete old key:**
   - After confirming new key works (wait 24-48 hours)
   - Resend Dashboard → Delete old API key

#### Rotating Supabase Anon Key:

1. **Reset anon key:**
   - Supabase Dashboard → Settings → API
   - Click "Reset anon key"
   - Copy new key

2. **Update:**
   - `.env.local` (dev)
   - Vercel environment variables (prod)

3. **Redeploy and test:**
   - Verify app still works
   - Check authentication flows

### Automation (Optional):

Create a calendar reminder or use a tool like:
- **GitHub Actions** scheduled workflow
- **Google Calendar** recurring event
- **Notion** or **Linear** task with due dates

**Example GitHub Actions reminder:**
```yaml
# .github/workflows/security-reminders.yml
name: Security Key Rotation Reminder
on:
  schedule:
    - cron: '0 0 1 */3 *' # Every 3 months
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Create Issue
        # Add logic to create GitHub issue for key rotation
```

---

## 4. Limit Service Role Key Usage

### Current Status: ✅ Good

The service role key is **only** used in:
- `app/api/reminders/route.ts` - Server-side API route only

### Verification Checklist:

✅ **Service role key is NOT used in:**
- Client-side components
- Client-side API calls
- Public pages
- Middleware (only uses anon key)

✅ **Service role key IS used in:**
- Server-side API routes only (`/app/api/reminders/route.ts`)

### Additional Security Measures:

#### A. Add Runtime Validation

Add to `app/api/reminders/route.ts`:

```typescript
// Add at the top of the file
function validateServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  
  // Ensure it's not accidentally exposed
  if (typeof window !== 'undefined') {
    throw new Error('Service role key should never be used in client-side code')
  }
  
  // Validate key format (starts with eyJ for JWT)
  if (!key.startsWith('eyJ')) {
    throw new Error('Invalid service role key format')
  }
  
  return key
}
```

#### B. Add API Route Protection

Protect the reminders endpoint from unauthorized access:

```typescript
// app/api/reminders/route.ts
export async function GET(request: Request) {
  // Optional: Add API key or IP whitelist for cron jobs
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // ... rest of the code
}
```

Then in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/reminders",
    "schedule": "0 9 * * *"
  }]
}
```

And set `CRON_SECRET` in Vercel environment variables.

#### C. Add Audit Logging

Log when service role key is used:

```typescript
// In getServiceRoleClient()
function getServiceRoleClient() {
  // Log usage (without exposing the key)
  console.log('[AUDIT] Service role key accessed at:', new Date().toISOString())
  console.log('[AUDIT] Stack trace:', new Error().stack?.split('\n')[2])
  
  // ... rest of the code
}
```

#### D. Code Review Checklist

Before merging PRs, verify:
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in client components
- [ ] No `process.env.SUPABASE_SERVICE_ROLE_KEY` in files outside `/app/api/`
- [ ] No hardcoded keys in code
- [ ] All sensitive keys use `process.env` (not `NEXT_PUBLIC_*`)

---

## 5. Monitor API Usage

### Supabase Monitoring

#### Dashboard Access:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings → Usage**

#### Key Metrics to Monitor:

**Database:**
- API requests per day
- Database size
- Bandwidth usage
- Active connections

**Auth:**
- User signups
- Active users
- Auth API calls

**Storage:**
- Storage used
- Bandwidth

#### Set Up Alerts:

1. **Supabase Dashboard → Settings → Billing:**
   - Set usage limits
   - Enable email alerts for:
     - 80% of quota reached
     - 100% of quota reached

2. **Monitor for Anomalies:**
   - Sudden spike in API calls (possible key leak)
   - Unusual database queries
   - Unexpected storage growth

#### Weekly Review Checklist:

- [ ] Check API request count (should be consistent)
- [ ] Review database size growth
- [ ] Check for failed queries
- [ ] Verify no unexpected users/activity

### Resend Monitoring

#### Dashboard Access:
1. Go to [Resend Dashboard](https://resend.com/emails)
2. Navigate to **Dashboard** or **API Keys**

#### Key Metrics to Monitor:

**Email Sending:**
- Emails sent today/week/month
- Delivery rate
- Bounce rate
- Spam complaints

**API Usage:**
- API calls per day
- Rate limit status
- Failed requests

#### Set Up Alerts:

1. **Resend Dashboard → Settings → Notifications:**
   - Email alerts for:
     - High bounce rate (>5%)
     - Spam complaints
     - API errors
     - Approaching rate limits

2. **Monitor for Issues:**
   - Sudden drop in delivery rate
   - Spike in bounces
   - API errors

#### Weekly Review Checklist:

- [ ] Check email delivery rate (should be >95%)
- [ ] Review bounce rate (should be <5%)
- [ ] Check for spam complaints
- [ ] Verify API usage is within limits

### Automated Monitoring (Optional)

#### Option A: GitHub Actions

Create `.github/workflows/monitor-usage.yml`:

```yaml
name: Monitor API Usage
on:
  schedule:
    - cron: '0 9 * * 1' # Every Monday at 9 AM
  workflow_dispatch: # Manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Check Supabase Usage
        # Use Supabase API to check usage
        run: |
          # Add script to check usage via Supabase API
          
      - name: Check Resend Usage
        # Use Resend API to check usage
        run: |
          # Add script to check usage via Resend API
          
      - name: Create Report
        # Generate usage report
        run: |
          # Create markdown report
```

#### Option B: Custom Dashboard

Create a simple monitoring page (protected route):

```typescript
// app/admin/monitoring/page.tsx (protected route)
export default async function MonitoringPage() {
  // Fetch usage stats from Supabase and Resend APIs
  // Display in a dashboard
}
```

### Red Flags to Watch For:

🚨 **Immediate Action Required:**
- API usage spike (10x normal)
- Failed authentication attempts
- Unusual database queries
- Emails not sending
- Service role key exposed in logs

⚠️ **Investigate:**
- Gradual increase in API calls
- New users from unexpected regions
- Storage growing faster than expected
- Bounce rate increasing

---

## Implementation Priority

### Phase 1: Immediate (This Week)
1. ✅ Verify `.env.local` is in `.gitignore` (already done)
2. Set up separate dev/prod Supabase projects
3. Add API route protection for `/api/reminders`

### Phase 2: Short Term (This Month)
4. Set up monitoring dashboards
5. Configure alerts in Supabase and Resend
6. Add audit logging for service role key usage

### Phase 3: Ongoing
7. Schedule key rotation reminders
8. Weekly usage reviews
9. Quarterly security audits

---

## Quick Reference

### Environment Variables Security Checklist:

- [ ] `.env.local` in `.gitignore`
- [ ] Different keys for dev/prod
- [ ] Service role key only in server-side code
- [ ] No secrets in client-side code
- [ ] Keys rotated within last 90 days
- [ ] Monitoring alerts configured
- [ ] Usage reviewed weekly

### Emergency Response:

If a key is compromised:

1. **Immediately:**
   - Rotate the compromised key
   - Check logs for unauthorized access
   - Review recent API usage

2. **Within 24 hours:**
   - Audit all systems using the key
   - Review access logs
   - Update all environments

3. **Follow-up:**
   - Document the incident
   - Review security practices
   - Implement additional protections

---

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Resend Security Guide](https://resend.com/docs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## PowerShell Quick Reference (Windows)

### Quick Verification Script

Create `verify-security.ps1`:

```powershell
# Security Verification Script for NeverMiss
Write-Host "🔒 Security Verification Check" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists and is in .gitignore
Write-Host "1. Checking .gitignore..." -ForegroundColor Yellow
$gitignore = Get-Content .gitignore -ErrorAction SilentlyContinue
if ($gitignore -match '\.env') {
    Write-Host "   ✅ .env files are in .gitignore" -ForegroundColor Green
} else {
    Write-Host "   ❌ .env files NOT found in .gitignore" -ForegroundColor Red
}

# Check if .env.local is tracked by git
Write-Host "2. Checking if .env.local is tracked..." -ForegroundColor Yellow
$tracked = git ls-files .env.local 2>$null
if ($tracked) {
    Write-Host "   ❌ .env.local is tracked by git!" -ForegroundColor Red
    Write-Host "   Run: git rm --cached .env.local" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ .env.local is not tracked" -ForegroundColor Green
}

# Check if .env.local exists
Write-Host "3. Checking if .env.local exists..." -ForegroundColor Yellow
if (Test-Path .env.local) {
    Write-Host "   ✅ .env.local file exists" -ForegroundColor Green
    
    # Check for required variables (without showing values)
    $envContent = Get-Content .env.local
    $requiredVars = @(
        "SUPABASE_SERVICE_ROLE_KEY",
        "RESEND_API_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    
    Write-Host "4. Checking required environment variables..." -ForegroundColor Yellow
    foreach ($var in $requiredVars) {
        if ($envContent -match "^$var=") {
            Write-Host "   ✅ $var is set" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var is missing" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ⚠️  .env.local file not found" -ForegroundColor Yellow
    Write-Host "   Create it from .env.example if needed" -ForegroundColor Yellow
}

# Check for service role key in client-side code
Write-Host "5. Scanning for service role key in client code..." -ForegroundColor Yellow
$clientFiles = Get-ChildItem -Recurse -Include *.tsx,*.ts,*.jsx,*.js -Exclude node_modules,*.d.ts | 
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.next\\' }
$found = $false
foreach ($file in $clientFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -match 'SUPABASE_SERVICE_ROLE_KEY' -and $file.FullName -notmatch '\\api\\') {
        Write-Host "   ❌ Found service role key reference in: $($file.Name)" -ForegroundColor Red
        $found = $true
    }
}
if (-not $found) {
    Write-Host "   ✅ No service role key found in client-side code" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Security check complete!" -ForegroundColor Cyan
```

**Usage:**
```powershell
# Run the verification script
.\verify-security.ps1

# Or if execution policy blocks it:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\verify-security.ps1
```

### Common PowerShell Commands

```powershell
# Check git status
git status

# View .gitignore content
Get-Content .gitignore

# Check if file is tracked
git ls-files .env.local

# Remove file from git tracking
git rm --cached .env.local

# Check environment variables (without exposing values)
Get-Content .env.local | Select-String "SUPABASE_SERVICE_ROLE_KEY"

# Search for sensitive keys in code
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String "SUPABASE_SERVICE_ROLE_KEY"

# Run npm commands (same as bash)
npm run dev
npm run build
```

---

**Last Updated:** Security implementation guide
**Next Review:** Schedule quarterly security audit

