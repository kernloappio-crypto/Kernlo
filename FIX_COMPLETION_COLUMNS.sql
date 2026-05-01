-- ============================================================
-- CRITICAL FIX: Add missing is_completed columns to activity tables
-- ============================================================
-- ISSUE: Complete button shows visually but doesn't save to database
-- ROOT CAUSE: is_completed column does not exist on:
--   - activities
--   - extracurricular_activities  
--   - field_trips
-- 
-- SOLUTION: Run this SQL in Supabase SQL Editor
-- ============================================================

-- Step 1: Add is_completed column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Step 2: Add is_completed column to extracurricular_activities table
ALTER TABLE extracurricular_activities 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Step 3: Add is_completed column to field_trips table
ALTER TABLE field_trips 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Step 4: Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_activities_is_completed 
  ON activities(is_completed);

CREATE INDEX IF NOT EXISTS idx_extracurricular_is_completed 
  ON extracurricular_activities(is_completed);

CREATE INDEX IF NOT EXISTS idx_field_trips_is_completed 
  ON field_trips(is_completed);

-- Step 5: Verify columns were created (this will display in the Results tab)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('activities', 'extracurricular_activities', 'field_trips')
  AND column_name = 'is_completed'
ORDER BY table_name;

-- ============================================================
-- After running this script:
-- 1. The Complete button will now save to the database
-- 2. Attendance will be logged when you complete an activity
-- 3. Refresh the app to see changes take effect
-- ============================================================
