import '@testing-library/jest-dom';
import { vi } from 'vitest';
import * as tf from '@tensorflow/tfjs';

// Configure TensorFlow.js to use CPU backend for testing
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  tf.setBackend('cpu').catch(() => {
    // Fallback silently if CPU backend not available
  });
}

// ========================================
// FIREBASE MOCKS
// ========================================

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => {
  // Create a proper Timestamp class mock
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;

    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }

    toDate(): Date {
      return new Date(this.seconds * 1000);
    }

    static now(): MockTimestamp {
      return new MockTimestamp(Date.now() / 1000, 0);
    }

    static fromDate(date: Date): MockTimestamp {
      return new MockTimestamp(date.getTime() / 1000, 0);
    }
  }

  return {
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn((db, path) => ({ db, path })),
    doc: vi.fn((db, path, id) => ({ db, path, id })),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
    setDoc: vi.fn(() => Promise.resolve()),
    addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    query: vi.fn((collection) => collection),
    where: vi.fn((field, op, value) => ({ field, op, value })),
    orderBy: vi.fn((field, direction) => ({ field, direction })),
    limit: vi.fn((count) => ({ limit: count })),
    onSnapshot: vi.fn((ref, callback) => vi.fn()),
    serverTimestamp: vi.fn(() => new Date()),
    arrayUnion: vi.fn((...args) => args),
    Timestamp: MockTimestamp,
  };
});

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user-id', email: 'test@example.com' }
  })),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: { uid: 'test-user-id' } })),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback({ uid: 'test-user-id', email: 'test@example.com' });
    return vi.fn();
  }),
  updatePassword: vi.fn(() => Promise.resolve()),
  EmailAuthProvider: {
    credential: vi.fn((email, password) => ({ email, password })),
  },
  reauthenticateWithCredential: vi.fn(() => Promise.resolve()),
}));

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn((storage, path) => ({ storage, path })),
  uploadBytes: vi.fn(() => Promise.resolve({ ref: {}, metadata: {} })),
  uploadBytesResumable: vi.fn(() => ({
    on: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    cancel: vi.fn()
  })),
  getDownloadURL: vi.fn(() => Promise.resolve('https://mock-url.com/file')),
  deleteObject: vi.fn(() => Promise.resolve())
}));

// Mock Firebase Config
vi.mock('./firebaseConfig', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-id', email: 'test@example.com' } },
  storage: {}
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((password) => Promise.resolve(`hashed_${password}`)),
    compare: vi.fn((password, hash) => Promise.resolve(password === hash.replace('hashed_', ''))),
  },
  hash: vi.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: vi.fn((password, hash) => Promise.resolve(password === hash.replace('hashed_', ''))),
}));

// ========================================
// ENVIRONMENT VARIABLES
// ========================================

process.env.VITE_GEMINI_API_KEY = 'mock-api-key';
process.env.VITE_FIREBASE_API_KEY = 'mock-firebase-api-key';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'mock-project.firebaseapp.com';
process.env.VITE_FIREBASE_PROJECT_ID = 'mock-project';
process.env.VITE_FIREBASE_STORAGE_BUCKET = 'mock-project.appspot.com';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef';

// ========================================
// GLOBAL MOCKS
// ========================================

// ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IndexedDB Mock for TensorFlow.js Model Persistence
const createIndexedDBMock = () => {
  const databases: Map<string, any> = new Map();
  const stores: Map<string, Map<string, any>> = new Map();
  
  // Initialize default stores
  stores.set('tensorflowjs_models', new Map());
  
  return {
    open: vi.fn((name: string, version?: number) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            result: {
              objectStoreNames: { contains: vi.fn(() => true), length: 1, item: vi.fn(() => 'tensorflowjs_models') },
              createObjectStore: vi.fn((storeName: string, options?: any) => ({
                createIndex: vi.fn(),
                add: vi.fn((data: any) => ({ onsuccess: null, onerror: null })),
                put: vi.fn((data: any) => ({ onsuccess: null, onerror: null })),
              })),
              transaction: vi.fn((storeNames: string | string[], mode?: string) => {
                const storeName = Array.isArray(storeNames) ? storeNames[0] : storeNames;
                if (!stores.has(storeName)) {
                  stores.set(storeName, new Map());
                }
                
                return {
                  objectStore: vi.fn((storeName: string) => {
                    const store = stores.get(storeName) || new Map();
                    return {
                      put: vi.fn((data: any, key?: any) => {
                        if (key) store.set(key, data);
                        return Promise.resolve({ onsuccess: null, onerror: null });
                      }),
                      add: vi.fn((data: any, key?: any) => {
                        if (key) store.set(key, data);
                        return Promise.resolve({ onsuccess: null, onerror: null });
                      }),
                      get: vi.fn((key: any) => {
                        const result = store.get(key);
                        return Promise.resolve({ 
                          onsuccess: null, 
                          onerror: null, 
                          result: result || null 
                        });
                      }),
                      delete: vi.fn((key: any) => {
                        store.delete(key);
                        return Promise.resolve({ onsuccess: null, onerror: null });
                      }),
                      getAllKeys: vi.fn(() => {
                        const keys = Array.from(store.keys());
                        return Promise.resolve({ 
                          onsuccess: null, 
                          onerror: null, 
                          result: keys 
                        });
                      }),
                      getAll: vi.fn(() => {
                        const values = Array.from(store.values());
                        return Promise.resolve({ 
                          onsuccess: null, 
                          onerror: null, 
                          result: values 
                        });
                      }),
                      clear: vi.fn(() => Promise.resolve({ onsuccess: null, onerror: null })),
                    };
                  }),
                  oncomplete: null,
                  onerror: null,
                  onabort: null,
                };
              }),
            },
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null,
          });
        }, 10);
      });
    }),
    deleteDatabase: vi.fn((name: string) => Promise.resolve()),
    databases: databases,
    stores: stores,
  };
};

global.indexedDB = createIndexedDBMock() as any;

// Performance API
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),  // Fixed for TensorFlow.js
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
} as any;

// Navigator APIs
Object.defineProperty(global.navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  }
});

Object.defineProperty(global.navigator, 'getBattery', {
  writable: true,
  value: vi.fn(() => Promise.resolve({
    level: 0.8,
    charging: true,
    chargingTime: 3600,
    dischargingTime: Infinity
  }))
});

// ========================================
// CONSOLE CLEANUP
// ========================================

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress known React warnings
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOM.render is deprecated') ||
       args[0].includes('Warning: '))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});