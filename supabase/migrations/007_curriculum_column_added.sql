-- Migration: Ensure curriculum column exists on activities table
-- Created: 2026-04-29
-- Purpose: Add curriculum column to activities table if not already present
-- Column definition: TEXT, optional, default NULL

-- Idempotent add: Only adds the column if it doesn't exist
ALTER TABLE activities ADD COLUMN IF NOT EXISTS curriculum TEXT;

-- Create index for curriculum lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_activities_curriculum ON activities(curriculum);

-- Update the comment to document the column
COMMENT ON COLUMN activities.curriculum IS 'Name of the curriculum or educational resource used (e.g., Math Mammoth, Khan Academy, IXL, Outschool, Textbook)';
