-- Add topic column to activities table
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS topic TEXT;

-- Create index on topic for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_topic ON activities(topic);
