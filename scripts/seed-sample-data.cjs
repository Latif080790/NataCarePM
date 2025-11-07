/**
 * Seed sample data untuk testing monitoring dashboard
 * Run: node scripts/seed-sample-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'natacara-hns'
});

const db = admin.firestore();

// Helper function untuk create timestamp
const now = () => admin.firestore.FieldValue.serverTimestamp();

async function seedSampleData() {
  console.log('🌱 Seeding sample data for NataCarePM...\n');

  try {
    // 1. Create sample workspace
    console.log('📁 Creating workspace...');
    await db.collection('workspaces').doc('default-workspace').set({
      name: 'Default Workspace',
      description: 'Default workspace for all projects',
      createdAt: now(),
      updatedAt: now(),
    });
    console.log('✅ Workspace created\n');

    // 2. Create sample project
    console.log('🏗️  Creating project...');
    const projectId = 'demo-project-001';
    await db.collection('projects').doc(projectId).set({
      name: 'Demo Construction Project',
      description: 'Sample project for testing mobile features - Pembangunan Gedung Perkantoran 5 Lantai',
      location: 'Jakarta Selatan, Indonesia',
      address: 'Jl. Sudirman No. 123, Jakarta Selatan 12190',
      startDate: admin.firestore.Timestamp.fromDate(new Date('2025-01-01')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2025-12-31')),
      budget: 5000000000, // 5 billion IDR
      actualCost: 1750000000, // 1.75 billion spent
      status: 'active',
      progress: 35,
      workspaceId: 'default-workspace',
      createdAt: now(),
      updatedAt: now(),
      createdBy: 'system',
      geofence: {
        latitude: -6.2088,
        longitude: 106.8456,
        radius: 500, // 500 meters
      },
      projectManager: 'Project Manager Demo',
      contractor: 'PT. Nata Cara Konstruksi',
      client: 'PT. Gedung Megah Indonesia',
    });
    console.log('✅ Project created\n');

    // 3. Create sample users
    console.log('👥 Creating users...');
    const users = [
      {
        id: 'demo-user-001',
        email: 'pm@natacara.dev',
        name: 'Project Manager Demo',
        role: 'admin',
        roleId: 'admin',
      },
      {
        id: 'demo-user-002',
        email: 'supervisor@natacara.dev',
        name: 'Site Supervisor',
        role: 'supervisor',
        roleId: 'supervisor',
      },
      {
        id: 'demo-user-003',
        email: 'engineer@natacara.dev',
        name: 'Civil Engineer',
        role: 'engineer',
        roleId: 'engineer',
      },
    ];

    for (const user of users) {
      await db.collection('users').doc(user.id).set({
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        workspaceId: 'default-workspace',
        photoURL: null,
        phoneNumber: null,
        isActive: true,
        createdAt: now(),
        updatedAt: now(),
      });

      // Add as project member
      await db.collection('projects').doc(projectId).collection('members').doc(user.id).set({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.roleId,
        addedAt: now(),
        addedBy: 'system',
      });
    }
    console.log(`✅ ${users.length} users created and added as project members\n`);

    // 4. Create camera uploads (100 samples for testing)
    console.log('📸 Creating camera uploads...');
    const cameraUploads = [];
    const locations = [
      { name: 'Foundation Area', lat: -6.2088, lng: 106.8456 },
      { name: 'Column Area', lat: -6.2085, lng: 106.8458 },
      { name: 'Beam Area', lat: -6.2090, lng: 106.8454 },
      { name: 'Slab Area', lat: -6.2087, lng: 106.8457 },
    ];

    for (let i = 1; i <= 100; i++) {
      const location = locations[i % locations.length];
      const daysAgo = Math.floor(Math.random() * 14); // Last 14 days
      const uploadDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      cameraUploads.push({
        projectId,
        userId: users[i % users.length].id,
        userName: users[i % users.length].name,
        fileName: `construction-photo-${i}.jpg`,
        fileSize: Math.floor(Math.random() * 3000000) + 500000, // 500KB - 3.5MB
        fileSizeOriginal: Math.floor(Math.random() * 5000000) + 3000000, // 3-8MB original
        fileType: 'image/jpeg',
        uploadedAt: admin.firestore.Timestamp.fromDate(uploadDate),
        compressed: true,
        compressionRatio: 0.6 + Math.random() * 0.3, // 0.6-0.9
        quality: 0.8,
        status: Math.random() > 0.05 ? 'success' : 'failed', // 95% success rate
        location: {
          latitude: location.lat + (Math.random() - 0.5) * 0.001,
          longitude: location.lng + (Math.random() - 0.5) * 0.001,
          name: location.name,
        },
        metadata: {
          deviceType: ['Android', 'iOS'][Math.floor(Math.random() * 2)],
          appVersion: '1.0.0',
          uploadDuration: Math.floor(Math.random() * 5000) + 1000, // 1-6 seconds
        },
        tags: ['progress', 'inspection', 'quality-check'][Math.floor(Math.random() * 3)],
      });
    }

    // Batch write camera uploads
    let batch = db.batch();
    let batchCount = 0;
    for (let i = 0; i < cameraUploads.length; i++) {
      const ref = db.collection('cameraUploads').doc(`upload-${i + 1}`);
      batch.set(ref, cameraUploads[i]);
      batchCount++;

      if (batchCount === 500 || i === cameraUploads.length - 1) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
    console.log(`✅ ${cameraUploads.length} camera uploads created\n`);

    // 5. Create GPS captures (100 samples)
    console.log('📍 Creating GPS captures...');
    const gpsCaptures = [];
    
    for (let i = 1; i <= 100; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const captureDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const insideGeofence = Math.random() > 0.1; // 90% inside geofence
      
      gpsCaptures.push({
        projectId,
        userId: users[i % users.length].id,
        userName: users[i % users.length].name,
        latitude: insideGeofence
          ? -6.2088 + (Math.random() - 0.5) * 0.004 // Inside (±200m)
          : -6.2088 + (Math.random() - 0.5) * 0.02, // Outside (±1km)
        longitude: insideGeofence
          ? 106.8456 + (Math.random() - 0.5) * 0.004
          : 106.8456 + (Math.random() - 0.5) * 0.02,
        accuracy: Math.floor(Math.random() * 15) + 5, // 5-20m accuracy
        altitude: Math.floor(Math.random() * 50) + 100, // 100-150m altitude
        speed: Math.random() * 2, // 0-2 m/s
        heading: Math.floor(Math.random() * 360),
        timestamp: admin.firestore.Timestamp.fromDate(captureDate),
        insideGeofence,
        geofenceCompliance: insideGeofence ? 'compliant' : 'non-compliant',
        distanceFromCenter: insideGeofence
          ? Math.floor(Math.random() * 200) // 0-200m
          : Math.floor(Math.random() * 1000) + 500, // 500-1500m
        activity: ['stationary', 'walking', 'in_vehicle'][Math.floor(Math.random() * 3)],
        metadata: {
          deviceType: ['Android', 'iOS'][Math.floor(Math.random() * 2)],
          appVersion: '1.0.0',
        },
      });
    }

    batch = db.batch();
    batchCount = 0;
    for (let i = 0; i < gpsCaptures.length; i++) {
      const ref = db.collection('gpsCaptures').doc(`gps-${i + 1}`);
      batch.set(ref, gpsCaptures[i]);
      batchCount++;

      if (batchCount === 500 || i === gpsCaptures.length - 1) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
    console.log(`✅ ${gpsCaptures.length} GPS captures created\n`);

    // 6. Create push notifications (50 samples)
    console.log('🔔 Creating push notifications...');
    const notifications = [];
    const notificationTypes = [
      { type: 'info', title: 'Daily Report Reminder', body: 'Please submit your daily report for today' },
      { type: 'warning', title: 'Weather Alert', body: 'Heavy rain expected this afternoon' },
      { type: 'success', title: 'Task Completed', body: 'Foundation work has been completed' },
      { type: 'error', title: 'Safety Alert', body: 'Safety equipment required in Zone B' },
      { type: 'info', title: 'Meeting Schedule', body: 'Project review meeting at 2 PM' },
    ];

    for (let i = 1; i <= 50; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const sentDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const opened = Math.random() > 0.4; // 60% open rate
      const notif = notificationTypes[i % notificationTypes.length];
      
      notifications.push({
        projectId,
        userId: users[i % users.length].id,
        userName: users[i % users.length].name,
        title: `${notif.title} #${i}`,
        body: notif.body,
        type: notif.type,
        priority: ['high', 'normal', 'low'][Math.floor(Math.random() * 3)],
        sentAt: admin.firestore.Timestamp.fromDate(sentDate),
        delivered: true,
        deliveredAt: admin.firestore.Timestamp.fromDate(new Date(sentDate.getTime() + 1000)),
        opened,
        openedAt: opened
          ? admin.firestore.Timestamp.fromDate(
              new Date(sentDate.getTime() + Math.floor(Math.random() * 3600000))
            )
          : null,
        clicked: opened && Math.random() > 0.5,
        metadata: {
          deviceType: ['Android', 'iOS'][Math.floor(Math.random() * 2)],
          deviceToken: `token-${i}`,
        },
      });
    }

    batch = db.batch();
    for (let i = 0; i < notifications.length; i++) {
      const ref = db.collection('pushNotifications').doc(`notif-${i + 1}`);
      batch.set(ref, notifications[i]);
    }
    await batch.commit();
    console.log(`✅ ${notifications.length} push notifications created\n`);

    // 7. Create system metrics for monitoring
    console.log('📊 Creating system metrics...');
    const metrics = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      metrics.push({
        date: admin.firestore.Timestamp.fromDate(date),
        cameraUploads: {
          total: Math.floor(Math.random() * 20) + 10,
          success: Math.floor(Math.random() * 18) + 10,
          failed: Math.floor(Math.random() * 2),
          successRate: 0.95 + Math.random() * 0.05,
          avgFileSize: Math.floor(Math.random() * 1000000) + 2000000,
          avgUploadTime: Math.floor(Math.random() * 3000) + 2000,
        },
        gpsCaptures: {
          total: Math.floor(Math.random() * 20) + 10,
          insideGeofence: Math.floor(Math.random() * 18) + 10,
          outsideGeofence: Math.floor(Math.random() * 2),
          complianceRate: 0.90 + Math.random() * 0.10,
          avgAccuracy: Math.floor(Math.random() * 5) + 8,
        },
        pushNotifications: {
          sent: Math.floor(Math.random() * 10) + 5,
          delivered: Math.floor(Math.random() * 10) + 5,
          opened: Math.floor(Math.random() * 6) + 3,
          openRate: 0.50 + Math.random() * 0.20,
        },
        createdAt: now(),
      });
    }

    batch = db.batch();
    for (let i = 0; i < metrics.length; i++) {
      const ref = db.collection('systemMetrics').doc(`metrics-${Date.now()}-${i}`);
      batch.set(ref, metrics[i]);
    }
    await batch.commit();
    console.log(`✅ ${metrics.length} system metrics created\n`);

    console.log('\n🎉 ================================');
    console.log('✅ Sample data seeded successfully!');
    console.log('================================\n');
    console.log('📊 Summary:');
    console.log('  - 1 Workspace (default-workspace)');
    console.log('  - 1 Project (Demo Construction Project)');
    console.log(`  - ${users.length} Users (admin, supervisor, engineer)`);
    console.log(`  - ${cameraUploads.length} Camera uploads (95% success rate)`);
    console.log(`  - ${gpsCaptures.length} GPS captures (90% geofence compliance)`);
    console.log(`  - ${notifications.length} Push notifications (60% open rate)`);
    console.log(`  - ${metrics.length} System metrics (last 7 days)`);
    console.log('\n🌐 Ready for testing!');
    console.log('📱 Visit: https://natacara-hns.web.app/monitoring');
    console.log('🔐 Login: pm@natacara.dev / NataCare2025!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

seedSampleData();
