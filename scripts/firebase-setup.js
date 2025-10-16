// Firebase Setup Script untuk Demo Accounts
// File: firebase-setup.js

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
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
const auth = getAuth(app);
const db = getFirestore(app);

// Demo accounts yang akan dibuat di Firebase
const demoAccounts = [
    {
        email: 'pm@natacara.dev',
        password: 'NataCare2025!',
        profile: {
            name: 'Jevline Kief',
            roleId: 'pm',
            avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
        }
    },
    {
        email: 'admin@natacara.dev',
        password: 'NataCare2025!',
        profile: {
            name: 'Admin Nata',
            roleId: 'admin',
            avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704e'
        }
    },
    {
        email: 'site@natacara.dev',
        password: 'NataCare2025!',
        profile: {
            name: 'Bambang Lapangan',
            roleId: 'site_manager',
            avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704f'
        }
    },
    {
        email: 'finance@natacara.dev',
        password: 'NataCare2025!',
        profile: {
            name: 'Siti Keuangan',
            roleId: 'finance',
            avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705a'
        }
    }
];

// Function untuk membuat akun demo
async function createDemoAccounts() {
    console.log('🚀 Membuat akun demo di Firebase...');
    
    for (const account of demoAccounts) {
        try {
            // Buat akun di Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                account.email, 
                account.password
            );
            
            const user = userCredential.user;
            console.log(`✅ Akun dibuat: ${account.email} (UID: ${user.uid})`);
            
            // Buat profile di Firestore
            await setDoc(doc(db, 'users', user.uid), {
                ...account.profile,
                email: account.email,
                uid: user.uid,
                isOnline: false,
                lastSeen: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
            
            console.log(`✅ Profile tersimpan untuk: ${account.profile.name}`);
            
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`⚠️ Akun sudah ada: ${account.email}`);
            } else {
                console.error(`❌ Error membuat akun ${account.email}:`, error.message);
            }
        }
    }
    
    console.log('🎉 Setup akun demo selesai!');
    console.log('\n📋 Akun yang tersedia:');
    demoAccounts.forEach(account => {
        console.log(`- Email: ${account.email}`);
        console.log(`  Password: ${account.password}`);
        console.log(`  Role: ${account.profile.roleId}`);
        console.log('');
    });
    
    console.log('🔐 Password baru yang lebih aman: NataCare2025!');
    console.log('🚀 Silakan login dengan akun di atas!');
}

// Jalankan setup
createDemoAccounts().catch(console.error);

export { createDemoAccounts };