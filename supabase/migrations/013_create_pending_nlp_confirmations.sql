-- Create pending NLP confirmations table for SMS workflow
CREATE TABLE IF NOT EXISTS pending_nlp_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL,
  parsed_data JSONB NOT NULL,
  confirmation_step TEXT NOT NULL CHECK (confirmation_step IN ('awaiting_platform', 'awaiting_confirmation')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_pending_per_user UNIQUE(user_id, message_id)
);

-- Enable RLS
ALTER TABLE pending_nlp_confirmations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own pending confirmations" ON pending_nlp_confirmations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending confirmations" ON pending_nlp_confirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending confirmations" ON pending_nlp_confirmations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending confirmations" ON pending_nlp_confirmations
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_nlp_user_id ON pending_nlp_confirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_nlp_created_at ON pending_nlp_confirmations(created_at);

-- Add comment
COMMENT ON TABLE pending_nlp_confirmations IS 'Temporary records for SMS-based NLP activity logging workflow; auto-expires after 5 minutes via cleanup job';
COMMENT ON COLUMN pending_nlp_confirmations.parsed_data IS 'JSONB containing {student, subject, minutes, note, platform, confidence}';
