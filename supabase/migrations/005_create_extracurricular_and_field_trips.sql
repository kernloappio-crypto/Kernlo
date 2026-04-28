-- Migration: Create extracurricular_activities and field_trips tables with RLS
-- Created: 2026-04-29

-- Extracurricular Activities Table
CREATE TABLE IF NOT EXISTS extracurricular_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Field Trips Table
CREATE TABLE IF NOT EXISTS field_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_extracurricular_kid_id ON extracurricular_activities(kid_id);
CREATE INDEX IF NOT EXISTS idx_extracurricular_user_id ON extracurricular_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_extracurricular_date ON extracurricular_activities(date);
CREATE INDEX IF NOT EXISTS idx_field_trips_kid_id ON field_trips(kid_id);
CREATE INDEX IF NOT EXISTS idx_field_trips_user_id ON field_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_field_trips_date ON field_trips(date);

-- Enable RLS
ALTER TABLE extracurricular_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_trips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for extracurricular_activities
CREATE POLICY "Users can view own extracurricular_activities" 
  ON extracurricular_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extracurricular_activities" 
  ON extracurricular_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own extracurricular_activities" 
  ON extracurricular_activities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own extracurricular_activities" 
  ON extracurricular_activities FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for field_trips
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
