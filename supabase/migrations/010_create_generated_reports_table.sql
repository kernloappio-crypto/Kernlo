-- Create generated_reports table for tracking all generated reports
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'comprehensive',
  date_range TEXT NOT NULL,
  date_generated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  file_path TEXT,
  file_url TEXT,
  selected_subjects JSONB,
  selected_activity_types JSONB,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own generated reports" ON generated_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generated reports" ON generated_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own generated reports" ON generated_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own generated reports" ON generated_reports FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_generated_reports_user_id ON generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_kid_id ON generated_reports(kid_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_date_generated ON generated_reports(date_generated DESC);
