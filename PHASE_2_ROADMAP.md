# Kernlo Phase 2 Roadmap

**Timeline:** 6-12 months post-launch (starting ~June 2026)  
**Status:** Planning phase  
**Owner:** Denn + Engineering team

---

## Overview

Phase 2 transforms Kernlo from a compliance-focused tool into a **learning insights platform**. We'll add analytics, multi-user collaboration, and a B2B school tier—all without curriculum integrations (Phase 3).

**Revenue Target:** $3K-5K/mo by end of Phase 2 (30 Pro + 5 Team customers)

---

## High Priority (Defensible, Differentiating)

### 1. Insights & Analytics Dashboard
**Why:** Parents want to understand learning patterns, not just check compliance.

**Features:**
- Weekly/monthly trend charts (hours per subject)
- Subject performance ranking ("Math strong, History weak")
- Hour forecasting ("at this pace, you'll hit compliance by June 15")
- Activity heatmaps (when kid learns most: weekends? mornings?)
- Completion predictions (red/yellow/green status)

**Timeline:** 3-4 weeks  
**Effort:** Medium (charting library + data aggregation)  
**Business Impact:** Justifies $15/mo subscription (not just compliance checkbox)

**Acceptance Criteria:**
- [ ] Dashboard shows 4+ chart types
- [ ] Forecasting accurate within ±2 days
- [ ] Mobile responsive charts
- [ ] Real-time updates (Supabase)

---

### 2. Mobile Native Apps (iOS + Android)
**Why:** Competitors have native apps. Parents expect them. Logging from phone is critical UX.

**Tech:** React Native (shared codebase iOS/Android)  
**Features:**
- Offline activity logging (sync when online)
- Push notifications ("5 hours short on Math")
- Home screen widgets (quick stats)
- Camera roll integration (photo proof of learning)
- Biometric unlock (fingerprint/face)

**Timeline:** 6-8 weeks  
**Effort:** High (new codebase, testing across devices)  
**Business Impact:** App store presence, higher engagement, justifies Team tier

**Acceptance Criteria:**
- [ ] iOS app in App Store
- [ ] Android app in Google Play
- [ ] Offline sync works
- [ ] Push notifications working
- [ ] 4+ star ratings

---

### 3. Multi-User Workspace (Co-Parent Sharing)
**Why:** Many homeschools have two parents. Real blocker for family purchase.

**Schema Changes:**
- New `workspace_members` table (user permissions)
- New `workspace_roles` table (admin, editor, viewer)
- Foreign key: `kids.workspace_id` (not just `user_id`)

**Features:**
- Invite co-parent via email
- Permission levels (admin, editor, viewer)
- Shared dashboard (both see all kids)
- Activity log (who logged what, when)
- Real-time sync (edit on phone → see on tablet instantly)

**Timeline:** 4-5 weeks  
**Effort:** Medium (schema refactor + permission logic)  
**Business Impact:** Higher household penetration, reduces churn

