# Setup Summary - Dev & Prod Environments

## 🎯 What You Have Now

✅ **Code pushed to GitHub:** `SasikumarSubbaian/ExpiryCare`  
✅ **Example files created:** `.env.development.example` and `.env.production.example`  
✅ **Git configured:** `.env.local` is in `.gitignore` (safe to use)

---

## 📍 Current Status

### ✅ Already Done
- [x] Repository created on GitHub
- [x] Code pushed to GitHub
- [x] Example environment files created
- [x] `.gitignore` configured (`.env.local` won't be committed)

### ⏳ Next Steps (Do These Now)

---

## 🏠 Step 1: Set Up Local Development (5 minutes)

### Create `.env.local` File

**Option A: Copy from example**
```bash
cp .env.development.example .env.local
```

**Option B: Create manually**
Create a file named `.env.local` in your project root with:

```env
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key
RESEND_API_KEY=re_your-dev-resend-key
RESEND_FROM_EMAIL=ExpiryCare <onboarding@resend.dev>
```

### Get Your Development Keys

1. **Supabase Dev Project:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create/select development project
   - Settings → API → Copy keys
   - Run migrations in dev database

2. **Resend Dev Key:**
   - Go to [Resend Dashboard](https://resend.com/api-keys)
   - Create/get API key
   - Copy to `.env.local`

### Test Local Development

```bash
npm run dev
```

Visit `http://localhost:3000` - should work! ✅

**Important:** `.env.local` stays on your computer and is NEVER pushed to git.

---

## 🚀 Step 2: Deploy to Vercel Production (10 minutes)

### 2.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import `SasikumarSubbaian/ExpiryCare`
5. Click **"Deploy"** (first deploy, we'll add env vars next)

### 2.2 Add Production Environment Variables

1. In Vercel project → **Settings** → **Environment Variables**
2. Add these variables (one by one) for **Production**:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `NEXT_PUBLIC_SUPABASE_URL` | Your prod Supabase URL | From prod project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your prod anon key | From prod project |
| `SUPABASE_SERVICE_ROLE_KEY` | Your prod service key | From prod project |
| `RESEND_API_KEY` | Your prod Resend key | From Resend dashboard |
| `RESEND_FROM_EMAIL` | `ExpiryCare <reminders@yourdomain.com>` | Your email |

3. For each variable:
   - Click **"Add New"**
   - Enter Key name
   - Enter Value
   - Select **Production** environment
   - Click **Save**

### 2.3 Get Production Keys

**Supabase Production Project:**
1. Create a NEW Supabase project for production
2. Run all migrations from `supabase/migrations/`
3. Settings → API → Copy production keys

**Resend Production Key:**
1. Create a production API key in Resend
2. If using custom domain, verify it first

### 2.4 Redeploy with Environment Variables

After adding all variables:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Wait for deployment to complete
4. Visit your production URL

---

## 📊 Environment Overview

```
┌─────────────────────────────────────────────────┐
│           YOUR DEVELOPMENT FLOW                  │
└─────────────────────────────────────────────────┘

LOCAL MACHINE                    GITHUB              VERCEL
┌─────────────┐                ┌─────────┐        ┌─────────┐
│ .env.local  │                │  Code   │        │  Env    │
│ (dev keys)  │                │  Files  │───────▶│  Vars   │
│             │                │         │        │(prod)   │
│ npm run dev │                │         │        │         │
│             │                │         │        │ Auto    │
│ localhost   │                │         │        │ Deploy  │
└─────────────┘                └─────────┘        └─────────┘
     │                              │                  │
     │                              │                  │
     ▼                              ▼                  ▼
┌─────────────┐                ┌─────────┐        ┌─────────┐
│  Supabase   │                │  GitHub │        │  Your   │
│  Dev DB     │                │  Repo   │        │  Prod   │
│             │                │         │        │  Site   │
└─────────────┘                └─────────┘        └─────────┘
```

---

## ✅ Complete Checklist

### Local Development
- [ ] `.env.local` file created
- [ ] Development Supabase project created
- [ ] Development Supabase migrations run
- [ ] Development keys added to `.env.local`
- [ ] Resend dev key added to `.env.local`
- [ ] `npm run dev` works
- [ ] App loads at `localhost:3000`
- [ ] Can sign up/login locally
- [ ] Database operations work

### Vercel Production
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Production Supabase project created
- [ ] Production migrations run
- [ ] All environment variables added in Vercel
- [ ] Variables set for **Production** environment
- [ ] Redeployed after adding variables
- [ ] Production site works
- [ ] Can sign up/login in production
- [ ] Production database operations work

---

## 🔄 Daily Workflow

### When Developing:

```bash
# 1. Work on code locally
npm run dev

# 2. Test with dev database (from .env.local)
# 3. Make changes
# 4. Commit and push
git add .
git commit -m "Add new feature"
git push
```

### When Deploying:

```bash
# 1. Push to main branch
git push origin main

# 2. Vercel automatically deploys
# 3. Uses production env vars from Vercel dashboard
# 4. Production site updates
```

---

## 🎓 Key Points

1. **`.env.local`** = Your local development (stays on your machine)
2. **Vercel Environment Variables** = Production (configured in Vercel dashboard)
3. **Separate Supabase projects** = Dev and Prod are isolated
4. **Automatic deployments** = Push to main = Deploy to production

---

## 📚 Documentation Files

- **Detailed Setup:** `DEPLOYMENT_NEXT_STEPS.md`
- **Quick Commands:** `QUICK_COMMANDS.md`
- **Environment Guide:** `ENVIRONMENT_SETUP.md`
- **Feature Workflow:** `FEATURE_DEVELOPMENT_WORKFLOW.md`

---

## 🆘 Need Help?

1. Check `DEPLOYMENT_NEXT_STEPS.md` for detailed instructions
2. Check `QUICK_COMMANDS.md` for copy-paste commands
3. Verify `.env.local` exists and has correct keys
4. Verify Vercel environment variables are set
5. Check Vercel deployment logs for errors

---

**You're ready!** Follow Step 1 and Step 2 above to get everything running. 🚀

