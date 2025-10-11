// Update Password Script
// File: update-passwords.js

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, updatePassword } from "firebase/auth";

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

const accounts = [
    { email: 'pm@natacara.dev', oldPassword: 'password123', newPassword: 'NataCare2025!' },
    { email: 'admin@natacara.dev', oldPassword: 'password123', newPassword: 'NataCare2025!' },
    { email: 'site@natacara.dev', oldPassword: 'password123', newPassword: 'NataCare2025!' },
    { email: 'finance@natacara.dev', oldPassword: 'password123', newPassword: 'NataCare2025!' }
];

async function updatePasswords() {
    console.log('🔐 Updating passwords...');
    
    for (const account of accounts) {
        try {
            // Login dengan password lama
            const userCredential = await signInWithEmailAndPassword(auth, account.email, account.oldPassword);
            const user = userCredential.user;
            
            // Update ke password baru
            await updatePassword(user, account.newPassword);
            console.log(`✅ Password updated for: ${account.email}`);
            
        } catch (error) {
            console.error(`❌ Failed to update ${account.email}:`, error.message);
        }
    }
    
    console.log('\n🎉 Password update completed!');
    console.log('🔑 New password for all accounts: NataCare2025!');
}

updatePasswords().catch(console.error);