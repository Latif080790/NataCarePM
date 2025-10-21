/**
 * Firebase Mock Factory
 * Comprehensive mocks for Firebase services (Firestore, Auth, Storage)
 */

export const mockFirestoreData = {
  users: {
    'test-user-id': {
      id: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin',
      createdAt: new Date('2025-01-01'),
    },
  },
  projects: {
    'test-project-id': {
      id: 'test-project-id',
      name: 'Test Project',
      description: 'Test project description',
      status: 'active',
      createdBy: 'test-user-id',
      createdAt: new Date('2025-01-01'),
    },
  },
  documents: {},
  tasks: {},
};

export const createMockFirestoreDoc = (data: any) => ({
  exists: () => !!data,
  data: () => data,
  id: data?.id || 'mock-id',
  ref: {
    id: data?.id || 'mock-id',
    path: `collection/${data?.id || 'mock-id'}`,
  },
});

export const createMockFirestoreCollection = (docs: any[] = []) => ({
  docs: docs.map(createMockFirestoreDoc),
  empty: docs.length === 0,
  size: docs.length,
  forEach: (callback: (doc: any) => void) =>
    docs.forEach((doc) => callback(createMockFirestoreDoc(doc))),
});

export const mockFirebaseAuth = {
  currentUser: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    getIdToken: jest.fn(() => Promise.resolve('mock-token')),
  },
  signIn: jest.fn((email: string, password: string) =>
    Promise.resolve({
      user: mockFirebaseAuth.currentUser,
    })
  ),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((callback: (user: any) => void) => {
    callback(mockFirebaseAuth.currentUser);
    return jest.fn(); // unsubscribe
  }),
};

export const mockFirebaseStorage = {
  ref: jest.fn((path: string) => ({
    fullPath: path,
    name: path.split('/').pop(),
    bucket: 'mock-bucket',
    put: jest.fn(() =>
      Promise.resolve({
        ref: { fullPath: path },
        metadata: {
          size: 1024,
          contentType: 'application/pdf',
          timeCreated: new Date().toISOString(),
        },
      })
    ),
    getDownloadURL: jest.fn(() => Promise.resolve(`https://mock-storage.com/${path}`)),
    delete: jest.fn(() => Promise.resolve()),
  })),
};

export const resetMockFirebase = () => {
  mockFirestoreData.documents = {};
  mockFirestoreData.tasks = {};
  jest.clearAllMocks();
};
