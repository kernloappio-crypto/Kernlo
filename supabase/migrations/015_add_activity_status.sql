-- Add status and raw_input columns to activities table for review layer
-- status: 'pending' (AI-logged via NLP) or 'confirmed' (manual Quick Log)
-- raw_input: original text input from parent for audit trail

ALTER TABLE activities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS raw_input TEXT;

-- Add check constraint to enforce valid status values
ALTER TABLE activities ADD CONSTRAINT check_valid_status CHECK (status IN ('pending', 'confirmed'));

-- Create index for status queries (useful for review workflow)
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);

-- Create index for user_id + status (common filter pattern)
CREATE INDEX IF NOT EXISTS idx_activities_user_status ON activities(user_id, status);

-- Add comments for clarity
COMMENT ON COLUMN activities.status IS 'Activity status: pending (awaiting review) or confirmed (validated/manual)';
COMMENT ON COLUMN activities.raw_input IS 'Original text input from parent for audit trail and AI correction';
