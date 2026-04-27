-- Kernlo Migration: Create Courses table + Add Transcript fields
-- Created: 2026-04-28
-- Purpose: Enable homeschool transcript generation

-- 1. Add fields to kids table
ALTER TABLE kids ADD COLUMN IF NOT EXISTS graduation_date DATE;

-- 2. Ensure parent_profiles has homeschool_name field
-- Note: This may already exist as 'home_school_name' from migration 003
-- If neither exists, add it as homeschool_name for consistency
ALTER TABLE parent_profiles ADD COLUMN IF NOT EXISTS homeschool_name TEXT;

-- 3. Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  description TEXT,
  credits DECIMAL(3, 1) NOT NULL DEFAULT 0.5,
  grade TEXT NOT NULL, -- "A", "B", "C", "D", "F"
  hours DECIMAL(5, 2), -- Instructional hours (optional, used by FL, NY)
  semester TEXT NOT NULL, -- "Fall 2025", "Spring 2026", etc.
  year INTEGER NOT NULL, -- 2025, 2026, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_kid_id ON courses(kid_id);
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_year_semester ON courses(year, semester);

-- 5. Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for courses
-- Users can only read/edit their own courses (via user_id)
CREATE POLICY "Users can read own courses" ON courses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (user_id = auth.uid());
