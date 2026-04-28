-- Migration: Add activity_type constraint to activities table
-- Created: 2026-04-29
-- Purpose: Add CHECK constraint to enforce valid activity_type values
-- Note: activity_type column was added in 002_add_attendance_curriculum_activity_type.sql
--       This migration adds validation constraints

-- First, ensure the column exists with correct default (idempotent)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS activity_type TEXT DEFAULT 'Core Subject';

-- Then add the CHECK constraint to ensure only valid activity types are stored
-- Allowed values: 'Core Subject', 'Extracurricular', 'Field Trip', 'Field Trip / Enrichment'
ALTER TABLE activities ADD CONSTRAINT check_activity_type CHECK (
  activity_type IN ('Core Subject', 'Extracurricular', 'Field Trip', 'Field Trip / Enrichment')
) NOT VALID;

-- Validate constraint (does not check existing rows, only new ones)
ALTER TABLE activities VALIDATE CONSTRAINT check_activity_type;
