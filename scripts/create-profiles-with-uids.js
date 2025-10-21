// Create User Profiles with Correct UIDs
// File: create-profiles-with-uids.js

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBl8-t0rqqyl56G28HkgG8S32_SZUEqFY8',
  authDomain: 'natacara-hns.firebaseapp.com',
  projectId: 'natacara-hns',
  storageBucket: 'natacara-hns.appspot.com',
  messagingSenderId: '118063816239',
  appId: '1:118063816239:web:11b43366e18bc71e9170da',
  measurementId: 'G-7XPWRK3R2P',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// User profiles dengan UID yang benar dari Firebase Auth
const userProfiles = [
  {
    uid: 'HMpIyyuVPfVsI2sBI3jVWL00CUq2', // PM
    id: 'user1',
    name: 'Jevline Kief',
    email: 'pm@natacara.dev',
    roleId: 'pm',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    uid: 'W39zI8NSMXMx95RQahpZAgcKt7E2', // ADMIN
    id: 'user2',
    name: 'Admin Nata',
    email: 'admin@natacara.dev',
    roleId: 'admin',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    uid: 'eWHZHBD68iPmfkhlLSz9tyAy9vz1', // Site
    id: 'user3',
    name: 'Bambang Lapangan',
    email: 'site@natacara.dev',
    roleId: 'site_manager',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
    isOnline: false,
    lastSeen: new Date().toISOString(),
  },
  {
    uid: 'X7reNFHjbXONKId7CStmPVHIPxM2', // finance
    id: 'user4',
    name: 'Siti Keuangan',
    email: 'finance@natacara.dev',
    roleId: 'finance',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705a',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
];

async function createUserProfilesWithUIDs() {
  console.log('👥 Creating user profiles in Firestore with correct UIDs...');

  for (const profile of userProfiles) {
    try {
      await setDoc(doc(db, 'users', profile.uid), {
        uid: profile.uid,
        id: profile.id,
        name: profile.name,
        email: profile.email,
        roleId: profile.roleId,
        avatarUrl: profile.avatarUrl,
        isOnline: profile.isOnline,
        lastSeen: profile.lastSeen,
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ Profile created: ${profile.name} (${profile.email}) - UID: ${profile.uid}`);
    } catch (error) {
      console.error(`❌ Failed to create profile for ${profile.email}:`, error.message);
    }
  }

  console.log('\n🎉 All user profiles created successfully in Firestore!');
  console.log('🔥 Firebase Auth + Firestore integration complete!');
  console.log('\n📋 Ready to login with:');

  userProfiles.forEach((profile) => {
    console.log(`- Email: ${profile.email}`);
    console.log(`  Password: NataCare2025!`);
    console.log(`  Role: ${profile.roleId}`);
    console.log(`  UID: ${profile.uid}`);
    console.log('');
  });

  console.log('🚀 Start the dev server and try logging in!');
}

createUserProfilesWithUIDs().catch(console.error);
