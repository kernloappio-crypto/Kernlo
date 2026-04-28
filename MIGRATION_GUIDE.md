# Database Migration Guide

## Current State

### Migration: `006_add_activity_type`

**Status**: File created and committed to GitHub (2026-04-29)

**Purpose**: Add validation constraints to the `activity_type` column in the `activities` table

**Background**: The `activity_type` column was already added in migration `002_add_attendance_curriculum_activity_type.sql` (2026-04-24) with:
- Default value: `'Core Subject'`
- Allowed values: `'Core Subject'`, `'Extracurricular'`, `'Field Trip / Enrichment'`

Migration 006 adds a CHECK constraint to enforce these allowed values at the database level.

### SQL Changes
```sql
ALTER TABLE activities
ADD CONSTRAINT check_activity_type CHECK (
  activity_type IN ('Core Subject', 'Extracurricular', 'Field Trip', 'Field Trip / Enrichment')
);
```

---

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended for now)

1. Go to your Supabase project: [https://app.supabase.com](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Copy the SQL from `/supabase/migrations/006_add_activity_type.sql`
5. Click **"Run"** to execute the migration
6. Verify the constraint was added (see Verification section below)

### Option 2: Using Supabase CLI (When installed)

```bash
# Ensure you're in the project directory
cd /path/to/kernlo

# Push migrations to your Supabase database
supabase db push
```

This will automatically detect new migrations and apply them in order.

### Option 3: Manual PostgreSQL Connection

If you have direct database access:

```bash
psql $SUPABASE_DATABASE_URL < supabase/migrations/006_add_activity_type.sql
```

Where `$SUPABASE_DATABASE_URL` is your Supabase connection string (found in Project Settings > Database).

---

## Verification Steps

After applying the migration, verify the constraint was added:

### Check 1: Verify Constraint Exists
```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'activities' AND constraint_name = 'check_activity_type';
```

**Expected Result**: One row showing `check_activity_type` constraint.

### Check 2: Verify Existing Data
```sql
SELECT DISTINCT activity_type FROM activities;
```

**Expected Result**: Should show values like `'Core Subject'`, `'Extracurricular'`, `'Field Trip / Enrichment'` (or NULL if any records don't have the value set).

### Check 3: Test Constraint (This should FAIL)
```sql
-- This should fail due to the CHECK constraint
INSERT INTO activities (user_id, child_name, subject, duration, date, activity_type) 
VALUES (gen_random_uuid(), 'Test', 'Math', 1.0, NOW(), 'Invalid Type');
```

**Expected Result**: Error message indicating constraint violation.

### Check 4: Test Valid Insert (This should SUCCEED)
```sql
-- This should succeed
INSERT INTO activities (user_id, child_name, subject, duration, date, activity_type) 
VALUES (gen_random_uuid(), 'Test', 'Math', 1.0, NOW(), 'Extracurricular');
```

**Expected Result**: 1 row inserted successfully.

---

## Rollback (If Needed)

If the migration needs to be rolled back:

```sql
ALTER TABLE activities DROP CONSTRAINT check_activity_type;
```

This removes the constraint but keeps the column and data intact.

---

## Current Database State

- **Table**: `activities`
- **Column Added**: `activity_type` (TEXT, DEFAULT: `'Core Subject'`)
- **Migration Status**: ✅ File created and pushed to GitHub (applying to production next)
- **Related Tables**: 
  - `extracurricular_activities` (separate table for detailed extracurricular tracking)
  - `field_trips` (separate table for field trips)

---

## Related Documentation

- Full schema: `/supabase/schema.sql`
- Previous migrations: `/supabase/migrations/`
- Activities table primary migration: `/supabase/migrations/002_add_attendance_curriculum_activity_type.sql`
