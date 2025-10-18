# Firebase Automated Backup Implementation Guide

## Overview

This document provides comprehensive instructions for implementing automated Firebase Firestore backups to Google Cloud Storage with a 30-day retention policy.

## Prerequisites

- Firebase project with Blaze (Pay-as-you-go) plan
- Google Cloud project linked to Firebase
- `firebase-tools` CLI installed (`npm install -g firebase-tools`)
- Google Cloud SDK installed
- Admin access to Firebase and Google Cloud Console

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Cloud Scheduler │────────>│ Cloud Function   │
│  (Daily 2 AM)   │         │  (BackupFirestore│
└─────────────────┘         └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │ Firestore Export │
                            └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  Cloud Storage   │
                            │  (GCS Bucket)    │
                            └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │ Lifecycle Policy │
                            │  (30-day delete) │
                            └──────────────────┘
```

## Implementation Steps

### Step 1: Enable Required APIs

```bash
# Enable Firestore API
gcloud services enable firestore.googleapis.com

# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Enable Cloud Scheduler API
gcloud services enable cloudscheduler.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com
```

### Step 2: Create GCS Bucket for Backups

```bash
# Set your project ID
PROJECT_ID="your-firebase-project-id"
BACKUP_BUCKET="${PROJECT_ID}-firestore-backups"

# Create bucket in same region as Firestore
gsutil mb -p ${PROJECT_ID} -c STANDARD -l us-central1 gs://${BACKUP_BUCKET}/

# Set lifecycle policy for 30-day retention
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 30,
          "matchesPrefix": ["firestore-backups/"]
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://${BACKUP_BUCKET}/
```

### Step 3: Grant Permissions

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")

# Grant Cloud Functions service account permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
  --role=roles/firestore.serviceAgent

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member=serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com \
  --role=roles/datastore.importExportAdmin

# Grant storage permissions
gsutil iam ch serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com:admin \
  gs://${BACKUP_BUCKET}
```

### Step 4: Create Cloud Function

#### Initialize Firebase Functions (if not already done)

```bash
cd NataCarePM
firebase init functions

# Select:
# - TypeScript
# - ESLint
# - Install dependencies with npm
```

#### Create Backup Function

Create file: `functions/src/backupFirestore.ts`

```typescript
import * as functions from 'firebase-functions';
import * as firestore from '@google-cloud/firestore';

const client = new firestore.v1.FirestoreAdminClient();

/**
 * Automated Firestore Backup Function
 * 
 * Exports all Firestore collections to Google Cloud Storage
 * Triggered daily by Cloud Scheduler
 * 
 * Features:
 * - Full database export
 * - Timestamped backups
 * - Error logging
 * - Success notifications
 */
export const backupFirestore = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '1GB'
  })
  .pubsub
  .schedule('0 2 * * *') // Run at 2 AM every day
  .timeZone('Asia/Jakarta') // Adjust to your timezone
  .onRun(async (context) => {
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const bucket = `gs://${projectId}-firestore-backups`;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputUriPrefix = `${bucket}/firestore-backups/${timestamp}`;
    
    const databaseName = client.databasePath(projectId!, '(default)');
    
    try {
      console.log(`Starting Firestore backup to ${outputUriPrefix}`);
      
      const [response] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: outputUriPrefix,
        // Optional: specify collections to backup
        // collectionIds: ['users', 'projects', 'tasks', 'documents', 'pos']
      });
      
      console.log(`Backup operation started: ${response.name}`);
      console.log(`Backup will be saved to: ${outputUriPrefix}`);
      
      // Optional: Send notification (email, Slack, etc.)
      // await sendBackupNotification(timestamp, 'success');
      
      return {
        success: true,
        timestamp,
        outputUri: outputUriPrefix,
        operationName: response.name
      };
      
    } catch (error) {
      console.error('Backup failed:', error);
      
      // Optional: Send error notification
      // await sendBackupNotification(timestamp, 'failed', error);
      
      throw new functions.https.HttpsError(
        'internal',
        'Backup operation failed',
        error
      );
    }
  });

