# Kernlo MVP - Deployment Guide

## Pre-Launch Deployment Steps

### 1. Database Migration
Execute the migration to add new tables and columns:

```bash
# Using Supabase CLI
supabase migration up --version 2

# OR manually run SQL:
# - Copy contents of supabase/migrations/002_add_attendance_curriculum_activity_type.sql
# - Execute in Supabase SQL editor
```

The migration adds:
- `curriculum` column to `activities` table
- `activity_type` column to `activities` table (default: 'Core Subject')
- `attendance` table with daily schooling tracking
- RLS policies for attendance table
- Indexes for performance

### 2. Build & Deploy

```bash
cd /data/.openclaw/workspace/kernlo

# Build production version
npm run build

# Test build
npm run start

# Deploy to production
# (Use your deployment platform: Vercel, Netlify, Railway, etc.)
```

### 3. Verify Features

After deployment, test each feature:

#### 1. Attendance Tracking
- Go to any kid's Compliance page
- Click "Record Attendance" section
- Log a date with "Yes, schooled today"
- Verify it appears in "Recent Attendance" list
- Check "Days completed this year" counter

#### 2. Curriculum Field
- Log an activity via Quick Log modal
- Fill in "Curriculum/Resource" field (e.g., "Math Mammoth")
- Save activity
- Verify curriculum appears in activity list with 📚 icon

#### 3. Extracurricular Logging
- Log an activity via Quick Log modal
- Select "Activity Type" dropdown
- Choose "Extracurricular (Music, Sports, Clubs)"
- Save activity
- Verify type appears as badge in activity list
- Check dashboard kid card for "Activity Breakdown" showing separate hours

### 4. Database Backup

Before migration, backup your production database:

```bash
# Supabase backup
supabase db pull

# Or use Supabase dashboard: Database → Backups
```

### 5. Monitor Post-Launch

Watch for:
- No TypeScript errors in production logs
- Activities endpoint returns new fields
- Attendance records persist correctly
- Activity type filters work in reports

---

## Rollback Plan (if needed)

If issues arise:

```sql
-- Remove migration (careful - data loss)
ALTER TABLE activities DROP COLUMN curriculum;
ALTER TABLE activities DROP COLUMN activity_type;
DROP TABLE attendance;
```

---

## Environment Variables

No new environment variables needed. Existing setup is sufficient:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Expected Database Changes

### New Table: `attendance`
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY,
  child_name TEXT NOT NULL,
  schooling_date DATE NOT NULL,
  schooled_today BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, child_name, schooling_date)
);
```

### Modified Table: `activities`
```sql
ALTER TABLE activities ADD COLUMN curriculum TEXT;
ALTER TABLE activities ADD COLUMN activity_type TEXT DEFAULT 'Core Subject';
```

---

## Performance Considerations

New indexes added:
- `idx_attendance_user_id` - Fast user lookups
- `idx_attendance_child_name` - Fast child lookups
- `idx_attendance_date` - Fast date range queries
- `idx_activities_activity_type` - Fast activity type filtering
- `idx_activities_curriculum` - Fast curriculum lookups

No performance degradation expected. Backward compatible.

---

## User Communication

Consider notifying existing users:

**Subject:** New Tracking Features - Attendance, Curriculum & Extracurricular

**Message:**
```
We've added three powerful tracking features to help you document your homeschool program:

1. 📅 Daily Attendance Tracking - Log "schooling days" to meet state requirements
2. 📚 Curriculum Tracking - Record which curriculum you're using (Math Mammoth, IXL, etc.)
3. 🎵 Extracurricular Logging - Track music, sports, clubs separately from academics

These are now available on each child's Compliance page and in the Quick Log modal.

Start using them to strengthen your homeschool documentation!
```

---

## Support Notes

Common questions:

**Q: Can I use existing activities without curriculum?**
A: Yes! Curriculum is optional. Existing activities show blank.

**Q: What if I don't track attendance?**
A: Optional. Use only if your state requires it. Most states focus on hours, not days.

**Q: Can I change activity types later?**
A: Yes. Edit the activity in the activity list.

**Q: Does this affect my reports?**
A: No. Reports still work. New fields provide additional context if included.

---

## Build Verification

```bash
npm run build
# Output should show:
# ✓ Compiled successfully in X.Xs
# ✓ Generating static pages using 1 worker (25/25)
# Process exited with code 0
```

---

## Status
✅ Code complete
✅ Build successful
✅ Migration script ready
✅ Ready for deployment
