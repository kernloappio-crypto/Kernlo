-- Migration: Create field_trips table with RLS
-- Date: 2026-04-30

CREATE TABLE IF NOT EXISTS field_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  destination TEXT,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_field_trips_user_id ON field_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_field_trips_kid_id ON field_trips(kid_id);
CREATE INDEX IF NOT EXISTS idx_field_trips_date ON field_trips(date);

-- Enable RLS
ALTER TABLE field_trips ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own field trips
CREATE POLICY "Users can view own field_trips" 
  ON field_trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own field_trips" 
  ON field_trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own field_trips" 
  ON field_trips FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own field_trips" 
  ON field_trips FOR DELETE
  USING (auth.uid() = user_id);