/**
 * Manual Backup Trigger (HTTP endpoint)
 * 
 * Allows manual triggering of backups via HTTP request
 * Useful for testing or on-demand backups
 * 
 * Usage: POST https://[region]-[project-id].cloudfunctions.net/manualBackup
 * Authorization: Bearer [Firebase ID token]
 */
export const manualBackup = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB'
  })
  .https
  .onCall(async (data, context) => {
    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated to trigger backup'
      );
    }
    
    // Require admin role
    const token = context.auth.token;
    if (token.role !== 'admin' && token.role !== 'super-admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Must be admin to trigger backup'
      );
    }
    
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const bucket = `gs://${projectId}-firestore-backups`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputUriPrefix = `${bucket}/firestore-backups/manual-${timestamp}`;
    const databaseName = client.databasePath(projectId!, '(default)');
    
    try {
      const [response] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: outputUriPrefix
      });
      
      console.log(`Manual backup started by ${context.auth.uid}`);
      
      return {
        success: true,
        timestamp,
        outputUri: outputUriPrefix,
        operationName: response.name,
        triggeredBy: context.auth.uid
      };
      
    } catch (error) {
      console.error('Manual backup failed:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Manual backup operation failed',
        error
      );
    }
  });

/**
 * Backup Verification Function
 * 
 * Verifies backup integrity by checking GCS bucket
 * Runs 1 hour after scheduled backup
 */
export const verifyBackup = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .pubsub
  .schedule('0 3 * * *') // Run at 3 AM (1 hour after backup)
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage();
    
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const bucketName = `${projectId}-firestore-backups`;
    
    try {
      // Get today's backup folder
      const today = new Date().toISOString().split('T')[0];
      const prefix = `firestore-backups/${today}`;
      
      const [files] = await storage.bucket(bucketName).getFiles({ prefix });
      
      if (files.length === 0) {
        console.error(`No backup found for ${today}`);
        // Send alert
        return { success: false, message: 'No backup found' };
      }
      
      const totalSize = files.reduce((sum: number, file: any) => sum + parseInt(file.metadata.size), 0);
      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      
      console.log(`Backup verified: ${files.length} files, ${sizeInMB} MB`);
      
      return {
        success: true,
        fileCount: files.length,
        totalSize: sizeInMB + ' MB',
        date: today
      };
      
    } catch (error) {
      console.error('Backup verification failed:', error);
      return { success: false, error };
    }
  });
```

#### Update functions/src/index.ts

```typescript
export { backupFirestore, manualBackup, verifyBackup } from './backupFirestore';
```

#### Install Dependencies

```bash
cd functions
npm install @google-cloud/firestore @google-cloud/storage
cd ..
```

### Step 5: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:backupFirestore,functions:manualBackup,functions:verifyBackup
```

### Step 6: Verify Deployment

```bash
# List deployed functions
firebase functions:list

# Check Cloud Scheduler jobs
gcloud scheduler jobs list

# Check recent logs
firebase functions:log --only backupFirestore --limit 50
```

### Step 7: Test Backup

#### Manual Test via Cloud Console

1. Go to Cloud Functions in Google Cloud Console
2. Find `manualBackup` function
3. Click "Test function"
4. Provide test data: `{}`
5. Check logs for success

#### Manual Test via gcloud CLI

```bash
# Trigger manual backup
gcloud functions call manualBackup --data '{}'

# Check if backup files were created
gsutil ls gs://${PROJECT_ID}-firestore-backups/firestore-backups/
```

## Monitoring & Alerts

### Set Up Email Alerts

```bash
# Create alert policy for backup failures
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_NOTIFICATION_CHANNEL_ID \
  --display-name="Firestore Backup Failure Alert" \
  --condition-display-name="Backup Function Error" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=60s \
  --condition-filter='resource.type="cloud_function" AND resource.labels.function_name="backupFirestore" AND severity="ERROR"'
```

### Dashboard Metrics

Monitor these metrics in Cloud Console:

- **Function Executions**: `cloudfunctions.googleapis.com/function/execution_count`
- **Function Errors**: `cloudfunctions.googleapis.com/function/execution_errors`
- **Execution Time**: `cloudfunctions.googleapis.com/function/execution_times`
- **Storage Usage**: Check GCS bucket size growth

