# NLP Logging System - Testing Guide

## Quick Start Testing

### Prerequisites
```bash
cd kernlo
npm install
npm run dev  # Starts on http://localhost:3000
```

---

## 1. WEB COMMAND BAR TESTING

### Test Case 1.1: Basic NLP Parsing
1. Navigate to dashboard
2. Find CommandBar component (top of page)
3. Type: `"Ella did 45m of fractions"`
4. Click "Ask AI"
5. **Expected:** ConfirmCard shows:
   - Student: Ella
   - Subject: Math
   - Minutes: 45
   - Notes: fractions

### Test Case 1.2: Missing Duration (Default)
1. Type: `"Tripp did science today"`
2. Click "Ask AI"
3. **Expected:** Minutes = 30 (default), note includes "[estimated]"

### Test Case 1.3: Unrecognized Subject
1. Type: `"Sarah did 20m of basket weaving"`
2. Click "Ask AI"
3. **Expected:** Subject = "Extracurricular", note = "basket weaving"

### Test Case 1.4: Low Confidence
1. Type: `"xyz abc 123"` (gibberish)
2. Click "Ask AI"
3. **Expected:** Error message appears in CommandBar

### Test Case 1.5: Full Confirm & Log
1. Type: `"Ella did 30m of English on Khan"`
2. Click "Ask AI"
3. Verify ConfirmCard shows all fields correct
4. Click "Confirm"
5. **Expected:** Success message "✅ Logged! Ella: 30m English (Khan). 🚀"
6. Verify in activities table: new row created with:
   - child_name: Ella
   - subject: English
   - duration: 30
   - platform: Khan
   - date: today's date

---

## 2. API TESTING (curl)

### Test 2.1: NLP Parse Endpoint
```bash
curl -X POST http://localhost:3000/api/nlp-parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Ella did 45m of fractions today",
    "user_id": "your-user-id-here",
    "available_students": ["Ella", "Tripp", "Sarah"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "student": "Ella",
    "subject": "Math",
    "minutes": 45,
    "note": "fractions today",
    "platform": null,
    "confidence": 0.95
  }
}
```

### Test 2.2: Sentiment Check Endpoint
```bash
curl -X POST http://localhost:3000/api/sentiment-check \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I am so overwhelmed and stressed today",
    "user_id": "your-user-id-here"
  }'
```

**Expected Response:**
```json
{
  "needs_support": true,
  "support_message": "This is a marathon, not a sprint. Progress isn't linear. You've got this! 💙"
}
```

### Test 2.3: Create Activity Endpoint
```bash
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "child_name": "Ella",
    "subject": "Math",
    "duration": 45,
    "platform": "Khan Academy",
    "date": "2026-05-03",
    "notes": "Fractions"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "activity": { ... }
}
```

---

## 3. SMS GATEWAY TESTING (Simulated)

### Setup: Add Test Phone Number
```sql
-- In Supabase SQL Editor
UPDATE users 
SET phone_number = '+15551234567' 
WHERE id = 'your-user-id';
```

### Test 3.1: Simulate SMS Receive (via Local Curl)

```bash
# Test basic activity logging
curl -X POST http://localhost:3000/api/sms-receive \
  -F "From=+15551234567" \
  -F "Body=Ella did 45m of math" \
  -F "MessageSid=SMxxxx123456"
```

**Expected Console Output:**
```
📱 SMS Received from +15551234567: "Ella did 45m of math"
✓ Pending confirmation created (awaiting_platform)
```

**Expected Response:**
```json
{
  "message": "✓ Got it, Ella did 45m of Math. Platform?",
  "status": "needs_confirmation"
}
```

### Test 3.2: Platform Response
```bash
curl -X POST http://localhost:3000/api/sms-receive \
  -F "From=+15551234567" \
  -F "Body=Khan Academy" \
  -F "MessageSid=SMxxxx123457"
```

**Expected:**
```json
{
  "message": "✓ Got it, Ella did 45m of Math (Khan Academy). Confirm? Y/N",
  "status": "needs_confirmation"
}
```

### Test 3.3: Confirmation (YES)
```bash
curl -X POST http://localhost:3000/api/sms-receive \
  -F "From=+15551234567" \
  -F "Body=Yes" \
  -F "MessageSid=SMxxxx123458"
```

**Expected:**
```json
{
  "message": "✅ Logged! Ella: 45m Math (Khan Academy). 🚀",
  "status": "success"
}
```

**Check Database:** New row in `activities` table

### Test 3.4: Confirmation (NO)
```bash
curl -X POST http://localhost:3000/api/sms-receive \
  -F "From=+15551234567" \
  -F "Body=No" \
  -F "MessageSid=SMxxxx123459"
```

**Expected:**
```json
{
  "message": "Cancelled. Try again: \"Ella did 30m of Math on Khan\"",
  "status": "success"
}
```

### Test 3.5: Sentiment Detection
```bash
curl -X POST http://localhost:3000/api/sms-receive \
  -F "From=+15551234567" \
  -F "Body=I am so stressed today, this is a failure" \
  -F "MessageSid=SMxxxx123460"
```

