# NLP Logging System - Quick Reference

## File Structure
```
kernlo/
├── supabase/migrations/
│   ├── 012_add_phone_number.sql
│   └── 013_create_pending_nlp_confirmations.sql
├── lib/
│   └── types.ts (all TypeScript interfaces)
├── app/api/
│   ├── nlp-parse/route.ts (Gemini NLP parser)
│   ├── sentiment-check/route.ts (Sentiment detection)
│   ├── sms-receive/route.ts (Twilio SMS webhook)
│   ├── activities/route.ts (GET/POST activities)
│   └── cron/cleanup-pending-confirmations/route.ts
├── components/
│   ├── CommandBar.tsx (Web UI input)
│   └── ConfirmCard.tsx (Confirmation modal)
├── NLP_LOGGING_IMPLEMENTATION.md (Full docs)
├── TESTING_GUIDE.md (All test cases)
└── DEPLOYMENT_README.md (Deploy steps)
```

## API Endpoints Reference

### POST /api/nlp-parse
Parses natural language text into structured activity data.

```bash
curl -X POST /api/nlp-parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Ella did 45m of math",
    "user_id": "uuid",
    "available_students": ["Ella", "Tripp"]  # optional
  }'
```

**Response:** `{ success: bool, data?: ParsedActivityData, error?: string }`

---

### POST /api/sentiment-check
Detects stressed/discouraged tone and generates support message.

```bash
curl -X POST /api/sentiment-check \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I am so overwhelmed",
    "user_id": "uuid"
  }'
```

**Response:** `{ needs_support: bool, support_message?: str }`

---

### POST /api/sms-receive
Twilio webhook for incoming SMS. Handles multi-step NLP confirmation flow.

```bash
curl -X POST /api/sms-receive \
  -F "From=+15551234567" \
  -F "Body=Ella did 45m of math" \
  -F "MessageSid=SMxxxx"
```

**Response:** `{ message: str, status: 'success'|'error'|'needs_confirmation' }`

---

### GET/POST /api/activities
Get user's activities or create new activity.

```bash
# GET
curl -H "Authorization: Bearer JWT" /api/activities

# POST
curl -X POST /api/activities \
  -H "Authorization: Bearer JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "child_name": "Ella",
    "subject": "Math",
    "duration": 45,
    "platform": "Khan Academy",
    "date": "2026-05-03",
    "notes": "Fractions"
  }'
```

---

### POST /api/cron/cleanup-pending-confirmations
Deletes pending confirmations older than 5 minutes.

```bash
curl -X POST /api/cron/cleanup-pending-confirmations \
  -H "Authorization: Bearer CRON_SECRET"
```

---

## Data Types (TypeScript)

```typescript
// Parsed activity from NLP
interface ParsedActivityData {
  student: string | null
  subject: string
  minutes: number
  note: string
  platform: string | null
  confidence: number  // 0.0 - 1.0
}

// Pending SMS confirmation (DB)
interface PendingNLPConfirmation {
  id: string
  user_id: string
  message_id: string  // Twilio MessageSid
  parsed_data: ParsedActivityData
  confirmation_step: 'awaiting_platform' | 'awaiting_confirmation'
  created_at: string
}

// Activity (final, in DB)
interface Activity {
  id: string
  user_id: string
  child_name: string
  subject: string
  duration: number
  platform: string
  date: string  // YYYY-MM-DD
  notes: string | null
  created_at: string
  updated_at: string
}
```

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
GOOGLE_API_KEY=AIza...

