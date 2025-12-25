# Terms & Privacy Policy Deployment Guide

## ✅ Current Status

- ✅ Feature branch created: `feature/update-terms-privacy-policy`
- ✅ Changes committed and pushed to remote
- ✅ Files updated:
  - `app/terms/page.tsx` - Updated Terms & Conditions (December 21, 2025)
  - `app/privacy/page.tsx` - Updated Privacy Policy (December 21, 2025)

## 📋 Step-by-Step Deployment Process

### Step 1: Review Changes (Optional but Recommended)

Before merging, you can review the changes:

```powershell
# View the changes in the feature branch
git log feature/update-terms-privacy-policy --oneline

# Compare with main branch
git diff main..feature/update-terms-privacy-policy
```

### Step 2: Create Pull Request (Recommended Method)

**Option A: Using GitHub Web Interface (Recommended)**

1. Visit the GitHub repository: https://github.com/SasikumarSubbaian/ExpiryCare
2. You should see a banner suggesting to create a pull request, or click "Pull requests" → "New pull request"
3. Select:
   - **Base branch:** `main` (or `master`)
   - **Compare branch:** `feature/update-terms-privacy-policy`
4. Review the changes
5. Add a title: "Update Terms & Conditions and Privacy Policy - December 21, 2025"
6. Add description if needed
7. Click "Create pull request"
8. Review and merge the pull request

**Option B: Using Git Command Line**

```powershell
# Switch to main branch
git checkout main

# Pull latest changes from remote
git pull origin main

# Merge the feature branch
git merge feature/update-terms-privacy-policy

# Push to main
git push origin main
```

### Step 3: Deploy to Production

#### If using Vercel (Recommended for Next.js):

**Automatic Deployment:**
- If your repository is connected to Vercel, it will automatically deploy when you push to `main`
- Check your Vercel dashboard: https://vercel.com/dashboard

**Manual Deployment (if needed):**
```powershell
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy to production
vercel --prod
```

#### If using other hosting platforms:

**Netlify:**
- Automatic deployment if connected to GitHub
- Or use: `netlify deploy --prod`

**Other platforms:**
- Follow your platform's deployment instructions
- Usually involves pushing to main branch or triggering a deployment manually

### Step 4: Validate the Deployment

#### 4.1 Check Pages are Accessible

Visit these URLs on your production site:

1. **Terms & Conditions:**
   ```
   https://www.expirycare.com/terms
   ```
   - ✅ Page loads without errors
   - ✅ Header shows "Terms & Conditions"
   - ✅ Date shows "Updated at December 21st, 2025"
   - ✅ All sections are visible and properly formatted
   - ✅ Contact information is correct

2. **Privacy Policy:**
   ```
   https://www.expirycare.com/privacy
   ```
   - ✅ Page loads without errors
   - ✅ Header shows "Privacy Policy"
   - ✅ Date shows "Updated at December 21st, 2025"
   - ✅ All sections are visible and properly formatted
   - ✅ Contact information is correct

#### 4.2 Visual Validation Checklist

- [ ] Page layout matches the design
- [ ] Text is readable and properly formatted
- [ ] Links (email, phone, website) are clickable and work
- [ ] "Back to home" button works
- [ ] "Return to Home" button works
- [ ] Mobile responsive (test on phone/tablet)
- [ ] No console errors (check browser DevTools)

#### 4.3 Content Validation Checklist

**Terms & Conditions:**
- [ ] All sections are present (General Terms, License, Definitions, etc.)
- [ ] Contact information matches: Welcome@expirycare.com, +91 6369574440
- [ ] Website URL: https://www.expirycare.com/
- [ ] Company address: 13 Cross Street, Ramapuram, Neary DLF, Chennai - 600089

