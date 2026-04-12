# Kernlo Development Guide

## Architecture

### Stack
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Deployment:** Vercel (web), Railway (backup)
- **PWA:** Service worker for offline support
- **PDF:** jsPDF for report generation

### Project Structure
```
kernlo/
├── app/                    # Next.js app directory
│   ├── auth/              # Auth pages (signup, login, forgot-password)
│   ├── dashboard/         # Main dashboard (home + kid detail)
│   │   └── [id]/         # Kid-specific pages (goals, compliance)
│   ├── privacy/           # Legal pages
│   ├── terms/
│   ├── upgrade/           # Upgrade page
│   └── offline/           # Offline fallback
├── lib/                   # Utilities
│   ├── supabase-client.ts # Supabase initialization
│   ├── supabase-auth.ts   # Auth functions
│   ├── supabase-data.ts   # Data layer (CRUD)
│   ├── trial-checker.ts   # Trial logic
│   ├── email-verification.ts # Email (Phase 2)
│   ├── stripe-utils.ts    # Payment (Phase 2)
│   └── pdf-generator.ts   # PDF reports
├── public/                # Static assets
│   ├── manifest.json      # PWA manifest
│   └── sw.js             # Service worker
├── supabase/              # Database schema
│   └── schema.sql        # PostgreSQL DDL
└── E2E_TESTS.md          # Test checklist
```

## Setup

### Prerequisites
- Node.js 22+
- npm or yarn
- Supabase account (free tier OK)
- GitHub account for pushing

### Local Development

1. **Clone repo**
   ```bash
   git clone https://github.com/kernloappio-crypto/kernlo
   cd kernlo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create Supabase project at supabase.com
   - Copy `.env.local` template:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```
   - Run schema from `supabase/schema.sql` in SQL editor

4. **Start dev server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

### Database

**Schema Location:** `supabase/schema.sql`

**Key Tables:**
- `users` - User accounts + trial tracking
- `kids` - Child profiles
- `activities` - Logged learning activities
- `goals` - Monthly learning goals
- `reports` - Generated compliance reports
- `compliance_state` - User's selected state

**RLS (Row Level Security):** All tables have policies to prevent cross-user data access.

## Development Workflow

### Making Changes

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes**
   - Update relevant files
   - Test locally with `npm run dev`
   - Check console for errors

3. **Build before commit**
   ```bash
   npm run build
   ```
   Must pass without errors.

4. **Commit with clear message**
   ```bash
   git add -A
   git commit -m "Add feature description"
   git push origin feature/your-feature
   ```

5. **Test on staging** (if available)
   ```bash
   npm run start # Production build locally
   ```

### Adding a New Feature

Example: Adding "Notes" field to activities

1. **Update schema**
   ```sql
   ALTER TABLE activities ADD COLUMN notes TEXT;
   ```

2. **Update TypeScript interface**
   ```typescript
   interface Activity {
     // ... existing fields
     notes?: string;
   }
   ```

3. **Update data layer**
   ```typescript
   export async function addActivity(..., notes?: string) {
     // ... include notes in insert
   }
   ```

4. **Update UI**
   - Add form field in activity log component
   - Display notes in activity list

5. **Test end-to-end**
   - Create activity with notes
   - Verify appears on other device (real-time sync)
   - Delete activity

## Key Patterns

### Real-Time Data Sync
```typescript
// Subscribe to changes
const channel = supabase
  .channel('kids:userId')
  .on('postgres_changes', { ... }, () => {
    loadData(userId);
  })
  .subscribe();

// Cleanup
return () => supabase.removeChannel(channel);
```

### Error Handling
```typescript
try {
  await addActivity(...);
  // Reload data
} catch (err) {
  console.error('Error:', err);
  alert('Failed to add activity');
}
```

### Trial Checking
```typescript
const status = calculateTrialStatus(trialStartDate, isPaid);
if (!status.can_access) {
  // Show upgrade modal
}
```

## Testing

### E2E Checklist
See `E2E_TESTS.md` for full test list.

**Quick test:**
1. Signup with test email
2. Add kid
3. Log activity
4. Check compliance
5. Verify real-time sync on another browser tab

### Unit Tests (Future)
```bash
npm run test
```

### Build Verification
```bash
npm run build
```

## Deployment

### Vercel (Primary)
- Auto-deploys on push to `main`
- Environment variables in Vercel dashboard
- Logs available in dashboard

### Railway (Backup)
- Manual deploy via CLI or dashboard
- Same env vars needed

### Checking Status
```bash
# Build locally first
npm run build

# Test production mode
npm run start
```

## Performance Optimization

### Already Done
- ✅ Image optimization
- ✅ Code splitting
- ✅ Service worker caching
- ✅ Real-time updates (not polling)

### Future
- [ ] Next.js Image component
- [ ] Analytics dashboard
- [ ] Database query optimization
- [ ] CDN for static assets

## Security Checklist

- [x] No API keys in client code (use `.env.local`)
- [x] RLS policies enforce user isolation
- [x] HTTPS enforced
- [x] CORS configured
- [x] Session management via Supabase auth
- [ ] Rate limiting (Phase 2)
- [ ] Input validation (Phase 2)

## Common Issues

### Supabase Connection
**Error:** "Failed to connect to Supabase"
**Solution:** Check `.env.local` has correct URL and key

### RLS Policy Errors
**Error:** "new row violates row-level security policy"
**Solution:** Make sure `user_id` matches authenticated user's ID

### Service Worker Cache Issues
**Error:** Old version of app loads
**Solution:** Clear browser cache or hard refresh (Cmd+Shift+R)

### Real-time Sync Not Working
**Error:** Changes don't appear on other device
**Solution:** Check Supabase real-time enabled, refresh page

## Useful Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [jsPDF](https://github.com/parallax/jsPDF)

## Git Workflow

**Commits follow this format:**
```
[Type] Description

- Bullet points for changes
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code improvement
- `docs:` Documentation
- `test:` Test addition

## Support

- **Bug reports:** Create GitHub issue
- **Questions:** Email hello@kernlo.app
- **Discussion:** Telegram FIDI LIFE group

---

Last Updated: 2026-04-12
