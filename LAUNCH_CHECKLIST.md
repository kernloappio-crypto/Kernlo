# Kernlo Launch Checklist

**Target Launch Date:** April 19, 2026 (7 days)  
**Current Status:** Foundation complete (Supabase, mobile, PWA)  
**Build Commit:** 9ed66ad

---

## Pre-Launch (Days 1-5)

### Code & Build
- [x] Supabase schema created
- [x] Auth system migrated (Supabase)
- [x] Dashboard fully Supabase-backed
- [x] Mobile responsive CSS
- [x] PWA manifest + service worker
- [x] Build passes without errors
- [x] No console errors in browser

### Feature Verification
- [ ] Trial system calculates correctly (30 days)
- [ ] Upgrade gate blocks expired users
- [ ] Add kid respects 5-kid limit
- [ ] Quick log saves activities in real-time
- [ ] Goals + progress bars work
- [ ] Compliance rules calculate correctly (CA/TX/FL/NY)
- [ ] PDF export generates valid PDF
- [ ] Privacy/Terms pages load

### Data Layer
- [ ] Supabase real-time sync works
- [ ] Activities appear instantly on all devices
- [ ] RLS policies enforce user isolation
- [ ] No data leakage between users
- [ ] Logout clears session properly

### Mobile Testing
- [ ] iPhone SE (375px) - functional
- [ ] iPhone 12 (390px) - functional
- [ ] iPad (768px) - functional
- [ ] Android phone - functional
- [ ] Service worker installs
- [ ] PWA "add to home screen" works

### Video Integration
- [ ] Whiteboard video file received
- [ ] Video quality acceptable (no artifacts)
- [ ] Video duration 30-45 seconds
- [ ] Video URL embedded in landing page
- [ ] Video plays on landing page
- [ ] Video thumbnail shows

### Legal/Compliance
- [x] Privacy Policy page created
- [x] Terms of Service page created
- [ ] Privacy policy reviewed for accuracy
- [ ] Terms reviewed for legality
- [ ] Links in footer functional

---

## Launch Day (Day 6-7)

### Final Testing
- [ ] Full E2E flow: signup → dashboard → log activity → upgrade
- [ ] Trial system works end-to-end
- [ ] Upgrade modal appears after 30 days
- [ ] Payment processing works (test mode)
- [ ] Confirmation email sent
- [ ] Dashboard still accessible after upgrade

### Deployment
- [ ] Supabase project live and stable
- [ ] Database backups configured
- [ ] Vercel/Railway deployment tested
- [ ] All env vars set correctly
- [ ] SSL certificates valid
- [ ] Domain points to correct IP

### Marketing
- [ ] Landing page live
- [ ] Video embedded and playing
- [ ] CTA buttons functional ("Get Started", "Start Free Trial")
- [ ] Waitlist capture working
- [ ] Google Analytics installed
- [ ] Facebook Pixel installed (if applicable)

### Monitoring
- [ ] Error tracking configured (Sentry/LogRocket)
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Email alerts for errors
- [ ] Dashboard for metrics accessible

### Go-Live Checklist
- [ ] Announce in Telegram/Discord
- [ ] Share with homeschool Facebook groups
- [ ] Post on Reddit (r/homeschool)
- [ ] Email to waitlist
- [ ] Social media posts scheduled
- [ ] Press release ready (optional)

---

## Post-Launch (Week 2+)

### User Support
- [ ] Support email monitored (hello@kernlo.app)
- [ ] Response template created for common issues
- [ ] FAQ page ready
- [ ] Feedback form on dashboard
- [ ] Slack/Discord community for users (optional)

### Data & Analytics
- [ ] Track daily signups
- [ ] Monitor trial-to-paid conversion rate
- [ ] Track feature usage (goals, compliance, reports)
- [ ] Monitor performance metrics
- [ ] Collect user feedback

### Phase 2 Planning
- [ ] React Native app development starts (if metrics support)
- [ ] Curriculum integration research (IXL, Khan Academy)
- [ ] Multi-user workspace design
- [ ] Feedback incorporated into roadmap

---

## Critical Path Dependencies

1. **Whiteboard video** must arrive before launch (scheduled 4/15)
2. **Supabase project** must be stable and tested
3. **All E2E tests** must pass before announcement
4. **Payment processing** must work in test mode
5. **Mobile testing** must confirm responsiveness

---

## Rollback Plan

If launch fails:
- [ ] Revert to localStorage version (commit 7ec8448)
- [ ] Deploy backup to Railway
- [ ] Notify waitlist of delay
- [ ] Debug and retry within 48 hours

---

## Success Metrics (First 30 Days)

- **Target signups:** 50-100
- **Trial-to-paid conversion:** 5-10%
- **Daily active users:** 10-20
- **Report generation rate:** 30%+ of trial users

---

## Known Issues to Monitor

- [ ] Supabase real-time sync latency (should be <500ms)
- [ ] Cold start on first dashboard load
- [ ] Service worker cache invalidation
- [ ] Email delivery for reset/upgrade confirmation

---

## Contact & Escalation

**Owner:** Denn  
**Technical Lead:** TARS  
**Support Email:** hello@kernlo.app  
**Status Page:** (if available)

---

Last Updated: 2026-04-12  
Next Review: 2026-04-15