# SMS Gateway (Twilio)
TWILIO_ACCOUNT_SID=ACxx...
TWILIO_AUTH_TOKEN=xxxx...
TWILIO_PHONE_NUMBER=+1555...

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000  # for local testing
CRON_SECRET=random-token-string  # for cron auth
```

---

## Database Schema Reference

### users (extended)
```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
```

**Query users by phone:**
```sql
SELECT * FROM users WHERE phone_number = '+15551234567';
```

---

### pending_nlp_confirmations (new)
```sql
CREATE TABLE pending_nlp_confirmations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  message_id TEXT NOT NULL,
  parsed_data JSONB NOT NULL,
  confirmation_step TEXT CHECK (confirmation_step IN ('awaiting_platform', 'awaiting_confirmation')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Query pending:**
```sql
SELECT * FROM pending_nlp_confirmations 
WHERE user_id = 'uuid' AND confirmation_step = 'awaiting_platform';
```

**Delete old:**
```sql
DELETE FROM pending_nlp_confirmations 
WHERE created_at < NOW() - INTERVAL '5 minutes';
```

---

## Component Props Reference

### CommandBar
```typescript
interface CommandBarProps {
  userId: string
  onActivityLogged?: () => void  // Called after successful log
}

// Usage
<CommandBar userId={session.user.id} onActivityLogged={refetchActivities} />
```

### ConfirmCard
```typescript
interface ConfirmCardProps {
  data: ParsedActivityData  // Pre-filled from NLP
  userId: string
  onCancel: () => void  // Close without logging
  onConfirm: () => void  // Called after successful log
}

// Usage (internal to CommandBar)
<ConfirmCard data={parsedData} userId={userId} onCancel={handleCancel} onConfirm={handleLog} />
```

---

## Common Workflows

### Web: Parse → Confirm → Log
```
User types "Ella did 45m of math"
       ↓
POST /api/nlp-parse
       ↓
Show ConfirmCard (editable fields)
       ↓
User clicks "Confirm"
       ↓
POST /api/activities
       ↓
Success message + clear input
```

### SMS: Parse → Platform → Confirm → Log
```
User sends "Ella did 45m of math"
       ↓
POST /api/sms-receive
       ↓
POST /api/nlp-parse (internal)
       ↓
Create pending (awaiting_platform)
       ↓
Reply: "Got it, Ella did 45m Math. Platform?"
       ↓
User sends "Khan"
       ↓
Update pending (awaiting_confirmation)
       ↓
Reply: "Got it, Ella did 45m Math (Khan). Confirm? Y/N"
       ↓
User sends "Yes"
       ↓
INSERT into activities
       ↓
Reply: "✅ Logged! Ella: 45m Math (Khan). 🚀"
```

### Sentiment: Detect → Support
```
User sends "I'm so overwhelmed"
       ↓
POST /api/sms-receive
       ↓
POST /api/sentiment-check
       ↓
needs_support = true
       ↓
Reply: "[warm support message]"
       ↓
Exit (no activity logging)
```

---

## Debugging Checklist

- [ ] Check environment variables are set
- [ ] Check Supabase tables exist (SQL Editor)
- [ ] Check phone_number column added to users
- [ ] Check pending_nlp_confirmations table created
- [ ] Check Google API key is valid (try Gemini API directly)
- [ ] Check Twilio webhook URL is configured
- [ ] Check logs: `railway logs -s kernlo`
- [ ] Check network tab in browser DevTools
- [ ] Check Twilio logs for webhook calls
- [ ] Check Supabase activity table for new rows

---

## Performance Notes

- **NLP Parsing:** ~2-3 seconds (Gemini API call)
- **Sentiment Check:** ~1-2 seconds (if needed)
- **Database Query:** <100ms (with indexes)
- **SMS Response:** ~5-10 seconds total (network + processing)

**Optimization:**
- Cache kids list (30s TTL)
- Batch Gemini calls if >60/min
- Pending confirmations auto-cleanup (5 min)

---

## Monitoring

**Logs to watch:**
```
✅ Activity logged: { child_name, subject, duration, platform }
🔴 NLP parse error: [details]
📱 SMS Received from [number]: "[text]"
💙 Support message sent
✅ Cleaned up N expired pending confirmations
```

**Metrics to track:**
- Daily activities logged (web + SMS)
- NLP confidence average
- SMS response time
- Support message frequency
- Pending confirmations count

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "phone_number column not found" | Migration not run | Run 012 migration |
| "pending_nlp_confirmations table not found" | Migration not run | Run 013 migration |
| "Google API key not valid" | Invalid/missing API key | Set GOOGLE_API_KEY |
| "Twilio webhook not responding" | Wrong URL or not accessible | Check deployed URL, firewall |
| "User not found" | Phone number not in DB | Update user.phone_number |
| "No kids found" | User has no kids | User must add kids first |
| "Low confidence" | Unclear input | Ask user to rephrase |
| "Pending confirmation not found" | Already processed | Normal, handled gracefully |

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 3. Run database migrations (in Supabase)
# Copy migrations 012 & 013, run in SQL Editor

# 4. Start dev server
npm run dev

# 5. Test endpoints
curl -X POST http://localhost:3000/api/nlp-parse \
  -H "Content-Type: application/json" \
  -d '{"text":"test","user_id":"test"}'

# 6. Test web UI
# Navigate to http://localhost:3000/dashboard
# Use CommandBar component
```

---

**For full details, see:**
- `NLP_LOGGING_IMPLEMENTATION.md` - Complete architecture
- `TESTING_GUIDE.md` - All test cases
- `DEPLOYMENT_README.md` - Production deployment
