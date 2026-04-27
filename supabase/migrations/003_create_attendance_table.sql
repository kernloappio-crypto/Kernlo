-- Create attendance tracking table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  schooling_date DATE NOT NULL,
  schooled_today BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, child_name, schooling_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_child_name ON attendance(child_name);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(schooling_date);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own attendance" ON attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON attendance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own attendance" ON attendance FOR DELETE USING (auth.uid() = user_id);
