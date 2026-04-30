-- Migration: Add completion tracking for activities
-- Created: 2026-04-30
-- Purpose: Track which activities have been marked as completed

-- Add is_completed column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Add is_completed column to extracurricular_activities table
ALTER TABLE extracurricular_activities ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Add is_completed column to field_trips table
ALTER TABLE field_trips ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Create indexes for completion queries
CREATE INDEX IF NOT EXISTS idx_activities_is_completed ON activities(is_completed);
CREATE INDEX IF NOT EXISTS idx_extracurricular_is_completed ON extracurricular_activities(is_completed);
CREATE INDEX IF NOT EXISTS idx_field_trips_is_completed ON field_trips(is_completed);
