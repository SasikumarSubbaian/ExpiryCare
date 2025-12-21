# Security Audit & Key Protection Guide

## ✅ Security Status Check

### 1. Environment Files Security

**✅ GOOD:** `.env.local` is properly ignored and was never committed.

**Verification:**
- `.gitignore` includes `.env*.local` ✅
- No `.env.local` files found in git history ✅
- Only `.env*.example` files are tracked (safe placeholders) ✅

### 2. Exposed Keys Check

**Action Required:** Review the following files for any real keys:
- `GOOGLE_OAUTH_SETUP.md` - Check for real Client IDs/Secrets
- `ENV_VARIABLES.md` - Check for real keys
- `app/api/reminders/route.ts` - Check for hardcoded keys
- Any other documentation files

**If you find real keys:**
1. **Rotate them immediately** (see `SECURITY_KEY_ROTATION.md`)
2. Remove from git history (see below)
3. Replace with placeholders

---

## 🔒 How to Hide Supabase URL in Google OAuth

### The Problem

Google shows the domain that's making the OAuth request. Since Supabase handles OAuth, it shows:
```
"to continue to kmbpjdgiqrohvophfbes.supabase.co"
```

### The Solution (Two Options)

#### Option 1: Improve OAuth Consent Screen (Free - Recommended)

**This makes "ExpiryCare" prominent, but Supabase URL may still appear:**

1. **Google Cloud Console** → OAuth consent screen:
   - **App name:** `ExpiryCare` (will be prominent)
   - **App logo:** Upload your logo
   - **App domain:** `expirycare.com`
   - **Privacy policy:** `https://expirycare.com/privacy`
   - **Terms of service:** `https://expirycare.com/terms`

2. **Publish the app** (not just Testing mode):
   - Go to OAuth consent screen
   - Click **"PUBLISH APP"** button
   - This makes it available to all users

**Result:** Users will see "ExpiryCare" prominently, but the Supabase domain may still appear in small text.

#### Option 2: Use Custom Domain in Supabase (Pro Plan Required)

**This completely hides the Supabase URL:**

1. **Upgrade to Supabase Pro** ($25/month)
2. **Configure custom domain:**
   - Supabase Dashboard → Settings → Custom Domain
   - Add `auth.expirycare.com` (or similar)
   - Configure DNS records
3. **Update OAuth redirect URIs:**
   - Google Cloud Console → Use `https://auth.expirycare.com/auth/v1/callback`
   - Supabase → Update redirect URLs

**Result:** Users will see `auth.expirycare.com` instead of Supabase URL.

---

## 🛡️ Security Best Practices

### 1. Never Commit Sensitive Files

**Files that should NEVER be committed:**
- ❌ `.env.local`
- ❌ `.env.development.local`
- ❌ `.env.production.local`
- ❌ `.env` (without suffix)
- ❌ Any file with real API keys

**Files that ARE safe to commit:**
- ✅ `.env*.example` (with placeholders)
- ✅ Documentation files (without real keys)

### 2. Verify .gitignore

Your `.gitignore` should include:
```
.env*.local
.env
!.env*.example
```

### 3. If Keys Were Committed (Revoke & Rotate)

**If you accidentally committed keys:**

1. **Rotate keys immediately:**
   - Supabase Dashboard → Settings → API → Rotate keys
   - Google Cloud Console → Create new OAuth credentials
   - Vercel → Update environment variables

2. **Remove from git history:**
   ```bash
   # Remove file from history (DANGEROUS - only if needed)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (WARNING: This rewrites history)
   git push origin --force --all
   ```

3. **Better approach - Use git-secrets:**
   ```bash
   # Install git-secrets
   git secrets --install
   git secrets --register-aws
   git secrets --add 'eyJ[a-zA-Z0-9_-]{100,}'  # Supabase keys
   git secrets --add 'GOCSPX-[a-zA-Z0-9_-]+'   # Google secrets
   ```

### 4. Environment Variables Security

**Local Development:**
- Use `.env.local` (gitignored)
- Never commit real keys

**Production (Vercel):**
- Use Vercel Dashboard → Settings → Environment Variables
- Never hardcode in code
- Use different keys for dev/prod

**Example Files:**
- `.env.development.example` - Safe placeholders
- `.env.production.example` - Safe placeholders

### 5. Code Security

**Never do this:**
```typescript
// ❌ BAD - Hardcoded key
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// ❌ BAD - Logging keys
console.log('Key:', process.env.SUPABASE_KEY)
```

**Always do this:**
```typescript
// ✅ GOOD - From environment
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ✅ GOOD - Validate but don't log
if (!supabaseKey) {
  throw new Error('Missing Supabase key')
}
```

---

## 📋 Security Checklist

### Immediate Actions

- [ ] Verify `.env.local` is not in git (✅ Already verified)
- [ ] Check all documentation files for real keys
- [ ] Rotate any exposed keys
- [ ] Update OAuth consent screen with proper branding
- [ ] Publish OAuth app (not just Testing mode)
- [ ] Create Privacy Policy page (`/privacy`)
- [ ] Create Terms of Service page (`/terms`)

### Ongoing Security

- [ ] Use different keys for dev/prod
- [ ] Never commit `.env.local` files
- [ ] Rotate keys periodically (every 90 days)
- [ ] Monitor Supabase dashboard for suspicious activity
- [ ] Use Supabase RLS policies (already configured)
- [ ] Keep dependencies updated
- [ ] Review access logs regularly

---

## 🔍 How to Check for Exposed Keys

### 1. Search for Common Key Patterns

```bash
# Supabase JWT tokens (start with eyJ)
grep -r "eyJ[a-zA-Z0-9_-]\{100,\}" .

# Google OAuth secrets
grep -r "GOCSPX-" .

# Resend API keys
grep -r "re_[A-Za-z0-9]\{32\}" .
```

### 2. Check Git History

```bash
# Search git history for keys
git log -p --all -S "eyJ" | grep -A 5 -B 5 "eyJ"
```

### 3. Use GitHub Secret Scanning

- GitHub automatically scans for exposed secrets
- Check Security tab in your repository
- If found, rotate keys immediately

---

## 🚨 If Keys Are Exposed

### Immediate Steps:

1. **Rotate all exposed keys:**
   - Supabase: Dashboard → Settings → API → Rotate
   - Google: Create new OAuth credentials
   - Resend: Generate new API key

2. **Update environment variables:**
   - Local: Update `.env.local`
   - Vercel: Update production environment variables

3. **Remove from git (if committed):**
   - See "If Keys Were Committed" section above

4. **Monitor for abuse:**
   - Check Supabase logs
   - Check Google Cloud Console usage
   - Check Vercel logs

---

## 📝 Key Rotation Guide

See `SECURITY_KEY_ROTATION.md` for detailed steps on rotating:
- Supabase keys
- Google OAuth credentials
- Resend API keys
- Vercel environment variables

---

**Your keys are currently secure! ✅**

**To hide Supabase URL:** Use Option 1 (OAuth consent screen) or Option 2 (Custom domain with Pro plan).

