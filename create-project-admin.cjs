const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with default credentials
admin.initializeApp({
  projectId: 'natacara-hns'
});

const db = admin.firestore();

async function createSampleProject() {
  try {
    console.log('Creating sample project...');
    
    // Sample project data
    const sampleProject = {
      name: 'Sample Construction Project',
      location: 'Sample Location, Indonesia',
      client: 'Sample Client',
      contractor: 'Sample Contractor',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      projectValue: 1000000000, // 1 billion
      status: 'On Progress',
      progress: 0,
      projectManager: 'sample-user',
      siteManager: 'sample-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Create project document
    const docRef = await db.collection('projects').add(sampleProject);
    
    console.log('Sample project created successfully!');
    console.log('Project ID:', docRef.id);
    console.log('Project Name:', sampleProject.name);
    
    // List all projects to verify
    console.log('\nAll projects:');
    const projectsSnapshot = await db.collection('projects').get();
    projectsSnapshot.forEach(doc => {
      console.log(`- ${doc.id}: ${doc.data().name}`);
    });
  } catch (error) {
    console.error('Error creating sample project:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

createSampleProject();