**Acceptance Criteria:**
- [ ] Co-parent can be invited
- [ ] Permissions enforced (can't delete without admin)
- [ ] Real-time sync across users
- [ ] Audit trail visible
- [ ] No data leakage between workspaces

---

### 4. Team Tier for Schools (Umbrella Schools + Co-ops)
**Why:** School = $300+/yr revenue vs. parent = $180/yr. Better unit economics.

**Pricing:**
- Team: $29.99/mo (up to 25 kids/families)
- Enterprise: $99.99/mo (50+ kids, priority support)

**Features:**
- School admin dashboard
- See all enrolled families' compliance at a glance
- Bulk export for evaluator submission (PDF + CSV)
- Family management (add/remove families)
- Report scheduling (auto-generate compliance reports monthly)
- Custom branding (school logo in reports)

**Schema Changes:**
- New `schools` table
- New `school_families` table (many-to-many)
- New `school_settings` table

**Timeline:** 6-8 weeks  
**Effort:** High (new UX tier, admin dashboard)  
**Business Impact:** New revenue stream, higher LTV, viral growth via schools

**Acceptance Criteria:**
- [ ] School admin can manage families
- [ ] Compliance view shows all families
- [ ] Bulk export works
- [ ] Custom branding applies
- [ ] 3+ schools onboarded by end of Phase 2

---

## Medium Priority (Nice to Have)

### 5. Better Compliance Engine
**Why:** Current system only counts hours. States have nuance.

**Features:**
- State rules engine (not just hour counts)
  - CA: "All major subjects required"
  - TX: "Lab science required"
  - FL: "PE counted if 3x/week"
- Subject coverage verification ("all core subjects logged?")
- Compliance alerts ("3 weeks left, 10 hours short on Science")
- Export formats per state (CA Form XYZ vs. TX Form ABC)

**Timeline:** 3-4 weeks  
**Effort:** Medium (rules config + validation logic)  
**Business Impact:** Higher accuracy, fewer parent support tickets

---

### 6. Activity Templates & Bulk Logging
**Why:** Reduces friction for common scenarios.

**Features:**
- Pre-built templates ("Math session", "Science experiment", "Piano lesson")
- Quick presets (Khan Academy → auto-fill subject + duration estimate)
- Bulk log UI ("log 5 activities from last week at once")
- Favorites (save frequently-used templates)

**Timeline:** 2-3 weeks  
**Effort:** Low  
**Business Impact:** Faster activity logging, higher engagement

---

### 7. Real Email System (SendGrid Integration)
**Why:** Password resets + notifications improve UX and retention.

**Features:**
- Password reset emails (real links, Phase 1 was mock)
- Trial expiration reminder (day 25: "5 days left")
- Weekly digest ("here's what your kid learned")
- Compliance warnings ("you're off track")
- Payment receipts (when user upgrades)

**Timeline:** 2-3 weeks  
**Effort:** Low (SendGrid setup + email templates)  
**Business Impact:** Reduces churn, improves conversion (trial reminders)

---

## Lower Priority (Polish)

### 8. Advanced Analytics Dashboard
**Why:** Power users want deep insights.

**Features:**
- Learning velocity (hours/week trend line)
- Subject mastery estimates (derived from activity frequency)
- Seasonal patterns (summer vs. school year)
- Engagement metrics (logging consistency)
- Peer comparison (anonymized: "your kid logs 2x avg")

**Timeline:** 4-6 weeks  
**Effort:** Medium  
**Business Impact:** Upsell to data-driven parents

---

### 9. Curriculum Connectors (Non-Integrating)
**Why:** Speed up logging without full integrations.

**Features:**
- "Log from IXL" button → pre-fills subject/duration from last lesson
- Outschool class linking → auto-adds hours/subject
- Presets for popular curricula (Homeschool+ lessons, BookShark chapters)
- Still manual entry, but faster (not auto-logging)

**Timeline:** 3-4 weeks per connector  
**Effort:** Medium (data parsing from platforms)  
**Business Impact:** Differentiation from competitors, reduced logging friction

**Note:** NOT the same as Phase 3 auto-logging. This is UI shortcuts, not API integrations.

---

### 10. Advanced Reporting & PDF Customization
**Why:** Schools want flexible report formats.

**Features:**
- PDF report templates (5+ styles: traditional, modern, academic)
- Custom date ranges + subject selection
- Evaluation-ready formatting (per state)
- Batch PDF export (all kids at once)
- Watermark options (school name, date)

**Timeline:** 2-3 weeks  
**Effort:** Low (PDF templating)  
**Business Impact:** Team tier differentiator

---

## Implementation Strategy

### Wave 1 (Months 1-2): Analytics + Multi-User
1. Insights & Analytics Dashboard
2. Multi-User Workspace
3. Real Email System

**Why:** Strengthens core Pro tier, enables family adoption

### Wave 2 (Months 3-4): Mobile + Team Tier
1. Mobile Native Apps (iOS + Android)
2. Team Tier for Schools
3. Better Compliance Engine

**Why:** Major feature parity + new revenue stream

### Wave 3 (Months 5-6): Polish + Connectors
1. Activity Templates
2. Curriculum Connectors
3. Advanced Analytics
4. Report Customization

**Why:** Nice-to-haves that improve stickiness

---

## Business Metrics (Phase 2 Success)

### Customer Acquisition
- **Target:** 300 trial users (3x Phase 1)
- **Conversion:** 5-10% trial → Pro ($15/mo)
- **Team Tier:** 5-10 school customers

### Revenue
- **Pro tier:** 20-30 customers × $15/mo = $300-450/mo
- **Team tier:** 5-10 customers × $30/mo = $150-300/mo
- **Total MRR:** $450-750/mo by end of Phase 2
- **Target:** $3K-5K/mo by month 12 (growth phase)

### Engagement
- **Daily active users:** 50-100 (vs. 10-20 Phase 1)
- **Activity logging:** 40%+ of users log weekly
- **Churn:** <5% monthly (Phase 1: TBD)

### Product
- **App rating:** 4+ stars on both App Stores
- **School adoption:** 5-10 umbrella schools
- **Feature coverage:** 80% of roadmap complete

---

## Known Challenges

### Technical
- **Multi-user data isolation:** RLS policies must prevent cross-workspace access
- **Mobile sync reliability:** Offline queue must handle edge cases
- **React Native parity:** iOS/Android behavior must be identical

### Business
- **School sales:** Requires different GTM (direct sales vs. organic)
- **Churn management:** Insights features must drive retention
- **Competitive response:** Homeschool Moment/Homeschooly will copy features

### Staffing
- **Mobile development:** Requires dedicated React Native engineer
- **School support:** Team tier customers need account management
- **Product management:** Prioritization across 3 tiers gets complex

---

## Success Criteria (End of Phase 2)

- [x] Insights dashboard live and used by 50%+ of Pro customers
- [x] iOS app in App Store, Android app in Google Play
- [x] Co-parent sharing tested with 20+ families
- [x] 5+ schools paying Team tier
- [x] MRR $1K+ (realistic for month 6)
- [x] Churn <5% monthly
- [x] NPS >40 (customer satisfaction)

---

## Not in Phase 2 (Phase 3+)

- **Curriculum auto-logging** (IXL, Khan Academy APIs) — requires partnerships
- **AI tutoring recommendations** — requires ML model training
- **Video lessons** — out of scope
- **Marketplace integrations** — future opportunity

---

## Budget & Resources (Estimate)

**Headcount:**
- 1 full-stack engineer (multi-user + team tier)
- 1 mobile engineer (React Native iOS/Android)
- 1 product manager (planning + prioritization)
- 0.5 designer (Team tier UX)

**Quarterly burn (rough):**
- Salaries: $60K/quarter (3 FTE avg)
- Infrastructure: $2K/quarter (Supabase, Vercel scaling)
- Tools & services: $1K/quarter (SendGrid, analytics, etc.)
- **Total:** ~$63K/quarter

**Break-even:** $1K MRR × 12 months = $12K/year → Break even at ~8 months (realistic)

---

## Decision Log

### Defer Auto-Logging to Phase 3
**Decision:** Don't integrate with IXL/Khan in Phase 2  
**Rationale:** 
- Requires API partnerships (negotiation time)
- Limited automation value (still manual verification)
- Multi-user + Team tier more impactful for revenue
- Can add connectors in Phase 3 if validated

### Prioritize Mobile Apps
**Decision:** React Native (shared codebase) vs. separate native teams  
**Rationale:**
- Shared codebase = 1 mobile engineer instead of 2
- Faster iteration (OTA updates for non-App Store builds)
- Trade-off: 5% slower perf, but acceptable for MVP

### Team Tier Over Enterprise
**Decision:** $30/mo schools vs. $99/mo enterprise  
**Rationale:**
- 25-kid limit captures 95% of umbrella schools
- Simpler to sell and support
- Enterprise upgrade available in Phase 3 if demand

---

## Owner & Review Schedule

**Owner:** Denn (prioritization), Engineering lead (execution)  
**Phase 2 Kickoff:** June 1, 2026 (post Phase 1 validation)  
**Monthly Reviews:** 1st of each month (adjust priorities based on metrics)  
**Final Review:** End of August 2026 (decide Phase 3)

---

Last Updated: 2026-04-14  
Next Review: Post-launch (2026-04-20)
