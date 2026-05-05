# ⚡ URGENT: Apply Supabase Migration

## Status
✅ Code complete and deployed  
⏳ Database migration waiting for manual application

## What to Do (Takes 2 minutes)

### Step 1: Open Supabase
Go to: https://app.supabase.com

### Step 2: Select Kernlo Project
- Look for project: **Kernlo** (project_id: tyzvhpyrghqayuqchwra)
- Click to open

### Step 3: Navigate to SQL Editor
- Left sidebar → Click **"SQL Editor"**
- Top area → Click **"New Query"** (+ button)

### Step 4: Paste This SQL
```sql
-- Kernlo Migration: Add Compliance State to Parent Profiles
-- Created: 2026-05-05

-- 1. Add compliance_state column to parent_profiles table
ALTER TABLE parent_profiles
ADD COLUMN IF NOT EXISTS compliance_state TEXT;

-- 2. Create index for compliance_state lookups
CREATE INDEX IF NOT EXISTS idx_parent_profiles_compliance_state ON parent_profiles(compliance_state);

-- 3. Add comment for documentation
COMMENT ON COLUMN parent_profiles.compliance_state IS 'State of residence for homeschool compliance tracking (e.g., "California", "CA", "TX")';
```

### Step 5: Run Query
- Click **"RUN"** button (⚡ lightning bolt, top right)
- Wait for success message
- Should show: "Query executed successfully"

### Step 6: Verify
- Check that no errors appear
- Migration is complete!

## After Migration

✅ Parents can now:
- Open Profile (hamburger → 👤 Profile)
- See "State of Residence" dropdown
- Select their state (required field)
- Save profile
- See state tag on dashboard

✅ Dashboard shows:
- State tag below title
- Gray text, non-clickable
- Updates immediately after save
- Persists across sessions

## If You Get an Error

**Error: "column 'compliance_state' of relation 'parent_profiles' already exists"**
- Migration already applied ✅
- You can proceed with testing

**Any other error:**
- Copy the error message
- Check that you selected the correct project
- Verify you're in the SQL Editor (not Data Editor)
- Re-run the same query

## Questions?

This migration:
- Adds ONE new TEXT column
- Adds ONE index for performance
- Does NOT modify existing data
- Is safe to run multiple times (IF NOT EXISTS)
- Cannot break anything

---

**That's it!** Once migration is applied, everything works automatically.
