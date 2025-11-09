# User Acceptance Testing (UAT) Plan

## Overview

**Purpose:** Validate that NataCarePM meets business requirements and is ready for production deployment.

**Duration:** 2 weeks (10 working days)
**Participants:** 5 testers (mix of roles: Admin, Manager, User)
**Environment:** Staging (https://staging.natacarepm.web.app)

---

## UAT Objectives

1. **Functional Validation:** All features work as expected
2. **Usability Testing:** Interface is intuitive and easy to use
3. **Performance Testing:** System responds quickly under normal load
4. **Data Accuracy:** Calculations (budget, cashflow) are correct
5. **Workflow Validation:** Real-world scenarios complete successfully

---

## Test Participants

### Recruitment Criteria

**Tester Profiles:**
1. **Project Manager** - Experienced in construction projects
2. **Finance Manager** - Handles budgets and transactions
3. **Site Engineer** - Daily progress updates, reports
4. **Admin** - User management, system configuration
5. **Executive** - Views dashboards and reports

**Requirements:**
- Available 2-4 hours/day for 2 weeks
- Basic computer literacy
- Willing to provide honest feedback
- Sign NDA (confidentiality agreement)

### Contact Testers

**Email template:**

```
Subject: Beta Testing Opportunity - NataCarePM

Hi [Name],

We're launching NataCarePM, a new project management system for construction, and would love your feedback!

As a beta tester, you'll:
- Get early access to the platform
- Influence the final product with your feedback
- Receive [incentive: gift card, free subscription, etc.]

Time commitment: 2-4 hours/day for 2 weeks (Jan 20 - Feb 2, 2024)

Interested? Reply to this email and we'll send you access details.

Thanks!
NataCarePM Team
```

---

## Test Scenarios

### Scenario 1: Onboarding (Day 1)

**Goal:** New user can login and understand the system

**Steps:**
1. Receive invitation email
2. Click invitation link → Set password
3. Complete profile (name, role, company)
4. Watch tutorial video (if available)
5. Navigate through main sections (Dashboard, Projects, Finance)

**Success Criteria:**
- ✅ User logs in within 5 minutes of receiving email
- ✅ Profile setup completes without errors
- ✅ User can identify key features (Dashboard, Create Project, etc.)

**Feedback Questions:**
- Was the onboarding process clear?
- What was confusing?
- What would you improve?

---

### Scenario 2: Project Creation (Day 2-3)

**Goal:** Create and configure a construction project

**Steps:**
1. Click "Create Project"
2. Fill in project details:
   - Name: "Pembangunan Gedung Kantor"
   - Type: Construction
   - Budget: Rp 1,000,000,000
   - Start Date: Today
   - End Date: 6 months from today
   - Location: Jakarta
3. Upload project documents (RAB, contract)
4. Add team members (assign roles)
5. Set up budget categories (Material, Labor, Equipment)

**Success Criteria:**
- ✅ Project created in < 5 minutes
- ✅ All fields save correctly
- ✅ Documents upload successfully
- ✅ Team members receive notifications

**Metrics:**
- Time to complete: _____ minutes
- Errors encountered: _____
- Difficulty rating (1-5): _____

---

### Scenario 3: Financial Management (Day 4-5)

**Goal:** Track project expenses and budgets

**Steps:**
1. Add expense transaction:
   - Description: "Pembelian Semen"
   - Amount: Rp 50,000,000
   - Category: Material
   - Date: Today
   - Upload receipt (photo)
2. View budget vs actual
3. Check cashflow graph
4. Create Purchase Order (PO) for vendor
5. Generate expense report (PDF)

**Success Criteria:**
- ✅ Transaction saved and appears in list
- ✅ Budget chart updates in real-time
- ✅ PO generates correctly
- ✅ Report exports to PDF without errors

**Data Validation:**
- Budget remaining = Initial budget - Total expenses ✅
- Cashflow graph matches transaction history ✅

---

### Scenario 4: Progress Tracking (Day 6-7)

**Goal:** Update and monitor project progress

**Steps:**
1. Open project timeline (Gantt chart)
2. Update task status:
   - Foundation: 100% complete
   - Structure: 60% complete
   - Finishing: 0% not started
3. Upload progress photos
4. Add daily report:
   - Weather: Sunny
   - Workers: 25 people
   - Issues: Material delay
5. View overall project progress

**Success Criteria:**
- ✅ Timeline updates reflect changes
- ✅ Photos upload and display correctly
- ✅ Daily report saves with all fields
- ✅ Progress percentage calculates correctly

---

### Scenario 5: Reporting & Analytics (Day 8)

**Goal:** Generate insights from project data

**Steps:**
1. Go to Reports section
2. Generate "Budget Summary" report
3. Customize date range (last 30 days)
4. Export to PDF
5. Ask AI Assistant: "What projects are over budget?"
6. Review AI response and suggested actions

**Success Criteria:**
- ✅ Report generates in < 10 seconds
- ✅ Data is accurate (verify against manual calculation)
- ✅ PDF exports with charts and tables
- ✅ AI provides relevant insights

---

### Scenario 6: Collaboration (Day 9)

**Goal:** Team collaboration features work

**Steps:**
1. Add comment on project task
2. Mention teammate (@username)
3. Upload shared document
4. Receive notification when teammate responds
5. Reply to comment

**Success Criteria:**
- ✅ Comments save and display
- ✅ Notifications sent in real-time
- ✅ Documents visible to all team members
- ✅ No permission errors

---

### Scenario 7: Mobile Usage (Day 10)

**Goal:** Mobile experience is usable

**Steps:**
1. Open app on mobile browser
2. Login
3. View dashboard (check responsiveness)
4. Add quick transaction
5. Upload photo from camera
6. Check notifications

**Success Criteria:**
- ✅ Layout adapts to screen size
- ✅ Buttons are large enough to tap
- ✅ Camera upload works
- ✅ No horizontal scrolling

**Devices to test:**
- iPhone (iOS Safari)
- Android (Chrome)
- Tablet (iPad/Android)

---

## Feedback Collection

### Daily Feedback Form

**Google Form template:**

1. **Name:** _____
2. **Date:** _____
3. **Scenario tested:** _____
4. **Did it work as expected?** (Yes/No)
5. **If no, describe the issue:** _____
6. **How easy was it to complete? (1-5)**
   - 1 = Very difficult
   - 5 = Very easy
7. **What did you like?** _____
8. **What frustrated you?** _____
9. **Suggestions for improvement:** _____
10. **Bugs/errors encountered:** _____
11. **Screenshot (if applicable):** [Upload]

---

### Weekly Check-In Meeting

**Agenda (Friday, 4 PM):**
1. Review completed scenarios
2. Discuss common issues
3. Prioritize bugs for fixing
4. Adjust test plan if needed
5. Q&A session

**Attendees:**
- All testers
- Product Manager
- Lead Developer
- UX Designer

---

## Bug Reporting

### Bug Report Template

**Use GitHub Issues or Jira:**

```markdown
**Title:** [Bug] Cannot upload documents > 10MB

**Environment:** Staging (https://staging.natacarepm.web.app)
**Browser:** Chrome 120.0.6099.216
**OS:** Windows 11
**User Role:** Manager

**Steps to Reproduce:**
1. Go to Documents section
2. Click "Upload"
3. Select file (15MB PDF)
4. Click "Upload"

**Expected Result:**
File uploads successfully (max limit is 50MB)

**Actual Result:**
Error message: "Upload failed: File too large"

**Severity:**
🔴 Critical / 🟡 Major / 🟢 Minor

**Screenshots:**
[Attach screenshot]

**Additional Context:**
Works fine with files < 10MB
```

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| 🔴 **Critical** | App crashes, data loss, security issue | 24 hours |
| 🟡 **Major** | Feature doesn't work, workaround exists | 3 days |
| 🟢 **Minor** | UI glitch, typo, cosmetic issue | 1 week |

---

## Success Metrics

### Quantitative Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Task Completion Rate** | ≥ 90% | % of scenarios completed successfully |
| **User Satisfaction** | ≥ 4.0/5.0 | Average rating from feedback forms |
| **Time to Complete Tasks** | Within expected time | Compare actual vs estimated time |
| **Bug Count** | < 20 major bugs | Count from bug reports |
| **Critical Bugs** | 0 | Must all be fixed before launch |

### Qualitative Feedback

**Questions to answer:**
- Is the system intuitive enough for non-technical users?
- Are workflows aligned with real-world construction project management?
- What features are missing that users expected?
- What features are unnecessary or confusing?

---

## UAT Schedule

### Week 1

| Day | Scenario | Focus |
|-----|----------|-------|
| Mon | Scenario 1 | Onboarding |
| Tue | Scenario 2 | Project Creation |
| Wed | Scenario 2 | Project Setup (cont'd) |
| Thu | Scenario 3 | Financial Transactions |
| Fri | Scenario 3 | Reports & Budgets |

### Week 2

| Day | Scenario | Focus |
|-----|----------|-------|
| Mon | Scenario 4 | Progress Tracking |
| Tue | Scenario 5 | Analytics & AI |
| Wed | Scenario 6 | Collaboration |
| Thu | Scenario 7 | Mobile Testing |
| Fri | Final Review | Feedback compilation |

---

## Post-UAT Activities

### Week 3: Bug Fixes

**Priority:**
1. 🔴 Critical bugs (block production launch)
2. 🟡 Major bugs (high impact)
3. 🟢 Minor bugs (cosmetic)

**Process:**
1. Triage bugs with team
2. Assign to developers
3. Fix and test
4. Re-test with UAT participants (if critical)

### Week 4: Final Approval

**Stakeholder Review:**
- Present UAT findings
- Demonstrate bug fixes
- Get sign-off for production launch

**Approval Checklist:**
- [ ] All critical bugs fixed
- [ ] User satisfaction ≥ 4.0/5.0
- [ ] Performance meets targets (Lighthouse ≥ 80)
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Backup/restore tested

---

## Participant Incentives

**Compensation:**
- **Gift card:** Rp 500,000 per tester (total Rp 2,500,000)
- **Early access:** 3 months free premium features
- **Recognition:** Name in app credits (with permission)

**Thank You Email:**

```
Hi [Name],

Thank you for participating in NataCarePM UAT! Your feedback was invaluable.

As a token of appreciation:
- Rp 500,000 gift card (sent separately)
- 3 months free premium access (activated on your account)

We've implemented [X] of your suggestions, including:
- [Feature 1]
- [Feature 2]

You'll be notified when we launch to production!

Thanks again!
NataCarePM Team
```

---

## UAT Report Template

**Final UAT Report:**

```markdown
# NataCarePM UAT Report
**Date:** Feb 5, 2024
**Duration:** 2 weeks (Jan 22 - Feb 2)
**Participants:** 5 testers

## Executive Summary
- **Completion Rate:** 92% (46/50 scenarios completed)
- **User Satisfaction:** 4.3/5.0
- **Bugs Found:** 18 (3 critical, 8 major, 7 minor)
- **Status:** ✅ Ready for production (after critical fixes)

## Key Findings

### Positive Feedback
1. Intuitive dashboard design
2. Fast report generation
3. AI assistant is helpful
4. Mobile experience is good

### Issues Identified
1. Document upload limit too low (10MB vs 50MB stated)
2. Gantt chart doesn't save changes
3. PO generation has rounding errors
4. Notifications sometimes delayed

## Recommendations
1. Fix critical bugs before launch (1 week)
2. Increase file upload limit to 50MB
3. Add tutorial videos for complex features
4. Improve error messages (more user-friendly)

## Next Steps
1. Fix critical bugs (Week 3)
2. Stakeholder approval (Week 4)
3. Production launch (Week 5)

**Prepared by:** UAT Coordinator
**Approved by:** Product Manager, CTO
```

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Coordinator:** NataCarePM UAT Team
