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

// Initialize Firestore with v10 stable settings
const db: Firestore = getFirestore(app);

// Enable offline persistence (v10 stable API)
// This uses IndexedDB for caching and automatically uses long-polling when needed
enableIndexedDbPersistence(db, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('[Firebase] Persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('[Firebase] Persistence not available in this browser');
  } else {
    console.error('[Firebase] Persistence error:', err);
  }
});

console.log('[Firebase] Initialized with v10 stable API + offline persistence');

const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

// Log Firebase initialization
console.log('[Firebase] Successfully initialized');
console.log('[Firebase] Project ID:', firebaseConfig.projectId);
console.log('[Firebase] Auth Domain:', firebaseConfig.authDomain);

export { app, db, auth, storage };