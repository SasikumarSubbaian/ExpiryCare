# Quick Commands Reference

Quick copy-paste commands for setting up dev and prod environments.

## 🏠 Local Development Setup

### 1. Create `.env.local` file

```bash
# Copy example file
cp .env.development.example .env.local

# Or create manually (Windows PowerShell)
New-Item -Path .env.local -ItemType File
```

### 2. Edit `.env.local` with your dev keys

Open `.env.local` and replace placeholders with your actual development keys from:
- Supabase Dashboard → Settings → API
- Resend Dashboard → API Keys

### 3. Start development server

```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 🚀 Vercel Production Setup

### 1. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import `SasikumarSubbaian/ExpiryCare`
4. Click **"Deploy"** (we'll add env vars next)

### 2. Add Environment Variables in Vercel

**Via Dashboard:**
1. Project → Settings → Environment Variables
2. Add each variable for **Production**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `NODE_ENV=production`

**Via CLI (Alternative):**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add RESEND_API_KEY production
```

### 3. Redeploy After Adding Variables

**Via Dashboard:**
- Go to Deployments → Click "Redeploy" on latest

**Via CLI:**
```bash
vercel --prod
```

---

## 🔄 Daily Workflow

### Develop Locally
```bash
# 1. Make changes to code
# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Your commit message"
git push
```

### Deploy to Production
```bash
# Push to main branch (Vercel auto-deploys)
git push origin main

# Or manually deploy
vercel --prod
```

---

## ✅ Verification Commands

### Check Local Environment
```bash
# Check if .env.local exists
Test-Path .env.local

# View .env.local (be careful - contains secrets!)
Get-Content .env.local
```

### Check Git Status
```bash
# Verify .env.local is NOT tracked
git status

# Should NOT show .env.local in output
```

### Check Vercel Deployment
```bash
# List deployments
vercel ls

# View logs
vercel logs
```

---

## 🛠️ Troubleshooting Commands

### Restart Dev Server
```bash
# Stop server (Ctrl+C) then:
npm run dev
```

### Clear Next.js Cache
```bash
# Delete .next folder
Remove-Item -Recurse -Force .next

# Restart dev server
npm run dev
```

### Check Environment Variables
```bash
# In your code, add temporary:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

---

## 📋 Quick Checklist

### Local Dev
- [ ] `.env.local` created
- [ ] Dev Supabase keys added
- [ ] Dev Resend key added
- [ ] `npm run dev` works
- [ ] App loads at localhost:3000

### Vercel Prod
- [ ] Repository connected to Vercel
- [ ] All env vars added in Vercel dashboard
- [ ] Production Supabase project created
- [ ] Production migrations run
- [ ] Deployment successful
- [ ] Production site works

---

**Remember:**
- `.env.local` = Local only (never commit)
- Vercel Dashboard = Production (configured online)

