-- Add phone_number column to users table
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- Create index for phone number lookups (used in SMS gateway)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Comment for clarity
COMMENT ON COLUMN users.phone_number IS 'User phone number in E.164 format (+15551234567) for SMS gateway integration';
