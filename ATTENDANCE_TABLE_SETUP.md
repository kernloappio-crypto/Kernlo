# 🚨 CRITICAL: Attendance Table Missing

## Status
✅ **PROBLEM CONFIRMED:** The attendance table **does NOT exist** in your Supabase database.

**Evidence:**
- Error: "Could not find the table 'public.attendance' in the schema cache"
- Migration file exists: `004_create_attendance_table.sql`
- BUT: It was never applied to the actual database

**Impact:**
- logAttendance() fails with table not found error
- "Log Day" button crashes with database error
- Cannot track school attendance

## Solution
Copy and paste the SQL below into your **Supabase SQL Editor** and run it:

### Step 1: Go to Supabase Console
- Visit: https://supabase.com/dashboard
- Select your project: `kernlo`
- Click **SQL Editor** in the left sidebar
- Click **New Query**

### Step 2: Run This SQL

```sql
-- Create attendance tracking table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  schooling_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, child_name, schooling_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_child_name ON attendance(child_name);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(schooling_date);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can delete own attendance" ON attendance;

-- Create RLS policies
CREATE POLICY "Users can view own attendance" ON attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own attendance" ON attendance FOR DELETE USING (auth.uid() = user_id);
```

### Step 3: Verify Success
You should see messages like:
```
CREATE TABLE
CREATE INDEX
ALTER TABLE
DROP POLICY (x3)
CREATE POLICY (x3)
```

### Step 4: Test
1. Go to your kernlo dashboard
2. Click on a child's profile
3. Navigate to Compliance page
4. Enter a date and click **"✓ Log Day"**
5. Should see: **"Attendance recorded!"**

## Troubleshooting

### Error: "Relation 'users' does not exist"
This means the `users` table doesn't exist. The migrations need to be applied in order:
1. `001_create_schema.sql`
2. `002_schema_updates.sql`
3. `003_create_courses_table.sql` / `003b_create_parent_profiles.sql`
4. Then this migration

### Error: "Column 'user_id' doesn't exist in attendance"
The RLS policy syntax is wrong. Ensure `user_id` is the correct column name (it is).

### Error: "auth.uid() is not defined"
This is normal - it means the RLS policy is correct. Test by logging in and trying again.

## Reference Files
- Migration file: `/supabase/migrations/004_create_attendance_table.sql`
- Schema definition: `/supabase/schema.sql`
- Function using it: `/lib/supabase-data.ts` (function `logAttendance`)
