-- Kernlo Migration: Add Attendance, Curriculum, and Activity Type tracking
-- Created: 2026-04-24

-- 1. Add curriculum field to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS curriculum TEXT;

-- 2. Add activity_type field to activities table (ENUM: 'Core Subject', 'Extracurricular', 'Field Trip / Enrichment')
ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'Core Subject';

-- 3. Create attendance table for daily tracking
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  schooling_date DATE NOT NULL,
  schooled_today BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, child_name, schooling_date)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_child_name ON attendance(child_name);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(schooling_date);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_curriculum ON activities(curriculum);

-- 5. Enable RLS on attendance table
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for attendance
CREATE POLICY "Users can read own attendance" ON attendance
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own attendance" ON attendance
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attendance" ON attendance
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own attendance" ON attendance
  FOR DELETE USING (user_id = auth.uid());
