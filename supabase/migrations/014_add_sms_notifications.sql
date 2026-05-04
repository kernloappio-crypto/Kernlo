-- Add SMS notifications enabled column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT FALSE;

-- Create index for SMS notifications lookup
CREATE INDEX IF NOT EXISTS idx_users_sms_notifications_enabled ON users(sms_notifications_enabled);

-- Comment for clarity
COMMENT ON COLUMN users.sms_notifications_enabled IS 'Enable/disable SMS notifications for activity confirmations';
