# Production SQL Migrations Required

## ✅ Deployment Fix Status

**Latest Commit:** `9cfbb06` - Fixed `canChooseFile` export issue  
**Status:** Code changes pushed, deployment should succeed

## 📋 SQL Migrations to Run in Production

### Required Migrations (in order):

#### 1. Core Schema (002_core_schema.sql)
**Status:** ✅ Should already be run  
**Purpose:** Creates `life_items` table with `document_url` column  
**Action:** Verify this migration has been run. If not, run it.

#### 2. Update Categories (003_update_categories.sql)
**Status:** ⚠️ **REQUIRED** - May need to run  
**Purpose:** Updates category constraint to include 'amc' and 'other'  
**Action:** Check if your `life_items` table allows 'amc' and 'other' categories. If not, run this migration.

#### 3. User Plans (003_user_plans.sql)
**Status:** ✅ Should already be run  
**Purpose:** Creates `user_plans` table for plan management  
**Action:** Verify this exists.

#### 4. Storage Setup (004_storage_setup.sql)
**Status:** ⚠️ **REQUIRED** for document uploads  
**Purpose:** Sets up Supabase Storage bucket for document uploads  
**Action:** Run if document uploads are not working.

#### 5. RLS Policies (011_ensure_rls_policies_production.sql)
**Status:** ⚠️ **REQUIRED**  
**Purpose:** Ensures proper Row Level Security policies  
**Action:** Run to ensure data security.

### Quick Check Script

Run this in Supabase SQL Editor to check your current schema:

```sql
-- Check if life_items table exists and has document_url
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'life_items' 
AND column_name = 'document_url';

-- Check category constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%category%';

-- Check if user_plans table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'user_plans';
```

### Migration Execution Order

1. **002_core_schema.sql** - Core tables (if not already run)
2. **003_update_categories.sql** - Add 'amc' and 'other' categories ⚠️
3. **003_user_plans.sql** - User plans table (if not already run)
4. **004_storage_setup.sql** - Storage bucket for documents ⚠️
5. **011_ensure_rls_policies_production.sql** - RLS policies ⚠️

### Critical: Category Update

The `life_items` table must allow these categories:
- 'warranty'
- 'insurance'
- 'medicine'
- 'subscription'
- **'amc'** ⚠️ (may be missing)
- **'other'** ⚠️ (may be missing)

If the constraint doesn't include 'amc' and 'other', run `003_update_categories.sql`.

---

**Note:** All migrations are idempotent (safe to run multiple times).

