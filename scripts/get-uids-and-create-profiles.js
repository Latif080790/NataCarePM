// Get UIDs and Create Profiles
// File: get-uids-and-create-profiles.js

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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
const auth = getAuth(app);
const db = getFirestore(app);

const accounts = [
  {
    email: 'pm@natacara.dev',
    password: 'NataCare2025!',
    profile: {
      name: 'Jevline Kief',
      roleId: 'pm',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    },
  },
  {
    email: 'admin@natacara.dev',
    password: 'NataCare2025!',
    profile: {
      name: 'Admin Nata',
      roleId: 'admin',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
    },
  },
  {
    email: 'site@natacara.dev',
    password: 'NataCare2025!',
    profile: {
      name: 'Bambang Lapangan',
      roleId: 'site_manager',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
    },
  },
  {
    email: 'finance@natacara.dev',
    password: 'NataCare2025!',
    profile: {
      name: 'Siti Keuangan',
      roleId: 'finance',
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705a',
    },
  },
];

async function getUIDsAndCreateProfiles() {
  console.log('🔑 Getting UIDs and creating Firestore profiles...');

  for (const account of accounts) {
    try {
      // Login untuk mendapatkan UID
      const userCredential = await signInWithEmailAndPassword(
        auth,
        account.email,
        account.password
      );
      const user = userCredential.user;

      console.log(`✅ Logged in as: ${account.email} (UID: ${user.uid})`);

      // Buat profile di Firestore dengan UID yang benar
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        id: user.uid,
        name: account.profile.name,
        email: account.email,
        roleId: account.profile.roleId,
        avatarUrl: account.profile.avatarUrl,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ Profile created in Firestore for: ${account.profile.name}`);

      // Logout untuk user berikutnya
      await auth.signOut();
    } catch (error) {
      console.error(`❌ Failed for ${account.email}:`, error.message);
    }
  }

  console.log('\n🎉 All profiles created successfully!');
  console.log('🚀 Ready to login with full Firebase Auth + Firestore integration!');

  console.log('\n📋 Login credentials:');
  accounts.forEach((account) => {
    console.log(`- ${account.email} / ${account.password} (${account.profile.roleId})`);
  });
}

getUIDsAndCreateProfiles().catch(console.error);