## Restoration Procedure

### Full Database Restore

```bash
# List available backups
gsutil ls gs://${PROJECT_ID}-firestore-backups/firestore-backups/

# Restore from specific backup
PROJECT_ID="your-project-id"
BACKUP_PATH="gs://${PROJECT_ID}-firestore-backups/firestore-backups/2024-01-20T02-00-00-000Z"

gcloud firestore import ${BACKUP_PATH} \
  --project=${PROJECT_ID}
```

### Partial Restore (Specific Collections)

```bash
# Restore only specific collections
gcloud firestore import ${BACKUP_PATH} \
  --collection-ids=users,projects,tasks \
  --project=${PROJECT_ID}
```

### Restore to Different Database

```bash
# Create new database first
gcloud firestore databases create test-restore \
  --location=us-central1 \
  --project=${PROJECT_ID}

# Import to new database
gcloud firestore import ${BACKUP_PATH} \
  --database=test-restore \
  --project=${PROJECT_ID}
```

## Costs Estimation

### Monthly Costs (Approximate)

- **Cloud Functions**: ~$0.50 (3 executions/day × 30 days)
- **Cloud Scheduler**: ~$0.10 (3 jobs)
- **Cloud Storage**: ~$2-10 (depends on database size, 30-day retention)
- **Firestore Export**: $0.025 per 100k entities

**Total Estimated Cost**: $3-15/month (for small-medium database)

## Maintenance

### Regular Tasks

#### Weekly
- Review backup logs for errors
- Check storage usage trends
- Verify backup file sizes

#### Monthly
- Test restoration procedure (to staging environment)
- Review retention policy effectiveness
- Audit access logs

#### Quarterly
- Perform full disaster recovery drill
- Update documentation
- Review and optimize costs

## Troubleshooting

### Backup Function Fails

```bash
# Check function logs
firebase functions:log --only backupFirestore

# Common issues:
# 1. Insufficient permissions - Re-run Step 3
# 2. Quota exceeded - Check Firestore quotas
# 3. Timeout - Increase timeout in function config
```

### Storage Issues

```bash
# Check bucket lifecycle policy
gsutil lifecycle get gs://${PROJECT_ID}-firestore-backups

# Verify bucket permissions
gsutil iam get gs://${PROJECT_ID}-firestore-backups
```

### Restore Fails

```bash
# Check operation status
gcloud firestore operations list

# Describe specific operation
gcloud firestore operations describe OPERATION_NAME
```

## Security Best Practices

1. **Access Control**
   - Limit bucket access to service accounts
   - Use IAM roles instead of ACLs
   - Enable audit logging

2. **Encryption**
   - GCS encrypts at rest by default
   - Enable CMEK for additional security
   - Use VPC Service Controls in production

3. **Monitoring**
   - Set up alerts for backup failures
   - Monitor storage costs
   - Track restoration times

## Compliance

### Data Retention

- Backups retained for 30 days (configurable)
- Complies with GDPR "right to be forgotten" (delete on request)
- Audit trail via Cloud Logging

### Documentation

- Maintain backup runbook
- Document restoration procedures
- Keep disaster recovery contacts updated

## Next Steps

1. ✅ Complete Firebase setup
2. ✅ Deploy backup functions
3. ⏳ Test manual backup
4. ⏳ Wait for first scheduled backup (next 2 AM)
5. ⏳ Verify backup files in GCS
6. ⏳ Perform test restoration to staging
7. ⏳ Set up monitoring alerts
8. ⏳ Document in disaster recovery plan

## Support Resources

- [Firebase Backup Documentation](https://firebase.google.com/docs/firestore/solutions/schedule-export)
- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [GCS Lifecycle Management](https://cloud.google.com/storage/docs/lifecycle)
- [Firestore Import/Export](https://cloud.google.com/firestore/docs/manage-data/export-import)

---

**Last Updated**: 2024-01-XX  
**Owner**: DevOps Team  
**Review Cycle**: Quarterly
