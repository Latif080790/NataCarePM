const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBl8-t0rqqyl56G28HkgG8S32_SZUEqFY8",
  authDomain: "natacara-hns.firebaseapp.com",
  projectId: "natacara-hns",
  storageBucket: "natacara-hns.firebasestorage.app",
  messagingSenderId: "118063816239",
  appId: "1:118063816239:web:11b43366e18bc71e9170da",
  measurementId: "G-7XPWRK3R2P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    const docRef = await addDoc(collection(db, 'projects'), sampleProject);
    
    console.log('Sample project created successfully!');
    console.log('Project ID:', docRef.id);
    console.log('Project Name:', sampleProject.name);
  } catch (error) {
    console.error('Error creating sample project:', error);
  }
}

createSampleProject();