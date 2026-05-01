-- ====================================================================
-- KERNLO: Add is_completed tracking to all activity tables
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/tyzvhpyrghqayuqchwra/sql/new
-- ====================================================================

-- Step 1: Add is_completed columns
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE extracurricular_activities ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE field_trips ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_is_completed ON activities(is_completed);
CREATE INDEX IF NOT EXISTS idx_extracurricular_is_completed ON extracurricular_activities(is_completed);
CREATE INDEX IF NOT EXISTS idx_field_trips_is_completed ON field_trips(is_completed);

-- Step 3: Ensure RLS policies allow UPDATE operations
CREATE POLICY IF NOT EXISTS "Users can update own activities" ON activities
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update own extracurricular activities" ON extracurricular_activities
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update own field trips" ON field_trips
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 4: Verify the columns were created successfully
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

-- Expected output: 3 rows, all with is_completed as boolean, default false