**Expected:**
```json
{
  "message": "Progress isn't linear. You're doing great. Homeschooling is a marathon! 💙",
  "status": "success"
}
```

### Test 3.6: User Not Found
```bash
curl -X POST http://localhost:3000/api/sms-receive \
  -F "From=+19999999999" \
  -F "Body=Ella did 45m of math" \
  -F "MessageSid=SMxxxx123461"
```

**Expected:**
```json
{
  "message": "📱 Phone number not recognized. Update your profile at kernlo.app",
  "status": "error"
}
```

---

## 4. PENDING CONFIRMATIONS TABLE

### Check Pending Records (Supabase SQL)
```sql
SELECT * FROM pending_nlp_confirmations 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC;
```

**Expected columns:**
- id, user_id, message_id, parsed_data (JSONB), confirmation_step, created_at

### Check Cleanup (Manual Test)
```bash
# Trigger cleanup manually
curl -X POST http://localhost:3000/api/cron/cleanup-pending-confirmations \
  -H "Authorization: Bearer your-cron-secret"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Deleted 3 expired pending confirmations"
}
```

---

## 5. EDGE CASES & ERROR HANDLING

### Test 5.1: Missing Student Name
**Input:** `"Did 45m of math"`
**Expected:** Low confidence error OR ConfirmCard with empty student field

### Test 5.2: Multiple Kids Mentioned
**Input:** `"Ella and Tripp did 30m of math together"`
**Expected:** Confidence drops, asks for clarification

### Test 5.3: Long Duration
**Input:** `"Sarah did 360 minutes of reading"`
**Expected:** Hours/duration parsed correctly (360m = 6 hours)

### Test 5.4: Special Characters in Notes
**Input:** `"Ella did 30m of math on Khan (fractions & decimals)"`
**Expected:** Notes field captures "fractions & decimals"

### Test 5.5: Empty Kids List
**Setup:** User has no kids in DB
**Input:** Any SMS
**Expected Response:** "👨‍👩‍👧 Add your kids to your profile first at kernlo.app"

---

## 6. PERFORMANCE & LOAD TESTING

### Load Test: Rapid NLP Calls
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/nlp-parse \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"Activity $i\",
      \"user_id\": \"user-id\",
      \"available_students\": [\"Ella\"]
    }" &
done
wait
```

**Expected:** All requests complete within 30 seconds, no errors

### Database Query Performance
```sql
-- Check pending confirmations index usage
EXPLAIN ANALYZE
SELECT * FROM pending_nlp_confirmations 
WHERE user_id = 'user-id' AND confirmation_step = 'awaiting_confirmation';
```

**Expected:** Index scan on `idx_pending_nlp_user_id`

---

## 7. MOBILE RESPONSIVENESS

### ConfirmCard Mobile Test
1. Open browser DevTools (F12)
2. Toggle Device Toolbar (iPhone 12 Pro)
3. Run Test 1.5 (full flow)
4. **Verify:**
   - Modal is centered and scrollable
   - All form fields visible and tappable
   - Buttons (Cancel/Confirm) accessible
   - No horizontal overflow

### CommandBar Mobile Test
1. Simulate mobile device
2. Type in input field
3. Tap "Ask AI" button
4. **Verify:** Keyboard dismisses, modal appears without overlap

---

## 8. CLEANUP & TEARDOWN

### Test Data Cleanup
```sql
-- Clear test activities
DELETE FROM activities 
WHERE user_id = 'your-test-user-id';

-- Clear pending confirmations
DELETE FROM pending_nlp_confirmations 
WHERE user_id = 'your-test-user-id';

-- Reset phone number
UPDATE users 
SET phone_number = NULL 
WHERE id = 'your-test-user-id';
```

---

## 9. INTEGRATION TESTING CHECKLIST

- [ ] Web: Parse → Confirm → Log (full flow)
- [ ] SMS: Parse → Platform → Confirm → Log (full flow)
- [ ] Sentiment: Stressed message → Support response
- [ ] Edge case: Low confidence handling
- [ ] Edge case: Missing student
- [ ] Edge case: Phone number not found
- [ ] Performance: 10 concurrent NLP calls
- [ ] Mobile: CommandBar responsive
- [ ] Mobile: ConfirmCard responsive
- [ ] Database: Pending records created & cleaned
- [ ] Cleanup cron: Old records deleted after 5 min

---

## 10. DEBUGGING TIPS

### Enable Verbose Logging
Edit endpoints to log:
```typescript
console.log('📱 SMS from:', from);
console.log('🔍 NLP result:', nlpResult);
console.log('✅ Activity saved:', activity);
```

### Check Browser Network Tab
1. Open DevTools → Network tab
2. Make a request (NLP parse, activity create)
3. Inspect headers & response
4. Look for errors in Status column

### Check Browser Console
- Look for fetch errors
- Component render errors
- JavaScript exceptions

### Check Server Logs
```bash
# In terminal running `npm run dev`
tail -f console output
```

### Supabase Query Check
- Go to Supabase Dashboard
- SQL Editor → Run queries manually
- Verify data is being inserted

---

**All tests passing = Ready for Production! 🚀**