**Privacy Policy:**
- [ ] All sections are present (Definitions, What Information Do We Collect, etc.)
- [ ] GDPR section is present
- [ ] California Residents section is present
- [ ] CalOPPA section is present
- [ ] Contact information matches: Welcome@expirycare.com, +91 6369574440
- [ ] Website URL: https://www.expirycare.com/

#### 4.4 Technical Validation

**Check Browser Console:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Visit both pages
4. Ensure no JavaScript errors appear

**Check Network Tab:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Visit both pages
4. Ensure all resources load successfully (status 200)

**Check Page Speed:**
- Use Google PageSpeed Insights: https://pagespeed.web.dev/
- Enter your page URLs
- Ensure good performance scores

### Step 5: Post-Deployment Verification

#### 5.1 Test Links from Homepage

1. Visit your homepage: https://www.expirycare.com/
2. Click on "Privacy Policy" link in footer
3. Click on "Terms & Conditions" link in footer
4. Verify both links work correctly

#### 5.2 Test OAuth Integration (if applicable)

If you're using OAuth (Google, etc.), verify that:
- Privacy Policy URL is correctly referenced: `https://www.expirycare.com/privacy`
- Terms of Service URL is correctly referenced: `https://www.expirycare.com/terms`
- OAuth providers can access these pages

#### 5.3 SEO Validation

1. Check that pages are indexed (if needed):
   ```
   site:expirycare.com/terms
   site:expirycare.com/privacy
   ```

2. Verify meta tags (if you add them later):
   - Title tags
   - Description tags
   - Open Graph tags

## 🔄 Rollback Plan (If Needed)

If something goes wrong, you can rollback:

```powershell
# Switch to main branch
git checkout main

# Find the commit before the merge
git log --oneline

# Reset to previous commit (replace COMMIT_HASH with actual hash)
git reset --hard COMMIT_HASH

# Force push (be careful!)
git push origin main --force
```

Or revert the specific commit:
```powershell
# Revert the merge commit
git revert -m 1 MERGE_COMMIT_HASH
git push origin main
```

## 📝 Additional Notes

### For Future Updates

When you need to update these pages again:

1. Create a new feature branch:
   ```powershell
   git checkout -b feature/update-terms-privacy-YYYY-MM-DD
   ```

2. Make your changes

3. Commit and push:
   ```powershell
   git add app/terms/page.tsx app/privacy/page.tsx
   git commit -m "Update Terms & Privacy Policy - [Date]"
   git push origin feature/update-terms-privacy-YYYY-MM-DD
   ```

4. Create pull request and merge

### Quick Commands Reference

```powershell
# View current branch
git branch

# View status
git status

# View recent commits
git log --oneline -5

# Switch branches
git checkout main
git checkout feature/update-terms-privacy-policy

# Pull latest changes
git pull origin main

# View differences
git diff main..feature/update-terms-privacy-policy
```

## ✅ Success Criteria

Your deployment is successful when:

- ✅ Both pages load without errors
- ✅ All content is visible and properly formatted
- ✅ Links work correctly
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Pages accessible from homepage footer links
- ✅ Contact information is correct
- ✅ Date shows "Updated at December 21st, 2025"

## 🆘 Troubleshooting

### Issue: Pages show 404 error
**Solution:** 
- Check that files exist: `app/terms/page.tsx` and `app/privacy/page.tsx`
- Verify Next.js routing is working
- Check Vercel/build logs for errors

### Issue: Styling looks broken
**Solution:**
- Check that Tailwind CSS is properly configured
- Verify all CSS classes are correct
- Check browser console for CSS errors

### Issue: Contact links don't work
**Solution:**
- Verify email format: `mailto:Welcome@expirycare.com`
- Verify phone format: `tel:+916369574440`
- Test links in browser

### Issue: Deployment fails
**Solution:**
- Check Vercel/build logs
- Verify all dependencies are installed
- Check for TypeScript/ESLint errors
- Run `npm run build` locally to test

---

**Need Help?** Contact: Welcome@expirycare.com or +91 6369574440

