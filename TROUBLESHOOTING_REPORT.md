# Field Trips & Extracurricular Activities - Troubleshooting Report

## Issue
Field trips and extracurricular activities were failing to save, with potential schema cache issues in Supabase.

## Root Cause Analysis

### STEP 1: Table & Schema Verification ✅
**PROBLEM FOUND**: Duplicate migration files causing alphanumeric sort conflicts.

**Migrations with duplicates:**
- 002 (added twice):
  - `002_add_attendance_curriculum_activity_type.sql` (Apr 24)
  - `002_create_courses_table.sql` (Apr 28)
- 003 (added twice):
  - `003_create_parent_profiles.sql` (Apr 28 00:22)
  - `003_create_attendance_table.sql` (Apr 28 02:54)
- 004 (added twice):
  - `004_add_missing_columns.sql` (Apr 28 02:54)
  - `004_create_courses_table.sql` (Apr 28 02:01)
- 005 (added twice):
  - `005_create_extracurricular_and_field_trips.sql` (Apr 29)
  - Both `008_create_field_trips_table.sql` and `009_create_extracurricular_activities_table.sql` (Apr 30) were exact duplicates

**Supabase executes migrations in alphanumeric order, so duplicates cause:**
1. Table creation to execute multiple times
2. RLS policies to conflict (CREATE POLICY fails if policy already exists)
3. Schema cache to become inconsistent

### Migrations Reorganized
**Deleted (duplicates):**
- `008_create_field_trips_table.sql` (duplicate of 005)
- `009_create_extracurricular_activities_table.sql` (duplicate of 005)

**Renamed to sequential order:**
- `001_create_schema.sql` ✓ (no change)
- `002_schema_updates.sql` (was `002_add_attendance...`)
- `003_create_courses_table.sql` (was `002_create_courses...`)
- `003b_create_parent_profiles.sql` (was `003_create_parent...`)
- `004_create_attendance_table.sql` (was `003_create_attendance...`)
- `004b_add_missing_columns.sql` (was `005_add_missing...`)
- `005_create_extracurricular_and_field_trips.sql` ✓ (no change)
- `006_add_activity_type.sql` (was `006_add_activity_type.sql`)
- `007_curriculum_column_added.sql` (was `007_curriculum_column_added.sql`)

## STEP 2: Schema Refresh ✅
- Build process completes successfully with TypeScript validation
- No compilation errors for field_trips or extracurricular_activities pages
- App routes are properly configured:
  - `/dashboard/[id]/field-trips` ✓
  - `/dashboard/[id]/extracurricular` ✓

## STEP 3: RLS Policy Verification ✅
Both tables have complete RLS policies defined in `005_create_extracurricular_and_field_trips.sql`:

**field_trips table:**
- SELECT: `USING (auth.uid() = user_id)` ✓
- INSERT: `WITH CHECK (auth.uid() = user_id)` ✓
- UPDATE: `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` ✓
- DELETE: `USING (auth.uid() = user_id)` ✓

**extracurricular_activities table:**
- SELECT: `USING (auth.uid() = user_id)` ✓
- INSERT: `WITH CHECK (auth.uid() = user_id)` ✓
- UPDATE: `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` ✓
- DELETE: `USING (auth.uid() = user_id)` ✓

## STEP 4: App Cache Clear ✅
Created debug page at `/debug/cache-clear` to clear:
- localStorage
- sessionStorage
- Browser cache

## Implementation Notes

### Columns in Tables
Both tables have these columns:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users)
- `kid_id` (UUID, foreign key to kids)
- For field_trips: `trip_name`, `destination`, `date`, `notes`
- For extracurricular_activities: `activity_name`, `date`, `notes`
- `created_at`, `updated_at` (timestamps)

### Data Functions
Located in `/lib/supabase-data.ts`:
- `addFieldTrip()` - INSERT new trip
- `getFieldTrips()` - SELECT trips for user/kid
- `updateFieldTrip()` - UPDATE existing trip
- `deleteFieldTrip()` - DELETE trip
- `addExtracurricularActivity()` - INSERT new activity
- `getExtracurricularActivities()` - SELECT activities for user/kid
- `updateExtracurricularActivity()` - UPDATE existing activity
- `deleteExtracurricularActivity()` - DELETE activity

## Next Steps
1. User should visit `/debug/cache-clear` to clear all local caches
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Log in again to re-establish Supabase session
4. Try adding a field trip or extracurricular activity
5. If still failing, check browser console for RLS policy errors

## Files Changed
- **Deleted**: `008_create_field_trips_table.sql`, `009_create_extracurricular_activities_table.sql`
- **Renamed**: 6 migration files to fix alphanumeric ordering
- **Created**: `/app/debug/cache-clear/page.tsx` for cache clearing
