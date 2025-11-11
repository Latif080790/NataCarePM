/**
 * Firebase Configuration
 *
 * SECURITY: Uses environment variables instead of hardcoded credentials
 * Make sure to set up .env.local with your Firebase credentials
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  type Firestore,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Import Firebase modules for side effects
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/storage';

// Validate environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    throw new Error(
      `Missing required environment variable: ${envVar}\n` +
        `Please copy .env.example to .env.local and fill in your Firebase credentials.`
    );
  }
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// CRITICAL LOG - Check if this appears in console!
console.log('%c[FIREBASE CONFIG] App initialized!', 'color: #00FF00; font-weight: bold; font-size: 16px');
console.log('[FIREBASE] Using SDK v10.14.1');

// Initialize Firestore with v10 stable settings
const db: Firestore = getFirestore(app);

console.log('%c[FIREBASE CONFIG] Firestore initialized!', 'color: #00FF00; font-weight: bold; font-size: 16px');

// ⚠️ TEMPORARILY DISABLED: Offline persistence to fix 400 errors
// Re-enable after clearing browser cache and verifying app works
// 
// Issue: IndexedDB persistence can cause 400 Bad Request errors if cache is corrupted
// Solution: Disable persistence, clear cache, test, then re-enable
//
// try {
//   enableIndexedDbPersistence(db, {
//     cacheSizeBytes: CACHE_SIZE_UNLIMITED
//   }).then(() => {
//     console.log('%c[FIREBASE] ✅ Offline persistence ENABLED', 'color: #00FF00; font-weight: bold');
//   }).catch((err) => {
//     if (err.code === 'failed-precondition') {
//       console.warn('[Firebase] ⚠️ Persistence failed: Multiple tabs open - using memory only');
//     } else if (err.code === 'unimplemented') {
//       console.warn('[Firebase] ⚠️ Persistence not available in this browser - using memory only');
//     } else {
//       console.warn('[Firebase] ⚠️ Persistence error (app will still work):', err.message);
//     }
//   });
// } catch (err) {
//   console.warn('[Firebase] ⚠️ Could not enable persistence, continuing without it:', err);
// }

console.log('%c[FIREBASE] ⚠️ Persistence DISABLED (debugging 400 errors)', 'color: #FFA500; font-weight: bold');

const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

console.log('%c[FIREBASE] ✅ ALL INITIALIZED SUCCESSFULLY!', 'color: #00FF00; font-weight: bold; font-size: 18px');
console.log('[Firebase] Project ID:', firebaseConfig.projectId);
console.log('[Firebase] Auth Domain:', firebaseConfig.authDomain);

export { app, db, auth, storage };