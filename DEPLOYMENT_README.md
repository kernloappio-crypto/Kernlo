# Kernlo NLP Logging - Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing (see TESTING_GUIDE.md)
- [ ] Environment variables configured
- [ ] Migrations applied to Supabase
- [ ] Twilio webhook configured
- [ ] npm install completed
- [ ] npm run build successful
- [ ] Git committed and pushed

---

## Step-by-Step Deployment

### 1. Supabase Database Migrations

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to [Supabase Console](https://app.supabase.com)
2. Select your project
3. Go to SQL Editor
4. Create new query
5. Copy & paste from `supabase/migrations/012_add_phone_number.sql`
6. Click "Run" (watch for success message)
7. Repeat for `supabase/migrations/013_create_pending_nlp_confirmations.sql`

**Option B: Using Supabase CLI**
```bash
cd kernlo
supabase link --project-ref tyzvhpyrghqayuqchwra
supabase db push
```

### 2. Environment Variables

**For Railway Deployment:**

1. Go to [Railway Dashboard](https://railway.app)
2. Select Kernlo project
3. Go to Settings → Variables
4. Add/update:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tyzvhpyrghqayuqchwra.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_API_KEY=AIza...                              # Get from Google Cloud
NEXT_PUBLIC_APP_URL=https://kernlo.app              # Or your Railway domain
TWILIO_ACCOUNT_SID=ACxx...                          # Get from Twilio
TWILIO_AUTH_TOKEN=xxxx...                           # Get from Twilio
TWILIO_PHONE_NUMBER=+1555...                        # Your SMS number
CRON_SECRET=your-secure-random-string               # Generate: openssl rand -base64 32
```

**For Vercel Deployment:**

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select project
3. Settings → Environment Variables
4. Add same variables as above
5. Redeploy

### 3. Twilio Configuration

**Setup SMS Webhook:**

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to Messaging → Services (or Phone Numbers)
3. Select your SMS number
4. Find "Incoming Messages" section
5. Set webhook URL: `https://kernlo.app/api/sms-receive`
6. Method: `POST`
7. Save

**Get API Credentials:**

1. In Twilio Console, go to Account → API Keys & Tokens
2. Copy Account SID
3. Copy Auth Token
4. Add to environment variables

### 4. Google Gemini API Setup

**Enable Gemini API:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable "Generative Language API"
4. Go to APIs & Services → Credentials
5. Create API Key
6. Restrict to "Generative Language API"
7. Copy the key
8. Add to environment variables as `GOOGLE_API_KEY`

**Cost:** Free tier includes 60 requests/min, 2M tokens/day

### 5. Build & Deploy

**For Railway:**
```bash
git add .
git commit -m "feat: NLP intelligent logging system"
git push origin main
# Railway auto-detects push and rebuilds
```

**For Vercel:**
```bash
git add .
git commit -m "feat: NLP intelligent logging system"
git push origin main
# Vercel auto-detects push and rebuilds
```

**Manual build verification:**
```bash
npm run build
# Should complete with no TypeScript errors
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Test NLP endpoint
curl https://kernlo.app/api/nlp-parse \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"test","user_id":"test","available_students":[]}'

# Test sentiment endpoint
curl https://kernlo.app/api/sentiment-check \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text":"test","user_id":"test"}'

# Test SMS endpoint (Twilio will call this)
curl https://kernlo.app/api/sms-receive \
  -X POST \
  -F "From=+15551234567" \
  -F "Body=test" \
  -F "MessageSid=SMtest"
```

### 2. Test SMS Flow

1. Send SMS from your personal phone to Twilio number
2. Wait 5-10 seconds
3. Check logs: `railway logs` or Vercel dashboard
4. Verify response received

### 3. Test Web Command Bar

1. Login to [kernlo.app](https://kernlo.app)
2. Navigate to dashboard
3. Use CommandBar: type "Ella did 30m of math"
4. Verify activity logged in database

### 4. Database Verification

```sql
-- Check if migrations ran
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'phone_number';
-- Should return: phone_number

-- Check if pending confirmations table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'pending_nlp_confirmations'
);
-- Should return: true

-- Check recent activities
SELECT * FROM activities ORDER BY created_at DESC LIMIT 5;
```

### 5. Twilio Webhook Verification

1. Go to Twilio Console
2. Messaging → Services → Logs
3. Look for recent POST to `/api/sms-receive`
4. Verify Status = 200

---

## Monitoring & Maintenance

### Cron Job Setup (Cleanup)

**Option A: Railway Cron Trigger**
```yaml
# railway.json
{
  "jobs": [
    {
      "name": "cleanup-pending-confirmations",
      "schedule": "*/5 * * * *",  # Every 5 minutes
      "command": "curl -X POST $RAILWAY_DOMAIN/api/cron/cleanup-pending-confirmations -H 'Authorization: Bearer $CRON_SECRET'"
    }
  ]
}
```

**Option B: External Cron Service (EasyCron)**

1. Go to [EasyCron](https://www.easycron.com)
2. Create new cron job
3. URL: `https://kernlo.app/api/cron/cleanup-pending-confirmations`
4. Request Method: POST
5. Headers: `Authorization: Bearer YOUR_CRON_SECRET`
6. Frequency: Every 5 minutes

**Option C: Vercel Cron**
```typescript
// app/api/cron/cleanup-pending-confirmations/route.ts
export const runtime = 'nodejs';

export async function GET(req: Request) {
  // Vercel checks Authorization header
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // ... cleanup logic
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-pending-confirmations",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Monitoring Logs

**Railway:**
```bash
railway logs -s kernlo
```

**Vercel:**
Go to Dashboard → Deployments → Logs (real-time)

**Key logs to watch:**
```
✅ Activity logged: { ... }
🔴 NLP parse error: ...
📱 SMS Received from: ...
💙 Support message sent
✅ Cleaned up N expired pending confirmations
```

### Database Maintenance

**Monthly:**
```sql
-- Check pending confirmations count
SELECT COUNT(*) FROM pending_nlp_confirmations;

-- Check oldest pending
SELECT * FROM pending_nlp_confirmations 
ORDER BY created_at ASC LIMIT 1;

-- Activities count (growth tracking)
SELECT COUNT(*) FROM activities;
```

### API Rate Limiting

**Gemini API Limits:**
- Free tier: 60 requests/min, 2M tokens/day
- If exceeded: upgrade to paid or implement request queue

**Implement backoff if needed:**
```typescript
// Retry logic for rate limits
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};
```

---

## Rollback Plan

If issues after deployment:

### Quick Rollback (within 24 hours)
**Railway:**
```bash
railway redeploy --version <previous-commit-hash>
```

**Vercel:**
1. Go to Dashboard → Deployments
2. Click "..." on previous deployment
3. Click "Promote to Production"

### Database Rollback
If migrations cause issues:

```sql
-- Revert add phone_number (safe, just drops column)
ALTER TABLE users DROP COLUMN phone_number;

-- Revert pending confirmations table
DROP TABLE pending_nlp_confirmations;
```

### Manual Fix
1. Identify issue in logs
2. Fix code locally
3. Push again (triggers redeploy)
4. Monitor logs

---

## Scaling Considerations

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_pending_nlp_user_id ON pending_nlp_confirmations(user_id);
CREATE INDEX idx_pending_nlp_created_at ON pending_nlp_confirmations(created_at);
CREATE INDEX idx_activities_user_date ON activities(user_id, date);
```

### API Rate Limiting
Consider adding:
- Rate limit middleware (e.g., `express-rate-limit`)
- Request queue for Gemini calls
- Batch processing for high volume

### Caching
- Cache kids list (30s) to reduce DB queries in NLP
- Cache available subjects list

---

## Support & Troubleshooting

### Common Issues

**Issue: "Google API key not valid"**
- Verify GOOGLE_API_KEY is set correctly
- Check API is enabled in Google Cloud Console
- Ensure key is not restricted to specific IPs

**Issue: "Twilio webhook not responding"**
- Verify webhook URL is correct
- Check Railway/Vercel domain is correct
- Ensure endpoint is POST (not GET)
- Check firewall isn't blocking inbound requests

**Issue: "phone_number column not found"**
- Run migration: `012_add_phone_number.sql`
- Verify in Supabase SQL Editor

**Issue: "pending_nlp_confirmations table not found"**
- Run migration: `013_create_pending_nlp_confirmations.sql`
- Verify in Supabase SQL Editor

### Debug Mode

Add to `.env.local`:
```env
DEBUG=kernlo:*
LOG_LEVEL=debug
```

Then in endpoints:
```typescript
if (process.env.DEBUG) {
  console.log('[DEBUG]', data);
}
```

---

## Success Criteria

✅ Deployment successful when:
- [ ] All migrations applied (no errors in Supabase)
- [ ] Endpoints respond with 200 OK (health check passed)
- [ ] SMS received and replied (Twilio logs show POST)
- [ ] Web command bar logs activities (database shows new rows)
- [ ] No JavaScript errors in console (DevTools)
- [ ] No 500 errors in server logs (Railway/Vercel)
- [ ] Cron job runs (pending confirmations cleaned up)

---

## Contact & Support

- **Gemini API Issues:** [Google Cloud Support](https://cloud.google.com/support)
- **Twilio Issues:** [Twilio Support](https://www.twilio.com/help)
- **Supabase Issues:** [Supabase Support](https://supabase.help)
- **Railway Issues:** [Railway Docs](https://docs.railway.app)

---

**Deployment Ready! 🚀**

For detailed testing, see `TESTING_GUIDE.md`
For implementation details, see `NLP_LOGGING_IMPLEMENTATION.md`
