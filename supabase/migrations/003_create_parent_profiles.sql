-- Kernlo Migration: Create Parent Profiles table
-- Created: 2026-04-28

-- 1. Create parent_profiles table
CREATE TABLE IF NOT EXISTS parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  home_school_name TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_profiles_user_id ON parent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_profiles_email ON parent_profiles(email);

-- 3. Enable RLS on parent_profiles table
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for parent_profiles
CREATE POLICY "Users can read own parent profile" ON parent_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own parent profile" ON parent_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own parent profile" ON parent_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own parent profile" ON parent_profiles
  FOR DELETE USING (user_id = auth.uid());
