# Firestore Backup & Restore Strategy

## Overview
Automated daily backups dengan retention policy 30 hari, verification checks, dan documented restore procedures.

## Architecture

```
┌─────────────────┐
│ Cloud Scheduler │──> Trigger daily @ 02:00 UTC
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Cloud Function  │──> Execute backup
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Cloud Storage   │──> gs://natacare-backups/
│                 │    ├── firestore/
│                 │    │   ├── 2024-12-01/
│                 │    │   ├── 2024-12-02/
│                 │    │   └── 2024-12-03/
│                 │    └── metadata/
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Verification    │──> Check backup integrity
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ Notification    │──> Email/Slack alert
└─────────────────┘
```

## Backup Configuration

### Daily Automated Backups
- **Schedule:** 02:00 UTC daily
- **Retention:** 30 days
- **Format:** Native Firestore export
- **Location:** `gs://natacare-backups/firestore/YYYY-MM-DD/`
- **Collections:** All collections

### Backup Types
1. **Full Backup** (Daily): Complete database export
2. **Incremental** (Every 6 hours): Only changed documents
3. **Critical Collections** (Hourly): Projects, transactions, users

## Setup Instructions

### 1. Create Cloud Storage Bucket
```bash
# Create backup bucket
gsutil mb -l asia-southeast2 gs://natacare-backups

# Set lifecycle policy (30-day retention)
gsutil lifecycle set backup-lifecycle.json gs://natacare-backups

# Set permissions
gsutil iam ch serviceAccount:firebase-adminsdk@natacare-pm.iam.gserviceaccount.com:objectAdmin gs://natacare-backups
```

### 2. Deploy Backup Function
```bash
cd functions
npm install
firebase deploy --only functions:scheduledFirestoreBackup
```

### 3. Setup Cloud Scheduler
```bash
# Create daily backup job
gcloud scheduler jobs create http firestore-daily-backup \
  --schedule="0 2 * * *" \
  --uri="https://asia-southeast2-natacare-pm.cloudfunctions.net/scheduledFirestoreBackup" \
  --http-method=POST \
  --time-zone="Asia/Jakarta" \
  --oidc-service-account-email="firebase-adminsdk@natacare-pm.iam.gserviceaccount.com"

# Create incremental backup (every 6 hours)
gcloud scheduler jobs create http firestore-incremental-backup \
  --schedule="0 */6 * * *" \
  --uri="https://asia-southeast2-natacare-pm.cloudfunctions.net/incrementalBackup" \
  --http-method=POST \
  --time-zone="Asia/Jakarta" \
  --oidc-service-account-email="firebase-adminsdk@natacare-pm.iam.gserviceaccount.com"

# Create critical collections backup (hourly)
gcloud scheduler jobs create http firestore-critical-backup \
  --schedule="0 * * * *" \
  --uri="https://asia-southeast2-natacare-pm.cloudfunctions.net/criticalBackup" \
  --http-method=POST \
  --time-zone="Asia/Jakarta" \
  --oidc-service-account-email="firebase-adminsdk@natacare-pm.iam.gserviceaccount.com"
```

## Manual Backup

### Full Database Export
```bash
# Export all collections
gcloud firestore export gs://natacare-backups/firestore/manual-$(date +%Y%m%d-%H%M%S)

# Export specific collections
gcloud firestore export gs://natacare-backups/firestore/manual-$(date +%Y%m%d-%H%M%S) \
  --collection-ids=projects,users,transactions
```

### Using Firebase Admin SDK
```bash
# Run backup script
node scripts/backup-firestore.js

# With options
node scripts/backup-firestore.js --collections=projects,users --output=./backups
```

## Restore Procedures

### Full Database Restore
```bash
# List available backups
gsutil ls gs://natacare-backups/firestore/

# Restore from specific backup
gcloud firestore import gs://natacare-backups/firestore/2024-12-01

# Restore to different project (staging)
gcloud firestore import gs://natacare-backups/firestore/2024-12-01 \
  --project=natacare-staging
```

### Selective Collection Restore
```bash
# Restore only specific collections
gcloud firestore import gs://natacare-backups/firestore/2024-12-01 \
  --collection-ids=projects,users
```

### Point-in-Time Recovery
```bash
# Find backup timestamp
gsutil ls -l gs://natacare-backups/firestore/

# Restore to specific time
gcloud firestore import gs://natacare-backups/firestore/2024-12-01T14-30-00
```

## Backup Verification

