-- Kernlo Database Schema for Supabase
-- Created: 2026-04-12

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  trial_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  trial_ended BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Kids table
CREATE TABLE kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  grade TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration FLOAT NOT NULL, -- hours
  platform TEXT, -- Khan Academy, IXL, Outschool, etc.
  notes TEXT,
  curriculum TEXT, -- e.g., "Math Mammoth", "Khan Academy", "Outschool", "IXL", "Textbook"
  activity_type TEXT DEFAULT 'Core Subject', -- 'Core Subject', 'Extracurricular', 'Field Trip / Enrichment'
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  monthly_hours FLOAT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  report_type TEXT, -- 'comprehensive', 'monthly', etc.
  generated_date DATE NOT NULL,
  subjects TEXT[] NOT NULL, -- array of selected subjects
  report_content TEXT NOT NULL, -- the AI-generated report text
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Compliance state tracking
CREATE TABLE compliance_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state TEXT NOT NULL, -- 'CA', 'TX', 'FL', 'NY'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Attendance tracking (daily schooling days)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  schooling_date DATE NOT NULL,
  schooled_today BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, child_name, schooling_date)
);

-- Indexes for performance
CREATE INDEX idx_kids_user_id ON kids(user_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_activity_type ON activities(activity_type);
CREATE INDEX idx_activities_curriculum ON activities(curriculum);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_compliance_state_user_id ON compliance_state(user_id);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_child_name ON attendance(child_name);
CREATE INDEX idx_attendance_date ON attendance(schooling_date);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can read own kids" ON kids
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own kids" ON kids
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own kids" ON kids
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own kids" ON kids
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can read own activities" ON activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own activities" ON activities
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can read own goals" ON goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can read own reports" ON reports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reports" ON reports
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reports" ON reports
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can read own compliance_state" ON compliance_state
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own compliance_state" ON compliance_state
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own compliance_state" ON compliance_state
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can read own attendance" ON attendance
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own attendance" ON attendance
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own attendance" ON attendance
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own attendance" ON attendance
  FOR DELETE USING (user_id = auth.uid());
