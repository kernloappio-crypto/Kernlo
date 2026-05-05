-- Kernlo Migration: Add Compliance State to Parent Profiles
-- Created: 2026-05-05
-- Description: Add compliance_state field to parent_profiles table to store state of residence

-- 1. Add compliance_state column to parent_profiles table
ALTER TABLE parent_profiles
ADD COLUMN IF NOT EXISTS compliance_state TEXT;

-- 2. Create index for compliance_state lookups
CREATE INDEX IF NOT EXISTS idx_parent_profiles_compliance_state ON parent_profiles(compliance_state);

-- 3. Update RLS policy (no change needed - existing policies cover all columns)

-- 4. Add comment for documentation
COMMENT ON COLUMN parent_profiles.compliance_state IS 'State of residence for homeschool compliance tracking (e.g., "California", "CA", "TX")';
