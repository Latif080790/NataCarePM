import '@testing-library/jest-dom';
import { vi } from 'vitest';

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

// Performance API
global.performance = {
  ...global.performance,
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