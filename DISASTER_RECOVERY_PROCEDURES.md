# Disaster Recovery Procedures - NataCarePM

## Document Information

**Version**: 1.0  
**Last Updated**: October 18, 2025  
**Owner**: DevOps Team  
**Review Cycle**: Quarterly  
**Classification**: Internal - Critical

---

## Table of Contents

1. [Overview](#overview)
2. [Recovery Time Objectives (RTO/RPO)](#recovery-time-objectives-rtorpo)
3. [Incident Classification](#incident-classification)
4. [Recovery Procedures](#recovery-procedures)
5. [Backup Verification](#backup-verification)
6. [Testing Schedule](#testing-schedule)
7. [Communication Plan](#communication-plan)
8. [Contact Information](#contact-information)

---

## Overview

### Purpose

This document provides step-by-step procedures for recovering NataCarePM systems and data in the event of a disaster, outage, or data loss incident.

### Scope

Covers disaster recovery for:
- Firebase Firestore database
- Firebase Authentication
- Firebase Storage (documents, images)
- Application deployment
- User data and configurations

### Key Principles

1. **Safety First**: Never compromise data integrity during recovery
2. **Communication**: Keep stakeholders informed throughout the process
3. **Documentation**: Log every action taken during recovery
4. **Verification**: Always verify recovery before resuming operations
5. **Post-Mortem**: Conduct analysis after every incident

---

## Recovery Time Objectives (RTO/RPO)

### Definitions

- **RTO (Recovery Time Objective)**: Maximum acceptable downtime
- **RPO (Recovery Point Objective)**: Maximum acceptable data loss
- **MTD (Maximum Tolerable Downtime)**: Absolute maximum downtime before business impact

### Targets

| System Component | RTO | RPO | MTD | Priority |
|-----------------|-----|-----|-----|----------|
| **Firestore Database** | 4 hours | 1 hour | 8 hours | Critical |
| **Authentication** | 2 hours | 24 hours | 4 hours | Critical |
| **File Storage** | 6 hours | 24 hours | 12 hours | High |
| **Application Deployment** | 1 hour | N/A | 2 hours | High |
| **Analytics Data** | 24 hours | 7 days | 48 hours | Medium |

### SLA Commitments

- **Availability**: 99.5% uptime (≈ 3.6 hours downtime/month)
- **Data Durability**: 99.99% (1 in 10,000 chance of data loss)
- **Backup Success Rate**: 99% (automated daily backups)

---

## Incident Classification

### Severity Levels

#### **Severity 1 - Critical** 🔴
**Impact**: Complete system outage, data loss, security breach

**Examples**:
- Firestore database corruption
- Complete data center failure
- Security breach with data exfiltration
- Ransomware attack

**Response Time**: Immediate (< 15 minutes)  
**Team**: Full DR team + management

#### **Severity 2 - Major** 🟡
**Impact**: Partial outage, degraded performance, single region failure

**Examples**:
- Single Firebase region unavailable
- Authentication service degradation
- File upload failures
- Backup failures for 24+ hours

**Response Time**: < 1 hour  
**Team**: DR team lead + on-call engineer

#### **Severity 3 - Minor** 🟢
**Impact**: Individual user issues, non-critical feature unavailable

**Examples**:
- Single user data corruption
- Document upload issues
- Report generation failures
- Non-critical feature bugs

**Response Time**: < 4 hours  
**Team**: On-call engineer

---

## Recovery Procedures

### Procedure 1: Full Firestore Database Restoration

**Scenario**: Complete database loss or corruption

**Prerequisites**:
- Access to Firebase Console
- `gcloud` CLI installed and authenticated
- Recent backup available in Cloud Storage

**Estimated Time**: 2-4 hours (depending on database size)

#### Step-by-Step Process

##### Phase 1: Assessment (15 minutes)

**1.1 Verify the Incident**
```bash
# Check Firestore status
gcloud firestore operations list --project=natacare-pm

# Check for recent writes
gcloud firestore databases describe --database=(default) --project=natacare-pm

# Review Firebase Console for errors
# https://console.firebase.google.com/project/natacare-pm/firestore
```

**1.2 Identify Last Known Good Backup**
```bash
# List available backups
gsutil ls gs://natacare-pm-firestore-backups/firestore-backups/

# Check backup metadata
gsutil cat gs://natacare-pm-firestore-backups/firestore-backups/2024-10-18T02-00-00-000Z/export.overall_export_metadata
```

**1.3 Calculate Data Loss Window**
```bash
# Backup time: 2024-10-18 02:00 UTC
# Current time: 2024-10-18 14:30 UTC
# Data loss window: 12.5 hours
# Estimated records lost: ~500 (based on avg write rate)
```

**1.4 Declare Incident**
- Create incident ticket: `INC-[YYYYMMDD]-[NUMBER]`
- Notify stakeholders (see Communication Plan)
- Activate DR team
- Start incident log

##### Phase 2: Preparation (30 minutes)

**2.1 Enable Maintenance Mode**
```bash
# Deploy maintenance page
firebase hosting:channel:deploy maintenance --project=natacare-pm

# Update DNS to point to maintenance page
# Or use Firebase Hosting redirect
```

**2.2 Create Current Database Snapshot** (if accessible)
```bash
# Export current state before restoration
gcloud firestore export gs://natacare-pm-firestore-backups/pre-restore-$(date +%Y%m%d-%H%M%S) \
  --project=natacare-pm
```

**2.3 Verify Backup Integrity**
```bash
# Download backup metadata
gsutil cp gs://natacare-pm-firestore-backups/firestore-backups/2024-10-18T02-00-00-000Z/*.overall_export_metadata .

# Verify file count and size
gsutil du -sh gs://natacare-pm-firestore-backups/firestore-backups/2024-10-18T02-00-00-000Z/

# Check for corruption
gcloud firestore import gs://natacare-pm-firestore-backups/firestore-backups/2024-10-18T02-00-00-000Z/ \
  --dry-run \
  --project=natacare-pm-test
```

##### Phase 3: Restoration (1-2 hours)

**3.1 Clear Existing Database** (if necessary)
```bash
# ⚠️ DANGER: This deletes all data!
# Only proceed if current data is confirmed corrupted

# Option A: Delete via Firebase Console
# 1. Go to Firestore → Delete all collections manually

# Option B: Delete via script
firebase firestore:delete --all-collections --project=natacare-pm --yes
```

**3.2 Import Backup**
```bash
# Start import operation
gcloud firestore import \
  gs://natacare-pm-firestore-backups/firestore-backups/2024-10-18T02-00-00-000Z/ \
  --project=natacare-pm

# Monitor progress
watch -n 10 'gcloud firestore operations list --project=natacare-pm'

# Expected output:
# NAME                                        TYPE     STATE     START_TIME              END_TIME
# projects/.../operations/ASA1MTAwNDQyNDI4    IMPORT   PROCESSING   2024-10-18T14:45:00
```

**3.3 Verify Import Progress**
```bash
# Check operation status
OPERATION_NAME="projects/natacare-pm/databases/(default)/operations/ASA1MTAwNDQyNDI4"

gcloud firestore operations describe $OPERATION_NAME \
  --project=natacare-pm

# Look for:
# - state: SUCCESSFUL
# - progressDocuments: completed count
```

##### Phase 4: Verification (30-60 minutes)

**4.1 Data Integrity Checks**
```bash
# Count documents per collection
node scripts/count-documents.js

# Expected output:
# users: 150
# projects: 45
# tasks: 1,234
# documents: 567
# pos: 89
```

**4.2 Sample Data Verification**
```javascript
// Run in Firebase Console or script
const db = firebase.firestore();

// Check recent users
db.collection('users')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get()
  .then(snapshot => {
    console.log('Recent users:', snapshot.size);
    snapshot.forEach(doc => console.log(doc.id, doc.data().email));
  });

// Check projects
db.collection('projects')
  .where('status', '==', 'active')
  .get()
  .then(snapshot => console.log('Active projects:', snapshot.size));
```

**4.3 Application Testing**
- [ ] Login with test account
- [ ] Create new project
- [ ] Add task to project
- [ ] Upload document
- [ ] Create PO
- [ ] Generate report
- [ ] Verify analytics data

**4.4 User Acceptance Testing**
- [ ] Login successful
- [ ] Recent projects visible
- [ ] Tasks show correct assignees
- [ ] Documents accessible
- [ ] Reports generate correctly
- [ ] No permission errors

##### Phase 5: Recovery Completion (15-30 minutes)

**5.1 Data Gap Analysis**
```bash
# Calculate lost data window
echo "Backup time: 2024-10-18 02:00 UTC"
echo "Restore time: 2024-10-18 16:00 UTC"
echo "Data loss: 14 hours"

# Estimate affected records
# - Check audit logs for operations during gap
# - Notify affected users
```

**5.2 Disable Maintenance Mode**
```bash
# Deploy production app
npm run build
firebase deploy --only hosting --project=natacare-pm

# Verify deployment
curl https://natacare-pm.web.app/health
```

**5.3 Post-Recovery Monitoring**
```bash
# Monitor error rates
# Firebase Console → Analytics → Errors

# Monitor performance
# Firebase Console → Performance

# Check user feedback
# Support channel monitoring for 24 hours
```

**5.4 Documentation**
- [ ] Update incident log with final status
- [ ] Document data loss window
- [ ] List affected users/projects
- [ ] Close incident ticket
- [ ] Schedule post-mortem meeting

---

### Procedure 2: Partial Data Restoration (Single Collection)

**Scenario**: Specific collection corrupted, rest of database intact

**Estimated Time**: 1-2 hours

#### Steps

**1. Export Target Collection from Backup**
```bash
# Restore to temporary database first
gcloud firestore import \
  gs://natacare-pm-firestore-backups/firestore-backups/2024-10-18T02-00-00-000Z/ \
  --database=restore-temp \
  --collection-ids=projects \
  --project=natacare-pm
```

**2. Verify Restored Data**
```bash
# Query temporary database
gcloud firestore databases describe --database=restore-temp --project=natacare-pm
```

**3. Export and Re-import to Production**
```bash
# Export from temp database
gcloud firestore export \
  gs://natacare-pm-firestore-backups/temp-export-$(date +%Y%m%d) \
  --database=restore-temp \
  --collection-ids=projects \
  --project=natacare-pm

# Delete corrupted collection in production
firebase firestore:delete --project=natacare-pm projects --recursive

# Import clean data
gcloud firestore import \
  gs://natacare-pm-firestore-backups/temp-export-$(date +%Y%m%d) \
  --database=(default) \
  --collection-ids=projects \
  --project=natacare-pm
```

**4. Cleanup**
```bash
# Delete temporary database
gcloud firestore databases delete restore-temp --project=natacare-pm

# Delete temporary export
gsutil rm -r gs://natacare-pm-firestore-backups/temp-export-*
```

---

### Procedure 3: Authentication Recovery

**Scenario**: Firebase Auth service issues or user data corruption

**Estimated Time**: 30 minutes - 2 hours

#### User Account Recovery

**1. Single User Password Reset**
```bash
# Via Firebase Console
# 1. Go to Authentication → Users
# 2. Find user by email
# 3. Click "Reset Password"
# 4. User receives email with reset link

# Via Admin SDK (if console unavailable)
const admin = require('firebase-admin');

await admin.auth().generatePasswordResetLink('user@example.com');
```

**2. Bulk User Recreation** (after complete auth loss)
```javascript
// Restore from Firestore backup
const users = await db.collection('users').get();

for (const userDoc of users.docs) {
  const userData = userDoc.data();
  
  try {
    await admin.auth().createUser({
      uid: userDoc.id,
      email: userData.email,
      displayName: userData.name,
      emailVerified: true
    });
    
    console.log('Restored user:', userData.email);
  } catch (error) {
    console.error('Failed to restore:', userData.email, error);
  }
}
```

**3. 2FA Recovery**
```javascript
// Disable 2FA for affected users (temporary)
await db.collection('users').doc(userId).update({
  twoFactorEnabled: false,
  twoFactorSecret: admin.firestore.FieldValue.delete()
});

// User must re-enable 2FA on next login
```

---

### Procedure 4: File Storage Recovery

**Scenario**: Firebase Storage data loss or corruption

**Estimated Time**: 2-6 hours (depending on data volume)

#### Steps

**1. Verify Backup Availability**
```bash
# List Cloud Storage backups
gsutil ls gs://natacare-pm-storage-backups/

# Check backup size
gsutil du -sh gs://natacare-pm-storage-backups/2024-10-18/
```

**2. Restore Files**
```bash
# Sync from backup to production bucket
gsutil -m rsync -r -d \
  gs://natacare-pm-storage-backups/2024-10-18/ \
  gs://natacare-pm.appspot.com/

# -m: parallel uploads
# -r: recursive
# -d: delete extra files in destination
```

**3. Verify File Accessibility**
```javascript
// Test file access via app
const storage = firebase.storage();
const testRef = storage.ref('documents/test-doc.pdf');

testRef.getDownloadURL()
  .then(url => console.log('File accessible:', url))
  .catch(error => console.error('Access failed:', error));
```

---

### Procedure 5: Application Deployment Recovery

**Scenario**: Broken deployment, need to rollback

**Estimated Time**: 15-30 minutes

#### Steps

**1. List Recent Deployments**
```bash
# Firebase Hosting deployments
firebase hosting:channel:list --project=natacare-pm

# Cloud Functions deployments
gcloud functions list --project=natacare-pm
```

**2. Rollback to Previous Version**
```bash
# Rollback hosting
firebase hosting:rollback --project=natacare-pm

# Or deploy specific version
firebase hosting:clone source-site-id:source-channel-id target-site-id:target-channel-id
```

**3. Verify Rollback**
```bash
# Check current version
curl https://natacare-pm.web.app/version.json

# Test critical paths
curl https://natacare-pm.web.app/api/health
```

---

## Backup Verification

### Daily Automated Verification

**Script**: `scripts/verify-backup.sh`

```bash
#!/bin/bash

# Daily backup verification script
# Runs at 3 AM (1 hour after backup)

PROJECT_ID="natacare-pm"
BACKUP_BUCKET="gs://${PROJECT_ID}-firestore-backups"
TODAY=$(date +%Y-%m-%d)

echo "=== Backup Verification - $(date) ==="

# 1. Check if today's backup exists
BACKUP_PATH="${BACKUP_BUCKET}/firestore-backups/${TODAY}"
if gsutil ls "${BACKUP_PATH}" > /dev/null 2>&1; then
  echo "✅ Backup found: ${BACKUP_PATH}"
else
  echo "❌ ERROR: No backup found for ${TODAY}"
  # Send alert
  curl -X POST https://hooks.slack.com/... \
    -d "{\"text\":\"❌ Backup missing for ${TODAY}\"}"
  exit 1
fi

# 2. Check backup size
BACKUP_SIZE=$(gsutil du -s "${BACKUP_PATH}" | awk '{print $1}')
MIN_SIZE=10485760  # 10 MB minimum

if [ "${BACKUP_SIZE}" -gt "${MIN_SIZE}" ]; then
  echo "✅ Backup size: $(numfmt --to=iec ${BACKUP_SIZE})"
else
  echo "⚠️  WARNING: Backup smaller than expected: $(numfmt --to=iec ${BACKUP_SIZE})"
fi

# 3. Verify file integrity
FILE_COUNT=$(gsutil ls "${BACKUP_PATH}/**" | wc -l)
echo "✅ Files in backup: ${FILE_COUNT}"

# 4. Test restore (to temp database)
echo "Testing restore to temporary database..."
gcloud firestore import "${BACKUP_PATH}" \
  --database=backup-verify-temp \
  --async \
  --project="${PROJECT_ID}"

# 5. Log success
echo "✅ Backup verification complete"
echo "$(date),${TODAY},${BACKUP_SIZE},${FILE_COUNT},success" >> backup-verification.log
```

### Weekly Manual Verification

**Checklist** (Every Monday):

- [ ] Review backup logs from past 7 days
- [ ] Verify all daily backups present
- [ ] Check backup sizes trending correctly
- [ ] Test restore to staging environment
- [ ] Verify restored data matches production
- [ ] Document any anomalies
- [ ] Update verification log

### Monthly Full Restore Test

**Procedure** (First Sunday of month):

1. **Prepare Test Environment**
   ```bash
   gcloud firestore databases create test-restore --location=us-central1
   ```

2. **Restore Previous Month's Backup**
   ```bash
   LAST_MONTH=$(date -d "last month" +%Y-%m-01)
   gcloud firestore import \
     gs://natacare-pm-firestore-backups/firestore-backups/${LAST_MONTH}T02-00-00-000Z/ \
     --database=test-restore
   ```

3. **Verification Tests**
   - Run data integrity checks
   - Verify record counts match
   - Test application against restored data
   - Measure restore duration (should be < RTO)

4. **Cleanup**
   ```bash
   gcloud firestore databases delete test-restore
   ```

5. **Document Results**
   - Restore duration: _____ minutes
   - Data integrity: Pass/Fail
   - Issues encountered: _____
   - Action items: _____

---

## Testing Schedule

### Disaster Recovery Drills

| Test Type | Frequency | Duration | Participants | Success Criteria |
|-----------|-----------|----------|--------------|------------------|
| **Tabletop Exercise** | Monthly | 1 hour | DR Team | All steps documented, < 5 questions |
| **Backup Restore Test** | Monthly | 2 hours | DevOps | RTO < 4h, RPO < 1h, 100% data integrity |
| **Full DR Simulation** | Quarterly | 4 hours | All Teams | Complete recovery, communications work |
| **Regional Failover** | Semi-Annual | 6 hours | Full DR Team | < 2h failover, zero data loss |

### Drill Scenarios

**Scenario 1: Database Corruption** (Monthly)
- Severity: Critical
- Trigger: Manual database deletion in test environment
- Expected Outcome: Full restoration within 4 hours

**Scenario 2: Regional Outage** (Quarterly)
- Severity: Major
- Trigger: Simulate Firebase region unavailability
- Expected Outcome: Failover to secondary region < 2 hours

**Scenario 3: Ransomware Attack** (Semi-Annual)
- Severity: Critical
- Trigger: Security team simulates data encryption
- Expected Outcome: Restore from clean backup, security measures validated

---

## Communication Plan

### Stakeholder Notification Matrix

| Severity | Stakeholders | Method | Timing |
|----------|--------------|--------|--------|
| **Critical** | CEO, CTO, All Users | Email, SMS, In-App | Immediate (< 15 min) |
| **Major** | Management, Power Users | Email, In-App | < 1 hour |
| **Minor** | Affected Users | In-App Notification | < 4 hours |

### Communication Templates

#### Critical Incident - Initial Notification

**Subject**: [CRITICAL] NataCarePM Service Disruption - [DATE]

```
Dear NataCarePM Users,

We are currently experiencing a critical service disruption affecting [AFFECTED SYSTEMS].

IMPACT:
- Services Affected: [LIST]
- Status: [INVESTIGATING/RESOLVING/MONITORING]
- Estimated Restoration: [TIME] UTC

WHAT WE'RE DOING:
- Disaster recovery team activated
- Restoring from backup created at [TIME]
- Root cause investigation underway

WHAT YOU SHOULD DO:
- Do not attempt to use affected features
- Save any in-progress work
- Monitor status page: https://status.natacare-pm.com

We will provide updates every 30 minutes.

Updates:
[TIMESTAMP]: [STATUS UPDATE]

Thank you for your patience.

NataCarePM Operations Team
support@natacare-pm.com
```

#### Major Incident - Progress Update

**Subject**: [UPDATE] NataCarePM Service Restoration - [TIME]

```
Progress Update - [TIMESTAMP]

STATUS: [In Progress/50% Complete/Testing]

COMPLETED STEPS:
✅ Backup identified and verified
✅ Database restoration initiated
✅ [Additional completed steps]

IN PROGRESS:
🔄 Data verification
🔄 Application testing

NEXT STEPS:
⏭️ User acceptance testing
⏭️ Production deployment
⏭️ Monitoring

ESTIMATED COMPLETION: [TIME] UTC

Next update in 30 minutes or when status changes.
```

#### Resolution Notification

**Subject**: [RESOLVED] NataCarePM Service Restored

```
Dear NataCarePM Users,

We are pleased to inform you that the service disruption has been RESOLVED.

INCIDENT SUMMARY:
- Start Time: [TIME] UTC
- End Time: [TIME] UTC
- Duration: [X] hours [Y] minutes
- Cause: [BRIEF DESCRIPTION]

DATA IMPACT:
- Data Loss Window: [NONE / X hours]
- Affected Records: [NUMBER or NONE]
- User Action Required: [YES/NO - DETAILS]

WHAT HAPPENED:
[Brief, non-technical explanation]

WHAT WE'VE DONE:
- [Immediate fixes]
- [Preventive measures]

WHAT'S NEXT:
- Post-mortem analysis scheduled for [DATE]
- Additional safeguards being implemented
- Detailed report available in 48 hours

We sincerely apologize for the inconvenience and appreciate your patience.

If you experience any issues, please contact support immediately.

NataCarePM Operations Team
```

---

## Contact Information

### Disaster Recovery Team

| Role | Name | Phone | Email | Backup |
|------|------|-------|-------|--------|
| **DR Lead** | [Name] | +62-XXX-XXXX-XXXX | dr-lead@company.com | [Backup Name] |
| **Firebase Admin** | [Name] | +62-XXX-XXXX-XXXX | firebase@company.com | [Backup Name] |
| **DevOps Engineer** | [Name] | +62-XXX-XXXX-XXXX | devops@company.com | [Backup Name] |
| **Security Lead** | [Name] | +62-XXX-XXXX-XXXX | security@company.com | [Backup Name] |
| **Communications** | [Name] | +62-XXX-XXXX-XXXX | comms@company.com | [Backup Name] |

### Escalation Path

```
Level 1: On-Call Engineer (0-30 min)
    ↓
Level 2: DR Team Lead (30-60 min)
    ↓
Level 3: CTO (1-2 hours)
    ↓
Level 4: CEO (2+ hours or critical incidents)
```

### External Contacts

| Service | Contact | Phone | Support URL |
|---------|---------|-------|-------------|
| **Firebase** | Google Cloud Support | +1-XXX-XXX-XXXX | https://firebase.google.com/support |
| **Cloud Storage** | Google Cloud Support | +1-XXX-XXX-XXXX | https://cloud.google.com/support |
| **DNS Provider** | [Provider] | +XX-XXX-XXX-XXXX | [Support URL] |
| **CDN Provider** | [Provider] | +XX-XXX-XXX-XXXX | [Support URL] |

---

## Appendices

### Appendix A: Pre-Disaster Checklist

**Daily**:
- [ ] Verify automated backups completed
- [ ] Review Firebase monitoring alerts
- [ ] Check error rates in logs

**Weekly**:
- [ ] Test backup restoration to staging
- [ ] Review and update DR contact list
- [ ] Check backup storage capacity

**Monthly**:
- [ ] Conduct DR drill
- [ ] Review and update procedures
- [ ] Audit access controls
- [ ] Test communication channels

**Quarterly**:
- [ ] Full DR simulation exercise
- [ ] Review RTO/RPO compliance
- [ ] Update disaster recovery plan
- [ ] Audit backup retention policies

### Appendix B: Recovery Runbook Quick Reference

```
┌─────────────────────────────────────────────────┐
│         DISASTER RECOVERY QUICK GUIDE           │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. ASSESS                                      │
│     ├─ Verify incident                          │
│     ├─ Classify severity                        │
│     └─ Activate team                            │
│                                                 │
│  2. COMMUNICATE                                 │
│     ├─ Notify stakeholders                      │
│     ├─ Enable maintenance mode                  │
│     └─ Start incident log                       │
│                                                 │
│  3. BACKUP                                      │
│     ├─ Identify last good backup                │
│     ├─ Verify integrity                         │
│     └─ Snapshot current state (if possible)     │
│                                                 │
│  4. RESTORE                                     │
│     ├─ Import backup data                       │
│     ├─ Monitor operation                        │
│     └─ Verify completion                        │
│                                                 │
│  5. VERIFY                                      │
│     ├─ Data integrity checks                    │
│     ├─ Application testing                      │
│     └─ User acceptance testing                  │
│                                                 │
│  6. RESUME                                      │
│     ├─ Disable maintenance mode                 │
│     ├─ Monitor systems                          │
│     └─ Notify users                             │
│                                                 │
│  7. REVIEW                                      │
│     ├─ Document data loss                       │
│     ├─ Close incident                           │
│     └─ Schedule post-mortem                     │
│                                                 │
└─────────────────────────────────────────────────┘

Emergency Contacts:
DR Lead: [PHONE]
Firebase Support: [PHONE]
```

### Appendix C: Useful Commands Cheatsheet

```bash
# === BACKUP OPERATIONS ===

# List backups
gsutil ls gs://PROJECT-firestore-backups/firestore-backups/

# Check backup size
gsutil du -sh gs://PROJECT-firestore-backups/firestore-backups/DATE/

# Verify backup
gsutil cat gs://PROJECT-firestore-backups/firestore-backups/DATE/*.overall_export_metadata

# === RESTORE OPERATIONS ===

# Import backup
gcloud firestore import gs://BUCKET/PATH --project=PROJECT

# Check import status
gcloud firestore operations list --project=PROJECT

# Describe operation
gcloud firestore operations describe OPERATION_NAME --project=PROJECT

# === MONITORING ===

# Check Firestore status
gcloud firestore databases describe --project=PROJECT

# View recent operations
gcloud firestore operations list --project=PROJECT --filter="startTime>2024-10-18"

# === CLEANUP ===

# Delete collection
firebase firestore:delete COLLECTION --recursive --project=PROJECT

# Delete database
gcloud firestore databases delete DATABASE_ID --project=PROJECT
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-10-18 | DevOps Team | Initial disaster recovery procedures |

## Review and Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Author** | DevOps Lead | _________ | ______ |
| **Reviewer** | Security Lead | _________ | ______ |
| **Approver** | CTO | _________ | ______ |

---

**Next Review Date**: January 18, 2026

**Document Classification**: Internal - Critical Infrastructure

**Storage Location**: `docs/DR_PROCEDURES.md` + Secure offline copy
