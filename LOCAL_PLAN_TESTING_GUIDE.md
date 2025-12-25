# Local Plan Testing Guide

This guide explains how to test Pro and Family plan features locally in your development environment.

## ✅ Task 1: Fixed - Warranty Items Not Showing

**Issue:** Warranty items added manually were not showing in the Dashboard.

**Fix Applied:**
- Updated `ExpiryForm.tsx` to explicitly set `user_id` when inserting items
- Added plan limit checking to `AddItemModal.tsx` to prevent adding items when at limit
- Both forms now properly include `user_id` in the insert statement

**Note:** The main form used is `AddItemModal` which already had `user_id` set correctly. The fix ensures both forms work properly.

## 🧪 Task 2: Testing Pro and Family Plans Locally

### Step 1: Run Database Migration

First, create the `user_plans` table by running the migration:

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/003_user_plans.sql`
4. Click **Run** to execute the migration

Alternatively, if you have Supabase CLI:
```bash
supabase migration up
```

### Step 2: Access Plan Testing Page

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Log in to your application

3. Go to your Dashboard

4. In the Plan Display section, click the **"Test Plans"** button (only visible in development mode)

   OR navigate directly to: **http://localhost:3000/settings/plans**

   ⚠️ **Note:** This page is only available in development mode. It will not work in production.

### Step 3: Set Your Plan

1. On the plan testing page, you'll see three buttons:
   - **Free Plan** - Default plan (5 items max, no medicine, no documents)
   - **Pro Plan** - Unlimited items, medicine tracking, document upload
   - **Family Plan** - All Pro features + family sharing (up to 5 members)

2. Click on the plan you want to test (e.g., "Pro Plan")

3. You should see a success message

4. **Refresh the page** or go to Dashboard to see your plan updated

### Step 4: Test Plan Features

#### Testing Free Plan (Default)
- ✅ Can add up to 5 items
- ❌ Cannot add medicine items
- ❌ Cannot upload documents
- ❌ No family sharing

**Test:**
1. Set plan to "Free"
2. Try adding 6 items - should show error on 6th item
3. Try selecting "Medicine" category - should be disabled/hidden
4. Try uploading document - should show "requires Pro or Family plan" message

#### Testing Pro Plan
- ✅ Unlimited items
- ✅ Medicine tracking enabled
- ✅ Document upload enabled
- ❌ No family sharing

**Test:**
1. Set plan to "Pro"
2. Add more than 5 items - should work
3. Select "Medicine" category - should be available
4. Upload a document - should work
5. Check Dashboard - should show "Pro Plan" with all features enabled

#### Testing Family Plan
- ✅ Unlimited items
- ✅ Medicine tracking enabled
- ✅ Document upload enabled
- ✅ Family sharing (up to 5 members)

**Test:**
1. Set plan to "Family"
2. All Pro features should work
3. Check Dashboard - should show "Family Plan" section
4. Try adding family members (if that feature is implemented)

### Step 5: Verify Plan Limits

On the Dashboard, you should see:
- **Plan Display** showing your current plan
- **Item count** (e.g., "3 / 5" for Free, "3 / Unlimited" for Pro/Family)
- **Feature indicators** (✓ or ✗) for:
  - Medicine Tracking
  - Document Upload
  - Family Sharing

## 🔍 Troubleshooting

### Issue: Plan testing page shows "Access Denied"
**Solution:** Make sure you're running in development mode (`NODE_ENV !== 'production'`). The page is automatically disabled in production builds.

### Issue: "Table 'user_plans' doesn't exist" error
**Solution:** Run the migration `003_user_plans.sql` in your Supabase SQL Editor.

### Issue: Plan doesn't update after clicking
**Solution:** 
1. Check browser console for errors
2. Verify you're logged in
3. Refresh the page after setting plan
4. Check Supabase dashboard to verify the plan was saved

### Issue: Items still not showing after adding
**Solution:**
1. Check browser console for errors
2. Verify `user_id` is being set (check Network tab in DevTools)
3. Verify RLS policies are correct in Supabase
4. Try refreshing the Dashboard page

### Issue: Can't add items even with Pro plan
**Solution:**
1. Verify plan was saved correctly (check `user_plans` table in Supabase)
2. Check that `getUserPlan()` function is working
3. Verify Dashboard is reading plan correctly

## 📋 Quick Reference

### Plan Limits Summary

| Feature | Free | Pro | Family |
|---------|------|-----|--------|
| Max Items | 5 | Unlimited | Unlimited |
| Medicine Tracking | ❌ | ✅ | ✅ |
| Document Upload | ❌ | ✅ | ✅ |
| Family Sharing | ❌ | ❌ | ✅ (5 members) |
| Price | Free | ₹299/year | ₹499/year |

### SQL Commands for Manual Testing

If you want to manually set a plan via SQL:

```sql
-- Set user to Pro plan
INSERT INTO user_plans (user_id, plan, status, expires_at)
VALUES ('YOUR_USER_ID', 'pro', 'active', NOW() + INTERVAL '1 year')
ON CONFLICT (user_id) 
DO UPDATE SET plan = 'pro', status = 'active', expires_at = NOW() + INTERVAL '1 year';

-- Set user to Family plan
INSERT INTO user_plans (user_id, plan, status, expires_at)
VALUES ('YOUR_USER_ID', 'family', 'active', NOW() + INTERVAL '1 year')
ON CONFLICT (user_id) 
DO UPDATE SET plan = 'family', status = 'active', expires_at = NOW() + INTERVAL '1 year';

-- Reset to Free plan
DELETE FROM user_plans WHERE user_id = 'YOUR_USER_ID';
```

Replace `YOUR_USER_ID` with your actual user ID (found in Supabase Auth > Users).

## ✅ Testing Checklist

- [ ] Migration `003_user_plans.sql` executed successfully
- [ ] Can access `/dev/plans` page
- [ ] Can set plan to Free/Pro/Family
- [ ] Dashboard shows correct plan
- [ ] Free plan limits work (5 items max)
- [ ] Pro plan allows unlimited items
- [ ] Pro plan allows medicine tracking
- [ ] Pro plan allows document upload
- [ ] Family plan shows family sharing section
- [ ] Plan changes persist after page refresh
- [ ] Error messages show when limits are reached

## 🎯 Next Steps

After testing locally:
1. Test all plan features thoroughly
2. Verify error messages are user-friendly
3. Test edge cases (e.g., exactly 5 items on Free plan)
4. Test plan switching (Free → Pro → Family → Free)
5. Verify Dashboard updates correctly when plan changes

---

**Need Help?** Check the browser console for errors and verify your Supabase RLS policies are correctly configured.

