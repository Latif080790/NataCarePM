// Create User Profiles in Firestore
// File: create-user-profiles.js

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBl8-t0rqqyl56G28HkgG8S32_SZUEqFY8",
    authDomain: "natacara-hns.firebaseapp.com",
    projectId: "natacara-hns",
    storageBucket: "natacara-hns.appspot.com",
    messagingSenderId: "118063816239",
    appId: "1:118063816239:web:11b43366e18bc71e9170da",
    measurementId: "G-7XPWRK3R2P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// User profiles - UID akan diambil dari parameter atau menggunakan email sebagai document ID
const userProfiles = [
    {
        email: 'pm@natacara.dev',
        name: 'Jevline Kief',
        roleId: 'pm',
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
    },
    {
        email: 'admin@natacara.dev',
        name: 'Admin Nata',
        roleId: 'admin',
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e'
    },
    {
        email: 'site@natacara.dev',
        name: 'Bambang Lapangan',
        roleId: 'site_manager',
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f'
    },
    {
        email: 'finance@natacara.dev',
        name: 'Siti Keuangan',
        roleId: 'finance',
        avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705a'
    }
];

async function createUserProfiles() {
    console.log('👥 Creating user profiles in Firestore...');
    
    for (const profile of userProfiles) {
        try {
            // Gunakan email sebagai document ID untuk sekarang
            const docId = profile.email.replace('@natacara.dev', '').replace('.', '_');
            
            await setDoc(doc(db, 'users', docId), {
                email: profile.email,
                name: profile.name,
                roleId: profile.roleId,
                avatarUrl: profile.avatarUrl,
                isOnline: false,
                lastSeen: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
            
            console.log(`✅ Profile created for: ${profile.name} (${profile.email})`);
            
        } catch (error) {
            console.error(`❌ Failed to create profile for ${profile.email}:`, error.message);
        }
    }
    
    console.log('\n🎉 User profiles created successfully!');
    console.log('🚀 Try logging in now!');
}

createUserProfiles().catch(console.error);