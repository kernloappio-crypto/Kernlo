# SMS Settings Implementation - Migration & Setup

## Overview
This adds phone number and SMS notification settings to the Kernlo parent profile. Parents can now:
- Enter their phone number
- Enable/disable SMS notifications for activity confirmations
- Settings are persisted in the database

## Database Migration

### File: `supabase/migrations/014_add_sms_notifications.sql`

This migration adds:
- `sms_notifications_enabled` BOOLEAN column to `users` table (default: false)
- Index on `sms_notifications_enabled` for fast lookups

**How to Apply:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select the Kernlo project
3. Go to **SQL Editor** → **New Query**
4. Copy-paste this SQL:

```sql
-- Add SMS notifications enabled column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT FALSE;

-- Create index for SMS notifications lookup
CREATE INDEX IF NOT EXISTS idx_users_sms_notifications_enabled ON users(sms_notifications_enabled);

-- Comment for clarity
COMMENT ON COLUMN users.sms_notifications_enabled IS 'Enable/disable SMS notifications for activity confirmations';
```

5. Click **RUN** (⚡ button)

### Verification

After running, verify the column exists:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'sms_notifications_enabled';
```

Should return: `sms_notifications_enabled | boolean`

---

## Frontend Implementation

### Settings Page
- **Path:** `/app/dashboard/[id]/settings`
- Clean, minimal UI matching Kernlo design
- Phone number input with flexible format (accepts (555) 123-4567, +1-555-123-4567, etc.)
- SMS toggle switch (blue when enabled, gray when disabled)
- Success/error messages
- Mobile responsive

### UI Features
- **Phone Field:** Text input, accepts flexible formats
- **SMS Toggle:** Blue (#0066cc) when enabled, gray when disabled
- **Validation:** Phone must have 10+ digits if SMS enabled
- **Feedback:** Toast-style success message "Settings saved ✅"
- **Navigation:** Accessible from Navbar hamburger menu → Settings

---

## API Endpoints

### POST `/api/profile/update`
Updates phone number and SMS preferences.

**Request:**
```json
{
  "phone_number": "+1 (555) 123-4567",
  "sms_notifications_enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile settings saved",
  "data": { ... }
}
```

**Validation:**
- Phone required if SMS enabled
- Phone must have 10+ digits
- Returns 400 if validation fails
- Returns 401 if unauthorized

### GET `/api/profile/get`
Retrieves current user's phone and SMS settings.

**Response:**
```json
{
  "phone_number": "+15551234567",
  "sms_notifications_enabled": true
}
```

---

## Testing

### 1. Settings Page Loads
```bash
Navigate to /dashboard/{kid-id}/settings
```
Expected: Page loads with empty phone field, SMS toggle off

### 2. Enter Phone Number
- Type: `(555) 123-4567`
- Expected: Accepted (flexible format)

### 3. Toggle SMS
- Click toggle → should turn blue (#0066cc)
- Click toggle → should turn gray

### 4. Save Settings
- Click "Save Settings"
- Expected: Green success message "Settings saved ✅"
- Message disappears after 3 seconds

### 5. Verify in Database
```sql
SELECT phone_number, sms_notifications_enabled FROM users 
WHERE id = 'YOUR_USER_ID';
```
Expected: Shows saved phone (in E.164 format) and true for SMS enabled

### 6. Refresh Page
- Reload settings page
- Expected: Phone and SMS settings persist

### 7. Validation Error
- Enable SMS without phone
- Click Save
- Expected: Error message "Phone number is required when SMS notifications are enabled"

---

## Deployment

### Railway Rebuild
```bash
git push origin main
```
Railway will automatically rebuild and deploy the changes.

### Supabase Migration
Must be applied manually via Supabase Dashboard (see Database Migration section above).

---

## Files Changed

```
app/dashboard/[id]/settings/page.tsx      ✨ New settings page
app/api/profile/update/route.ts           ✨ New API endpoint (POST)
app/api/profile/get/route.ts              ✨ New API endpoint (GET)
components/Navbar.tsx                     🔧 Added Settings link
supabase/migrations/014_...sql            🗄️  Database migration
scripts/run-migration.js                  📝 Helper to run migrations
```

---

## Phone Number Normalization

The API automatically normalizes phone numbers to E.164 format:
- `5551234567` → `+15551234567` (assumes US)
- `(555) 123-4567` → `+15551234567`
- `+44 20 7946 0958` → `+442079460958`

Flexible input is accepted on frontend; backend normalizes for consistency.

---

## Next Steps

1. Apply database migration via Supabase Dashboard
2. Push code to Railway
3. Test on staging/production
4. SMS integration can be added to `app/api/sms-send` route when ready

---

## Notes

- SMS notifications are disabled by default (safe default)
- Phone number is optional if SMS disabled
- Phone field shows in any format on UI, normalized in database
- Works with existing parent profile structure
- Complements existing phone_number column (from migration 012)
