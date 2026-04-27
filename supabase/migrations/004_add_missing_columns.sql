-- Add missing columns to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS curriculum TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'Core Subject';

-- Add missing columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for faster activity_type queries
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_curriculum ON activities(curriculum);
