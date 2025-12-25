# Deployment Next Steps - Dev & Prod Setup

Complete guide for setting up local development and Vercel production deployment.

## 🎯 Overview

- **Local Development:** Use `.env.local` (stays on your machine, never pushed to git)
- **Vercel Production:** Use Vercel Environment Variables (configured in dashboard)

## 📋 Step-by-Step Setup

### Step 1: Set Up Local Development Environment

#### 1.1 Create `.env.local` File

In your project root, create `.env.local` (this file is already in `.gitignore`):

```bash
# Copy the example file as a starting point
cp .env.development.example .env.local
```

Or create it manually:

```env
# Development Environment Variables
# This file is for LOCAL DEVELOPMENT ONLY
# It will NOT be committed to git

# Environment
NODE_ENV=development

# Supabase Development Project
# Get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key-here

# Resend Email Service (Development/Test Mode)
# Get this from: https://resend.com/api-keys
RESEND_API_KEY=re_your-dev-resend-api-key
RESEND_FROM_EMAIL=ExpiryCare <onboarding@resend.dev>

# Optional: Feature Flags (Development)
NEXT_PUBLIC_ENABLE_BETA_FEATURES=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=true

# Optional: Logging
NEXT_PUBLIC_LOG_LEVEL=debug
```

#### 1.2 Get Your Development Keys

**Supabase Development Project:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **development** project (or create one if you haven't)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

**Resend Development Key:**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a new API key (or use existing test key)
3. Copy the key → `RESEND_API_KEY`

#### 1.3 Update `.env.local` with Real Keys

Replace the placeholder values in `.env.local` with your actual development keys.

#### 1.4 Test Local Development

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` and verify:
- ✅ App loads without errors
- ✅ Can sign up/login
- ✅ Can create items
- ✅ Database operations work

**Note:** `.env.local` stays on your machine and is never committed to git.

---

### Step 2: Set Up Vercel Production Environment

#### 2.1 Create Vercel Account (if not done)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Import your repository: `SasikumarSubbaian/ExpiryCare`

#### 2.2 Configure Production Environment Variables

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable for **Production** environment:

**Add these variables one by one:**

| Variable Name | Value | Environment |
|-------------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-prod-project.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-prod-anon-key` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-prod-service-role-key` | Production |
| `RESEND_API_KEY` | `re_your-prod-resend-key` | Production |
| `RESEND_FROM_EMAIL` | `ExpiryCare <reminders@yourdomain.com>` | Production |
| `NEXT_PUBLIC_ENABLE_BETA_FEATURES` | `false` | Production |
| `NEXT_PUBLIC_ENABLE_DEBUG_MODE` | `false` | Production |

**How to add:**
1. Click **"Add New"**
2. Enter **Key** (variable name)
3. Enter **Value** (your actual key)
4. Select **Environment**: Choose **Production** (and optionally **Preview**)
5. Click **Save**

#### 2.3 Get Your Production Keys

**Supabase Production Project:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your **production** project (create one if needed)
3. Run all migrations in production database:
   - Go to **SQL Editor**
   - Run all files from `supabase/migrations/` in order
4. Go to **Settings** → **API**
5. Copy the production keys

**Resend Production Key:**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Create a production API key
3. If using custom domain, verify it first
4. Copy the key

#### 2.4 Deploy to Vercel

**Option A: Automatic (Recommended)**
- Vercel automatically deploys when you push to `main` branch
- After adding environment variables, trigger a new deployment:
  - Go to **Deployments** tab
  - Click **"Redeploy"** on the latest deployment
  - Or push a new commit

**Option B: Manual Deploy**
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel --prod
```

#### 2.5 Verify Production Deployment

1. Visit your production URL (e.g., `https://your-app.vercel.app`)
2. Test:
   - ✅ App loads
   - ✅ Sign up works
   - ✅ Database operations work
   - ✅ No console errors

---

## 🔄 Workflow Summary

### Local Development
```bash
# 1. Work on your code
npm run dev

# 2. Test locally (uses .env.local → dev Supabase)
# 3. Make changes
# 4. Commit and push
git add .
git commit -m "Your changes"
git push
```

### Production Deployment
```bash
# 1. Push to main branch
git push origin main

# 2. Vercel automatically deploys
# 3. Uses Vercel environment variables → prod Supabase
# 4. Production site updates
```

---

## 📊 Environment Comparison

| Aspect | Local Dev | Vercel Production |
|--------|-----------|-------------------|
| **Config File** | `.env.local` | Vercel Dashboard |
| **Supabase** | Dev project | Prod project |
| **Database** | Test data | Real user data |
| **Resend** | Test mode | Production mode |
| **URL** | `localhost:3000` | `your-app.vercel.app` |
| **Auto-deploy** | Manual (`npm run dev`) | Automatic (on push) |

---

## ✅ Checklist

### Local Development Setup
- [ ] Created `.env.local` file
- [ ] Added development Supabase keys
- [ ] Added development Resend key
- [ ] Tested `npm run dev` works
- [ ] Can sign up/login locally
- [ ] Database operations work

### Vercel Production Setup
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Production Supabase project created
- [ ] Production migrations run
- [ ] All environment variables added in Vercel
- [ ] Production deployment successful
- [ ] Production site tested and working

---

## 🚀 Next Steps After Setup

### 1. Test the Complete Flow

**Local:**
```bash
npm run dev
# Test all features locally
```

**Production:**
- Visit production URL
- Test signup, login, create items
- Verify emails work (if configured)

### 2. Set Up Preview Deployments

Vercel automatically creates preview deployments for pull requests:
- Uses same environment variables as production (or you can set separate preview vars)
- Great for testing before merging

### 3. Configure Custom Domain (Optional)

1. Go to Vercel → Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 4. Set Up Monitoring

- Monitor Vercel deployments
- Check Supabase logs
- Monitor Resend email delivery
- Set up error tracking (optional: Sentry)

### 5. Database Migrations

**When adding new features:**
1. Test migration in dev Supabase first
2. Run migration in prod Supabase
3. Deploy code to Vercel

---

## 🛠️ Troubleshooting

### Local Development Issues

**"Environment variable not found"**
- Check `.env.local` exists
- Verify variable names (case-sensitive)
- Restart dev server: `npm run dev`

**"Wrong database"**
- Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
- Verify it points to dev project

### Vercel Production Issues

**"Build failed"**
- Check Vercel build logs
- Verify all environment variables are set
- Check for TypeScript errors

**"Environment variable not found"**
- Go to Vercel → Settings → Environment Variables
- Verify variables are set for **Production** environment
- Redeploy after adding variables

**"Wrong database in production"**
- Check `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- Verify it points to production project

---

## 📚 Related Documentation

- **Environment Setup:** `ENVIRONMENT_SETUP.md`
- **Feature Development:** `FEATURE_DEVELOPMENT_WORKFLOW.md`
- **Quick Start:** `ENVIRONMENT_QUICK_START.md`
- **Launch Checklist:** `LAUNCH_CHECKLIST.md`

---

## 🎓 Key Takeaways

1. **`.env.local`** = Local development (never commit)
2. **Vercel Environment Variables** = Production (configured in dashboard)
3. **Separate Supabase projects** = Dev and Prod isolation
4. **Automatic deployments** = Push to main = deploy to production

---

**You're all set!** Follow the steps above to get your dev and prod environments running. 🚀

