# Kernlo E2E Test Checklist

## Auth Flow
- [ ] Signup with valid email/password
- [ ] Signup fails with duplicate email
- [ ] Signup fails with short password (<6 chars)
- [ ] Login with valid credentials
- [ ] Login fails with wrong password
- [ ] Logout clears session
- [ ] Forgot password link works
- [ ] Trial starts on signup (30 days)

## Dashboard (Home)
- [ ] Load dashboard after login
- [ ] Display trial status message
- [ ] Show kids count, goals count, total hours
- [ ] Display kid cards with activity count
- [ ] Add kid (name required)
- [ ] Add kid respects 5-kid limit
- [ ] Delete kid removes all associated data
- [ ] Navigation to kid detail page works

## Kid Detail Page
- [ ] Load kid details (name, age, grade)
- [ ] Quick log form visible and functional
- [ ] Log activity with all fields (date, subject, duration, platform, notes)
- [ ] Activity appears in list immediately (real-time)
- [ ] Delete activity works
- [ ] Navigation to goals page works
- [ ] Navigation to compliance page works
- [ ] Back link returns to dashboard

## Goals Page
- [ ] Load kid's goals
- [ ] Add goal (subject + hours required)
- [ ] Goal appears in list with progress bar
- [ ] Progress calculation accurate (hours logged / goal)
- [ ] Delete goal removes from list
- [ ] Multiple goals per kid work

## Compliance Page
- [ ] Load state selection dropdown
- [ ] Change state updates requirements display
- [ ] Display state-specific hour requirements
- [ ] Calculate progress for each subject
- [ ] Show met/not met status correctly
- [ ] Progress bars update with activities
- [ ] CA, TX, FL, NY states all work

## Trial System
- [ ] New user sees "X days left in trial" message
- [ ] Trial countdown decreases daily
- [ ] Trial expires after 30 days
- [ ] Expired trial shows upgrade modal
- [ ] Expired user can't access dashboard (blocked by modal)
- [ ] Upgrade button redirects to /upgrade
- [ ] Logout button works from upgrade modal

## Upgrade Flow
- [ ] Upgrade page loads with pricing info
- [ ] "Upgrade to Pro" button works
- [ ] After upgrade, user marked as paid
- [ ] Paid user doesn't see trial message
- [ ] Paid user can access dashboard indefinitely
- [ ] Upgrade gate no longer appears

## Mobile Responsiveness
- [ ] iPhone SE (375px width) - single column layout
- [ ] iPhone 12 (390px width) - single column layout
- [ ] iPad (768px width) - two column layout
- [ ] Desktop (1280px width) - three+ column layout
- [ ] Buttons are touch-friendly (44px+ height)
- [ ] Forms are readable and usable on mobile
- [ ] No horizontal overflow
- [ ] Modals work on mobile

## PWA Installation
- [ ] PWA install prompt appears on mobile
- [ ] App installs to home screen
- [ ] App launches in standalone mode
- [ ] Offline page shows when disconnected
- [ ] Service worker caches assets
- [ ] Cached pages load offline

## Data Persistence
- [ ] Log activity on phone
- [ ] Switch to desktop/tablet
- [ ] Activity appears immediately (real-time sync)
- [ ] Edit goal on phone
- [ ] Changes reflect on desktop instantly
- [ ] Data survives browser refresh
- [ ] Data survives app close/reopen

## PDF Export
- [ ] Generate compliance report
- [ ] PDF downloads with correct filename
- [ ] PDF contains kid name and date range
- [ ] PDF includes all logged activities
- [ ] PDF formatted for evaluator review
- [ ] Multiple kids generate separate PDFs

## Performance
- [ ] Dashboard loads in <2 seconds
- [ ] Kid detail page loads in <1 second
- [ ] Add activity completes in <500ms
- [ ] Real-time sync updates visible <500ms
- [ ] Mobile app smooth 60fps scrolling

## Legal/Compliance
- [ ] Privacy policy page loads
- [ ] Terms of service page loads
- [ ] Links in footer work
- [ ] Privacy/Terms properly formatted

## Error Handling
- [ ] Network error shows graceful message
- [ ] Missing required field shows validation
- [ ] Delete confirmation prevents accidental deletion
- [ ] Session expired redirects to login
- [ ] 404 page displays for invalid routes

## Accessibility
- [ ] Form labels properly associated with inputs
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader compatible headings
- [ ] Focus indicators visible

---

## Test Results

**Tester:** TARS  
**Date:** 2026-04-12  
**Build:** Commit ba6299e  

### Summary
- Total tests: 85
- Passed: ___
- Failed: ___
- Blocked: ___

### Notes
(Fill in after testing)

### Known Issues
(List any blockers or bugs found)

---

## Browser/Device Matrix

| Browser | iOS | Android | macOS | Windows | Linux |
|---------|-----|---------|-------|---------|-------|
| Safari  | [ ] | -       | [ ]   | -       | -     |
| Chrome  | [ ] | [ ]     | [ ]   | [ ]     | [ ]   |
| Firefox | [ ] | [ ]     | [ ]   | [ ]     | [ ]   |
| Edge    | -   | -       | -     | [ ]     | -     |

---

## Load Testing (Local)

- [ ] Load with 1 kid, 10 activities
- [ ] Load with 5 kids, 100 activities each
- [ ] Load with 5 kids, 500 activities each
- [ ] Real-time sync with 10 concurrent edits

---

## Security Checks

- [ ] No API keys in client code
- [ ] RLS policies enforce user isolation
- [ ] Logout clears auth session
- [ ] Trial bypass not possible
- [ ] Direct DB access blocked for unpaid users
