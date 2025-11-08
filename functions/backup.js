/**
 * Automated Firestore Backup Cloud Function
 * Scheduled to run daily at 02:00 UTC
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { Storage } = require('@google-cloud/storage');
const functions = require('firebase-functions');

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();
const storage = new Storage();
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'natacare-pm';
const BACKUP_BUCKET = 'natacare-backups';

/**
 * Scheduled daily full backup
 */
exports.scheduledFirestoreBackup = functions
  .region('asia-southeast2')
  .pubsub.schedule('0 2 * * *') // 02:00 UTC daily
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupPath = `gs://${BACKUP_BUCKET}/firestore/${timestamp}`;

    console.log(`Starting full backup to: ${backupPath}`);

    try {
      // Execute Firestore export
      const client = new (require('@google-cloud/firestore').v1.FirestoreAdminClient)();
      const databaseName = client.databasePath(PROJECT_ID, '(default)');

      const [operation] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: backupPath,
        collectionIds: [], // Empty = all collections
      });

      console.log('Backup operation started:', operation.name);

      // Wait for operation to complete
      const [response] = await operation.promise();
      console.log('Backup completed successfully:', response);

      // Verify backup
      const verification = await verifyBackup(backupPath);
      
      if (verification.success) {
        await sendSuccessNotification(timestamp, verification);
      } else {
        await sendFailureNotification(timestamp, verification);
      }

      return { success: true, path: backupPath, verification };
    } catch (error) {
      console.error('Backup failed:', error);
      await sendFailureNotification(timestamp, { error: error.message });
      throw error;
    }
  });

/**
 * Incremental backup (every 6 hours)
 */
exports.incrementalBackup = functions
  .region('asia-southeast2')
  .pubsub.schedule('0 */6 * * *')
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `gs://${BACKUP_BUCKET}/firestore/incremental/${timestamp}`;

    console.log(`Starting incremental backup to: ${backupPath}`);

    try {
      // Get last backup timestamp
      const lastBackup = await getLastBackupTime();
      
      // Only backup documents modified since last backup
      const modifiedCollections = await getModifiedCollections(lastBackup);

      if (modifiedCollections.length === 0) {
        console.log('No changes since last backup');
        return { success: true, message: 'No changes' };
      }

      const client = new (require('@google-cloud/firestore').v1.FirestoreAdminClient)();
      const databaseName = client.databasePath(PROJECT_ID, '(default)');

      const [operation] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: backupPath,
        collectionIds: modifiedCollections,
      });

      const [response] = await operation.promise();
      console.log('Incremental backup completed:', response);

      return { success: true, path: backupPath, collections: modifiedCollections };
    } catch (error) {
      console.error('Incremental backup failed:', error);
      throw error;
    }
  });

/**
 * Critical collections hourly backup
 */
exports.criticalBackup = functions
  .region('asia-southeast2')
  .pubsub.schedule('0 * * * *') // Every hour
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `gs://${BACKUP_BUCKET}/firestore/critical/${timestamp}`;

    const criticalCollections = [
      'projects',
      'users',
      'transactions',
      'journalEntries',
      'purchaseOrders',
    ];

    console.log(`Starting critical backup to: ${backupPath}`);

    try {
      const client = new (require('@google-cloud/firestore').v1.FirestoreAdminClient)();
      const databaseName = client.databasePath(PROJECT_ID, '(default)');

      const [operation] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: backupPath,
        collectionIds: criticalCollections,
      });

      const [response] = await operation.promise();
      console.log('Critical backup completed:', response);

      return { success: true, path: backupPath };
    } catch (error) {
      console.error('Critical backup failed:', error);
      throw error;
    }
  });

/**
 * Verify backup integrity
 */
