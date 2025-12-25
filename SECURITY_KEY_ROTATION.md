# Security Alert - Key Rotation Guide

## ⚠️ What Happened

GitHub's secret scanning detected API keys in the `.env.development.example` and `.env.production.example` files that were committed to the repository.

**Status:** ✅ **FIXED** - The files have been updated with placeholder values and pushed to GitHub.

## 🔒 Important: If Those Were Real Keys

If the keys that were in the example files were **actual production keys**, you **MUST rotate them immediately**:

### 1. Rotate Supabase Keys

**For Development Project:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your development project
3. Go to **Settings** → **API**
4. Click **"Reset"** or **"Rotate"** for:
   - Service Role Key (⚠️ Most critical - this bypasses RLS)
   - Anon Key (if you want to rotate it)

**For Production Project:**
1. Select your production project
2. Go to **Settings** → **API**
3. **IMMEDIATELY** rotate the Service Role Key
4. Update the key in:
   - Vercel environment variables
   - Any other places where it's used

### 2. Rotate Resend API Keys

**For Development:**
1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Find the API key that was exposed
3. Click **"Revoke"** or **"Delete"**
4. Create a new API key
5. Update in your `.env.local` file

**For Production:**
1. Go to Resend Dashboard
2. **IMMEDIATELY** revoke the exposed production key
3. Create a new production API key
4. Update in Vercel environment variables

### 3. Update All Places Using These Keys

- ✅ `.env.local` (local development)
- ✅ Vercel environment variables (production)
- ✅ Any CI/CD pipelines
- ✅ Any other services using these keys

## ✅ What Was Fixed

1. **Replaced real keys with placeholders** in example files
2. **Committed and pushed** the fix to GitHub
3. **GitHub alerts should clear** after the next scan (usually within a few hours)

## 🛡️ Prevention for Future

### Best Practices

1. **Never commit real keys:**
   - ✅ Use `.env.local` for real keys (already in `.gitignore`)
   - ✅ Use `.env*.example` files with clear placeholders
   - ✅ Double-check before committing

2. **Use clear placeholders:**
   ```env
   # ❌ BAD - Looks like real key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # ✅ GOOD - Clearly a placeholder
   SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key-here-replace-with-actual-key
   ```

3. **Verify before pushing:**
   ```bash
   # Check what you're about to commit
   git diff --cached
   
   # Search for potential secrets
   git diff --cached | grep -i "eyJ\|re_\|sk_"
   ```

4. **Use GitHub Secret Scanning:**
   - GitHub automatically scans for secrets
   - Set up alerts in repository settings
   - Review alerts immediately

## 📋 Checklist

If keys were exposed:

- [ ] Rotate Supabase Service Role Key (dev)
- [ ] Rotate Supabase Service Role Key (prod) ⚠️ **CRITICAL**
- [ ] Rotate Resend API Key (dev)
- [ ] Rotate Resend API Key (prod) ⚠️ **CRITICAL**
- [ ] Update `.env.local` with new keys
- [ ] Update Vercel environment variables
- [ ] Verify application still works
- [ ] Monitor for unauthorized access
- [ ] Check Supabase logs for suspicious activity
- [ ] Check Resend logs for unauthorized usage

## 🔍 How to Check if Keys Were Real

1. **Supabase Keys:**
   - Check if the project ID in the key matches your projects
   - If yes, they're real and need rotation

2. **Resend Keys:**
   - Check if the key format matches your actual keys
   - If yes, they're real and need rotation

## 📞 Need Help?

- **Supabase Support:** https://supabase.com/support
- **Resend Support:** https://resend.com/support
- **GitHub Security:** https://docs.github.com/en/code-security

---

**Remember:** When in doubt, **rotate the keys**. It's better to be safe than sorry!

**Last Updated:** After security fix
**Status:** ✅ Fixed in repository

