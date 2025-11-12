/**
 * Quick script to check Enhanced Audit Logs in Firestore
 * 
 * Usage: node check-audit-logs.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (use your service account key)
// For local testing, you can use the emulator or set GOOGLE_APPLICATION_CREDENTIALS

try {
  admin.initializeApp({
    projectId: 'natacara-hns', // Your Firebase project ID
  });

  const db = admin.firestore();

  async function checkAuditLogs() {
    console.log('🔍 Checking Enhanced Audit Logs...\n');

    try {
      const snapshot = await db.collection('enhancedAuditLogs')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      if (snapshot.empty) {
        console.log('❌ No audit logs found in Firestore');
        console.log('\nPossible reasons:');
        console.log('1. Sample data generation failed');
        console.log('2. Firestore permissions issue');
        console.log('3. Collection name mismatch');
        return;
      }

      console.log(`✅ Found ${snapshot.size} audit logs\n`);
      console.log('📊 Breakdown by module:');

      const moduleCount = {};
      const actionCount = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        const module = data.module || 'unknown';
        const action = data.action || 'unknown';

        moduleCount[module] = (moduleCount[module] || 0) + 1;
        actionCount[action] = (actionCount[action] || 0) + 1;
      });

      // Display module breakdown
      Object.entries(moduleCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([module, count]) => {
          console.log(`   ${module}: ${count} logs`);
        });

      console.log('\n📝 Breakdown by action:');
      Object.entries(actionCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([action, count]) => {
          console.log(`   ${action}: ${count} logs`);
        });

      console.log('\n🔍 Latest 5 logs:');
      snapshot.docs.slice(0, 5).forEach((doc, index) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate?.() || new Date();
        console.log(`\n${index + 1}. ${data.action || 'N/A'}`);
        console.log(`   Module: ${data.module || 'N/A'}`);
        console.log(`   Entity: ${data.entityName || data.entityId || 'N/A'}`);
        console.log(`   User: ${data.userName || data.userId || 'N/A'}`);
        console.log(`   Time: ${timestamp.toISOString()}`);
      });

    } catch (error) {
      console.error('❌ Error fetching audit logs:', error.message);
      
      if (error.code === 'permission-denied') {
        console.log('\n⚠️  Permission denied - Check Firestore rules');
      } else if (error.code === 7) {
        console.log('\n⚠️  Permission denied (code 7) - Check authentication');
      }
    }
  }

  checkAuditLogs()
    .then(() => {
      console.log('\n✅ Check complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('\nTo use this script:');
  console.log('1. Install: npm install firebase-admin');
  console.log('2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  console.log('3. Or use Firebase emulator for local testing');
  process.exit(1);
}