### Automated Checks
Cloud Function runs post-backup verification:
1. **File Count Check:** Verify all collection exports exist
2. **Size Validation:** Compare with previous backups
3. **Metadata Verification:** Check export metadata
4. **Random Document Check:** Sample 100 documents for integrity

### Manual Verification
```bash
# Check backup metadata
gsutil cat gs://natacare-backups/firestore/2024-12-01/metadata.json

# Verify file count
gsutil ls -r gs://natacare-backups/firestore/2024-12-01/ | wc -l

# Compare with production
node scripts/verify-backup.js --date=2024-12-01
```

## Disaster Recovery Scenarios

### Scenario 1: Complete Data Loss
1. Stop all write operations
2. Identify last good backup
3. Restore from backup to staging
4. Verify data integrity
5. Switch DNS to staging
6. Restore to production
7. Resume operations

**Estimated Recovery Time:** 30-60 minutes

### Scenario 2: Collection Corruption
1. Identify affected collection
2. Find backup before corruption
3. Export affected collection
4. Restore collection from backup
5. Verify data
6. Resume operations

**Estimated Recovery Time:** 15-30 minutes

### Scenario 3: Accidental Deletion
1. Identify deletion timestamp
2. Find backup immediately before
3. Restore specific documents/collection
4. Verify restore
5. Resume operations

**Estimated Recovery Time:** 10-20 minutes

## Monitoring & Alerts

### Backup Success Metrics
- Backup completion time
- Backup size trends
- Failed backup count
- Verification pass rate

### Alert Conditions
- **Critical:** Backup failed 2+ consecutive times
- **Warning:** Backup size decreased >20%
- **Info:** Backup completed successfully

### Notification Channels
- Email: admin@natacare.com
- Slack: #natacare-alerts
- SMS: On-call admin (for critical)

## Backup Testing

### Monthly DR Drill
1. **Week 1:** Test full restore to staging
2. **Week 2:** Test selective collection restore
3. **Week 3:** Test point-in-time recovery
4. **Week 4:** Test backup verification scripts

### Annual DR Exercise
- Complete disaster recovery simulation
- Cross-region restore test
- Team training on restore procedures
- Documentation review and update

## Security

### Access Control
- Backup bucket: Admin-only access
- Service account: Minimal permissions
- Encryption: Google-managed keys
- Audit logs: Enabled for all access

### Compliance
- GDPR: 30-day retention, encrypted at rest
- SOC 2: Automated backups, verified restores
- ISO 27001: Access controls, audit trails

## Cost Estimation

### Storage Costs
- Backup storage: ~$0.026/GB/month
- Estimated size: 50GB → $1.30/month
- 30-day retention: 1.5TB → $39/month

### Operation Costs
- Daily export: ~$0.10/GB
- Monthly cost: ~$150/month

**Total Estimated Cost:** ~$190/month

## Maintenance

### Weekly
- [ ] Review backup logs
- [ ] Check storage usage
- [ ] Verify last 7 backups

### Monthly
- [ ] Test restore procedure
- [ ] Clean up old backups (auto)
- [ ] Review retention policy
- [ ] Update documentation

### Quarterly
- [ ] DR drill
- [ ] Cost analysis
- [ ] Policy review
- [ ] Team training

## Troubleshooting

### Backup Failed
```bash
# Check Cloud Function logs
gcloud functions logs read scheduledFirestoreBackup --limit=50

# Check IAM permissions
gcloud projects get-iam-policy natacare-pm

# Retry manual backup
gcloud firestore export gs://natacare-backups/firestore/retry-$(date +%Y%m%d-%H%M%S)
```

### Restore Failed
```bash
# Check restore permissions
gcloud firestore operations list

# Check backup integrity
gsutil ls -l gs://natacare-backups/firestore/2024-12-01/

# Try partial restore
gcloud firestore import gs://natacare-backups/firestore/2024-12-01 \
  --collection-ids=users
```

### Storage Full
```bash
# List old backups
gsutil ls gs://natacare-backups/firestore/ | sort

# Delete old backups (manual - for emergency)
gsutil -m rm -r gs://natacare-backups/firestore/2024-11-*

# Adjust retention policy
gsutil lifecycle set backup-lifecycle-15days.json gs://natacare-backups
```

## References

- [Firestore Export/Import Docs](https://firebase.google.com/docs/firestore/manage-data/export-import)
- [Cloud Scheduler Documentation](https://cloud.google.com/scheduler/docs)
- [Cloud Storage Lifecycle](https://cloud.google.com/storage/docs/lifecycle)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Last Updated:** December 2024  
**Owner:** DevOps Team  
**Review Cycle:** Quarterly
