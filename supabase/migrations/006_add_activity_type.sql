-- Migration: Add activity_type constraint to activities table
-- Created: 2026-04-29
-- Purpose: Add CHECK constraint to enforce valid activity_type values
-- Note: activity_type column was added in 002_add_attendance_curriculum_activity_type.sql
--       This migration adds validation constraints

-- Add a CHECK constraint to ensure only valid activity types are stored
-- Allowed values: 'Core Subject', 'Extracurricular', 'Field Trip / Enrichment'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'activities' AND constraint_name = 'check_activity_type'
  ) THEN
    ALTER TABLE activities
    ADD CONSTRAINT check_activity_type CHECK (
      activity_type IN ('Core Subject', 'Extracurricular', 'Field Trip', 'Field Trip / Enrichment')
    );
  END IF;
END $$;
