-- Create courses table for transcripts
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  description TEXT,
  credits NUMERIC NOT NULL DEFAULT 1,
  grade TEXT NOT NULL, -- "A", "B", "C", "D", "F"
  hours NUMERIC, -- optional total hours for the course
  semester TEXT NOT NULL, -- "Fall", "Spring", "Summer", "Winter", "Year-Round"
  year INTEGER NOT NULL, -- academic year (e.g., 2024, 2025)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_kid_id ON courses(kid_id);
CREATE INDEX IF NOT EXISTS idx_courses_year_semester ON courses(year, semester);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own courses" ON courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own courses" ON courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own courses" ON courses FOR DELETE USING (auth.uid() = user_id);

-- Also allow reading courses by kid_id when the kid belongs to the user
-- This is handled by the above policies since we check user_id on the courses table
