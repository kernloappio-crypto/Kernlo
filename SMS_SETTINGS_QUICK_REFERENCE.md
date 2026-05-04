# SMS Settings - Quick Reference

## ⚡ What Got Built

✅ **Settings Page** - Parents can manage phone & SMS preferences  
✅ **API Endpoints** - Backend for fetching and updating settings  
✅ **Database Migration** - New `sms_notifications_enabled` column  
✅ **Landing Page Feature** - SMS shown in benefits section  
✅ **Navbar Integration** - Settings link in hamburger menu  

---

## 📍 Key Files

| File | Purpose |
|------|---------|
| `app/dashboard/[id]/settings/page.tsx` | Settings page UI |
| `app/api/profile/get/route.ts` | Fetch phone & SMS settings |
| `app/api/profile/update/route.ts` | Save phone & SMS settings |
| `supabase/migrations/014_add_sms_notifications.sql` | DB migration |
| `components/Navbar.tsx` | Updated with Settings link |
| `app/page.tsx` | Landing page with SMS feature |

---

## 🚀 How to Deploy

### Step 1: Apply Database Migration

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select **Kernlo** project
3. **SQL Editor** → **New Query**
4. Copy-paste from `/supabase/migrations/014_add_sms_notifications.sql`
5. Click **RUN**

**Verify it worked:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'sms_notifications_enabled';
```

### Step 2: Code Already Pushed

✅ Committed and pushed to `main` branch  
✅ Railway auto-rebuilds on push  
✅ Wait 2-5 minutes for deployment to complete

### Step 3: Test in Production

1. Log in to Kernlo
2. Go to `/dashboard/{kid-id}`
3. Hamburger menu (☰) → **⚙️ Settings**
4. Enter phone: `(555) 123-4567`
5. Toggle SMS ON (blue)
6. Click Save
7. **Expected:** Green checkmark ✅

---

## 🔗 User Flow

```
Landing Page (/)
  ↓ (shows SMS feature card)
Sign Up / Log In
  ↓
Dashboard (/dashboard/{kid-id})
  ↓
Hamburger Menu (☰)
  ↓ (click)
Settings (⚙️ Settings)
  ↓
Settings Page (/dashboard/{kid-id}/settings)
  ↓ (enter phone & toggle SMS)
Save Settings (POST /api/profile/update)
  ↓
Success Message ✅
```

---

## 📱 Phone Number Handling

### Input Formats Accepted
- `5551234567`
- `555-123-4567`
- `(555) 123-4567`
- `+1 555 123 4567`
- `+44 20 7946 0958`

### Storage Format (E.164)
- All stored as: `+{country_code}{number}`
- Example: `(555) 123-4567` → `+15551234567`
- Example: `+44 123 4567 890` → `+441234567890`

### Validation Rules
- ✅ Flexible input (any format)
- ✅ Auto-normalized to E.164
- ✅ Minimum 10 digits required
- ❌ SMS enabled without phone = error

---

## 🔐 Authentication & Authorization

All endpoints require valid JWT token:
```
Authorization: Bearer {access_token}
```

- ✅ Token from localStorage: `kernlo_access_token`
- ✅ User can only update their own settings
- ❌ Missing/invalid token → 401 Unauthorized

---

## 📊 Database

### Migration 014: Add SMS Notifications Column

```sql
ALTER TABLE users ADD COLUMN sms_notifications_enabled BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_users_sms_notifications_enabled ON users(sms_notifications_enabled);
```

### Query Examples

**Fetch user's settings:**
```sql
SELECT phone_number, sms_notifications_enabled FROM users WHERE id = '...';
```

**Find all users with SMS enabled:**
```sql
SELECT id, email, phone_number FROM users WHERE sms_notifications_enabled = true;
```

**Update user settings:**
```sql
UPDATE users SET phone_number = '+15551234567', sms_notifications_enabled = true WHERE id = '...';
```

---

## 🧪 Quick Test

### Manual Test in Browser

1. Open DevTools (F12)
2. Go to `/dashboard/{kid-id}/settings`
3. In Console, run:
```javascript
// Check if you can fetch settings
fetch('/api/profile/get', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('kernlo_access_token')}`
  }
}).then(r => r.json()).then(console.log);
```

### Expected Response
```json
{
  "phone_number": "+15551234567",
  "sms_notifications_enabled": true
}
```

---

## 🐛 Troubleshooting

### Settings page won't load
- [ ] Check if logged in (look for token in localStorage)
- [ ] Check browser console for errors
- [ ] Verify kid ID in URL is valid

### Phone not saving
- [ ] Check phone has 10+ digits
- [ ] Check SMS toggle state
- [ ] Look at network tab → POST `/api/profile/update` response

### Phone format weird in database
- [ ] Expected: stored as E.164 (e.g., `+15551234567`)
- [ ] Not expected: stored as user input format
- [ ] Check migration was applied

### SMS toggle not working
- [ ] Check browser console for JavaScript errors
- [ ] Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- [ ] Check network throttle (DevTools → Network → throttle)

---

## 📋 Next Steps

1. ✅ Apply database migration
2. ✅ Verify deployment on Railway
3. ⏳ Integrate with SMS provider (Twilio)
4. ⏳ Send SMS when activities logged
5. ⏳ Add activity logging confirmation workflow

---

## 📞 SMS Integration (Future)

When ready to send SMS:

1. **Add Twilio credentials** to `.env.local`
2. **Create `/api/sms-send`** endpoint
3. **Hook into activity logging** - send SMS after POST `/api/activities`
4. **Message template:**
   ```
   ✅ Activity Logged: [Child Name] [Duration]m [Subject] [Platform]
   Example: ✅ Activity Logged: Alerie 30m Biology Khan Academy
   ```

---

## 📝 Summary

**What users see:**
- Settings page with phone input & SMS toggle
- Landing page mentioning SMS as optional benefit
- Success message when settings saved

**What happens behind the scenes:**
- Phone number normalized to E.164
- Settings stored in Supabase `users` table
- API enforces auth & validation
- Data persists across sessions

**Next phase:**
- SMS actually gets sent when activities logged
- Requires Twilio integration

---

## 🤝 Support

Questions? Issues? Check:
- `SMS_SETTINGS_MIGRATION.md` - Detailed migration guide
- `TEST_PLAN_SMS_SETTINGS.md` - Complete test scenarios
- `app/dashboard/[id]/settings/page.tsx` - UI code
- `app/api/profile/update/route.ts` - API logic
