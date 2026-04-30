-- Migration: Complete Attendance Table Setup
-- Purpose: Create attendance table with proper RLS policies
-- Date: 2026-04-30
-- Note: This is a critical fix - the attendance table was missing from the schema

-- Step 1: Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  schooling_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, child_name, schooling_date)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_child_name ON attendance(child_name);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(schooling_date);

-- Step 3: Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (safe idempotent approach)
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can delete own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can read own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance;

-- Step 5: Create RLS policies
CREATE POLICY "Users can view own attendance" ON attendance 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance" ON attendance 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attendance" ON attendance 
  FOR DELETE USING (auth.uid() = user_id);

-- Verification query (logs results to show migration success)
SELECT 
  COUNT(*) as attendance_table_exists,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'attendance') as indexes_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'attendance';
