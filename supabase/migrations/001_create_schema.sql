-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  trial_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  trial_ended BOOLEAN NOT NULL DEFAULT FALSE,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create kids table
CREATE TABLE IF NOT EXISTS kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration NUMERIC NOT NULL,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  monthly_hours NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  generated_date DATE NOT NULL,
  subjects TEXT[] NOT NULL,
  report_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create compliance_state table
CREATE TABLE IF NOT EXISTS compliance_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users table policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Kids table policies
CREATE POLICY "Users can read own kids" ON kids FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kids" ON kids FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kids" ON kids FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own kids" ON kids FOR DELETE USING (auth.uid() = user_id);

-- Activities table policies
CREATE POLICY "Users can read own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON activities FOR DELETE USING (auth.uid() = user_id);

-- Goals table policies
CREATE POLICY "Users can read own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- Reports table policies
CREATE POLICY "Users can read own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON reports FOR DELETE USING (auth.uid() = user_id);

-- Compliance state table policies
CREATE POLICY "Users can read own compliance state" ON compliance_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own compliance state" ON compliance_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own compliance state" ON compliance_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own compliance state" ON compliance_state FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kids_user_id ON kids(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_state_user_id ON compliance_state(user_id);
