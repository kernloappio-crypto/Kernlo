-- Migration: Create extracurricular_activities table with RLS
-- Date: 2026-04-30

CREATE TABLE IF NOT EXISTS extracurricular_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_extracurricular_activities_user_id ON extracurricular_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_extracurricular_activities_kid_id ON extracurricular_activities(kid_id);
CREATE INDEX IF NOT EXISTS idx_extracurricular_activities_date ON extracurricular_activities(date);

-- Enable RLS
ALTER TABLE extracurricular_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own extracurricular activities
CREATE POLICY "Users can view own extracurricular_activities" 
  ON extracurricular_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extracurricular_activities" 
  ON extracurricular_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own extracurricular_activities" 
  ON extracurricular_activities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own extracurricular_activities" 
  ON extracurricular_activities FOR DELETE
  USING (auth.uid() = user_id);
