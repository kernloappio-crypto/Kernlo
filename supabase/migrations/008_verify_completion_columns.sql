-- Migration: Verify completion tracking columns exist
-- Purpose: Ensure is_completed columns exist on all tables
-- Safe: Uses IF NOT EXISTS clauses, idempotent

-- Add is_completed column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Add is_completed column to extracurricular_activities table
ALTER TABLE extracurricular_activities 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Add is_completed column to field_trips table
ALTER TABLE field_trips 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_activities_is_completed ON activities(is_completed);
CREATE INDEX IF NOT EXISTS idx_extracurricular_is_completed ON extracurricular_activities(is_completed);
CREATE INDEX IF NOT EXISTS idx_field_trips_is_completed ON field_trips(is_completed);

-- Ensure RLS policies allow UPDATE operations
-- (These should already exist from schema.sql, but verify)

-- For activities table
CREATE POLICY IF NOT EXISTS "Users can update own activities" ON activities
  FOR UPDATE USING (user_id = auth.uid());

-- For extracurricular_activities table
CREATE POLICY IF NOT EXISTS "Users can update own extracurricular activities" ON extracurricular_activities
  FOR UPDATE USING (user_id = auth.uid());

-- For field_trips table
CREATE POLICY IF NOT EXISTS "Users can update own field trips" ON field_trips
  FOR UPDATE USING (user_id = auth.uid());

-- Verify the columns were created successfully
-- (These will be logged in migration output)
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