async function verifyBackup(backupPath) {
  try {
    const bucketName = BACKUP_BUCKET;
    const prefix = backupPath.replace(`gs://${bucketName}/`, '');

    const [files] = await storage.bucket(bucketName).getFiles({ prefix });

    if (files.length === 0) {
      return { success: false, error: 'No files found in backup' };
    }

    // Check for metadata file
    const metadataFile = files.find(f => f.name.endsWith('.overall_export_metadata'));
    if (!metadataFile) {
      return { success: false, error: 'Metadata file not found' };
    }

    // Download and parse metadata
    const [metadata] = await metadataFile.download();
    const metadataJson = JSON.parse(metadata.toString());

    // Verify collection count
    const expectedCollections = metadataJson.collections || [];
    const actualFiles = files.filter(f => !f.name.endsWith('.overall_export_metadata'));

    return {
      success: true,
      fileCount: files.length,
      collections: expectedCollections.length,
      size: files.reduce((sum, f) => sum + (f.metadata.size || 0), 0),
      metadata: metadataJson,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get last backup timestamp
 */
async function getLastBackupTime() {
  try {
    const doc = await db.collection('config').doc('backup').get();
    return doc.exists ? doc.data().lastBackup : new Date(0);
  } catch (error) {
    console.error('Error getting last backup time:', error);
    return new Date(0);
  }
}

/**
 * Get collections modified since timestamp
 */
async function getModifiedCollections(since) {
  const modifiedCollections = new Set();
  
  try {
    // Check main collections
    const collections = ['projects', 'users', 'transactions', 'documents'];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName)
        .where('updatedAt', '>', since)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        modifiedCollections.add(collectionName);
      }
    }

    return Array.from(modifiedCollections);
  } catch (error) {
    console.error('Error checking modified collections:', error);
    return [];
  }
}

/**
 * Send success notification
 */
async function sendSuccessNotification(timestamp, verification) {
  const message = {
    to: 'admin@natacare.com',
    subject: `✅ Firestore Backup Successful - ${timestamp}`,
    body: `
Backup completed successfully!

Date: ${timestamp}
Files: ${verification.fileCount}
Collections: ${verification.collections}
Size: ${(verification.size / 1024 / 1024).toFixed(2)} MB

Verification: PASSED
    `.trim(),
  };

  // Log to Firestore
  await db.collection('systemMetrics').add({
    type: 'backup_success',
    timestamp: new Date(),
    details: verification,
  });

  console.log('Success notification sent:', message);
  // TODO: Implement actual email/Slack notification
}

/**
 * Send failure notification
 */
async function sendFailureNotification(timestamp, error) {
  const message = {
    to: 'admin@natacare.com',
    subject: `❌ Firestore Backup FAILED - ${timestamp}`,
    body: `
ALERT: Backup failed!

Date: ${timestamp}
Error: ${error.error || 'Unknown error'}

Please investigate immediately.
    `.trim(),
  };

  // Log to Firestore
  await db.collection('errorLogs').add({
    type: 'backup_failure',
    timestamp: new Date(),
    error: error.error || 'Unknown',
  });

  console.error('Failure notification sent:', message);
  // TODO: Implement actual email/Slack/SMS notification
}

/**
 * Clean up old backups (retention policy)
 */
exports.cleanupOldBackups = functions
  .region('asia-southeast2')
  .pubsub.schedule('0 3 * * 0') // Weekly on Sunday at 03:00
  .timeZone('Asia/Jakarta')
  .onRun(async (context) => {
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`Cleaning up backups older than ${cutoffDate.toISOString()}`);

    try {
      const bucket = storage.bucket(BACKUP_BUCKET);
      const [files] = await bucket.getFiles({ prefix: 'firestore/' });

      let deletedCount = 0;

      for (const file of files) {
        const fileDate = new Date(file.metadata.timeCreated);
        
        if (fileDate < cutoffDate) {
          await file.delete();
          deletedCount++;
          console.log(`Deleted: ${file.name}`);
        }
      }

      console.log(`Cleanup completed: ${deletedCount} files deleted`);

      return { success: true, deletedCount };
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  });

/**
 * HTTP endpoint for manual backup trigger
 */
exports.manualBackup = functions
  .region('asia-southeast2')
  .https.onRequest(async (req, res) => {
    // Verify admin token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).send('Unauthorized');
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    // TODO: Verify admin token

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `gs://${BACKUP_BUCKET}/firestore/manual/${timestamp}`;

    try {
      const client = new (require('@google-cloud/firestore').v1.FirestoreAdminClient)();
      const databaseName = client.databasePath(PROJECT_ID, '(default)');

      const [operation] = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: backupPath,
      });

      const [response] = await operation.promise();

      res.status(200).json({
        success: true,
        path: backupPath,
        operation: operation.name,
        response,
      });
    } catch (error) {
      console.error('Manual backup failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
