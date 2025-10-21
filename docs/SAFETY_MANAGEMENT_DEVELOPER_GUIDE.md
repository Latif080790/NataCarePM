# Safety Management System - Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Type System](#type-system)
8. [OSHA Compliance Implementation](#osha-compliance-implementation)
9. [Extending the System](#extending-the-system)
10. [Testing Strategy](#testing-strategy)
11. [Performance Optimization](#performance-optimization)
12. [Deployment Guidelines](#deployment-guidelines)
13. [Troubleshooting](#troubleshooting)

---

## 1. Architecture Overview

### System Architecture

The Safety Management System follows a modern React architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                    │
│  (Views: SafetyDashboard, IncidentManagement, Training)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    State Management Layer                    │
│              (SafetyContext - React Context API)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Service Layer                           │
│              (safetyService - Business Logic)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Data Layer                              │
│            (Firebase Firestore - Cloud Database)            │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

**1. Context Pattern**

- Global state management using React Context API
- Provides safety data and actions throughout component tree
- Prevents prop drilling

**2. Service Pattern**

- Business logic isolated in `safetyService.ts`
- Handles all Firebase interactions
- Implements OSHA calculations
- Provides clean API for components

**3. Repository Pattern**

- Firebase collections act as repositories
- Abstracted through service layer
- Easy to swap data sources

**4. Observer Pattern**

- React hooks for state subscriptions
- Real-time updates from Firebase
- Efficient re-rendering

---

## 2. Technology Stack

### Core Technologies

| Technology   | Version | Purpose            |
| ------------ | ------- | ------------------ |
| React        | 18.x    | UI framework       |
| TypeScript   | 5.x     | Type safety        |
| Firebase     | 10.x    | Backend & database |
| Tailwind CSS | 3.x     | Styling            |
| Lucide React | Latest  | Icons              |

### Development Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.7.0",
    "lucide-react": "^latest",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### Firebase Configuration

**Required Firebase Services:**

- Firestore Database
- Authentication (for user tracking)
- Storage (for incident photos/documents)
- Cloud Functions (optional, for notifications)

---

## 3. Project Structure

```
NataCarePM/
├── types/
│   ├── safety.types.ts          # 502 lines - All safety type definitions
│   ├── offline.types.ts         # 225 lines - Offline sync types
│   └── executive.types.ts       # 413 lines - Dashboard types
│
├── api/
│   └── safetyService.ts         # 726 lines - Service layer with Firebase
│
├── contexts/
│   └── SafetyContext.tsx        # 793 lines - Global state management
│
├── views/
│   ├── SafetyDashboardView.tsx  # 482 lines - Main dashboard
│   └── IncidentManagementView.tsx # 192 lines - Incident management
│
├── components/
│   └── safety/                  # (To be created)
│       ├── IncidentForm.tsx
│       ├── TrainingForm.tsx
│       └── AuditForm.tsx
│
└── docs/
    ├── SAFETY_MANAGEMENT_USER_GUIDE.md
    ├── SAFETY_MANAGEMENT_DEVELOPER_GUIDE.md
    └── SAFETY_MANAGEMENT_API_DOCUMENTATION.md
```

---

## 4. Core Components

### SafetyContext Provider

**Location:** `contexts/SafetyContext.tsx`

**Responsibilities:**

- Manages all safety-related state
- Provides 40+ action methods
- Handles loading and error states
- Implements optimistic updates

**Usage Example:**

```typescript
import { SafetyProvider, useSafety } from '@/contexts/SafetyContext';

// In App.tsx
function App() {
  return (
    <SafetyProvider>
      <YourComponents />
    </SafetyProvider>
  );
}

// In any component
function MyComponent() {
  const {
    incidents,
    fetchIncidents,
    createIncident,
    getCriticalIncidents
  } = useSafety();

  useEffect(() => {
    fetchIncidents('project-123');
  }, []);

  return <div>{/* Use incidents */}</div>;
}
```

### Safety Service Layer

**Location:** `api/safetyService.ts`

**Key Methods:**

```typescript
// Incident Management
safetyService.getIncidents(projectId: string): Promise<SafetyIncident[]>
safetyService.getIncidentById(id: string): Promise<SafetyIncident>
safetyService.createIncident(incident: Omit<SafetyIncident, 'id' | ...>): Promise<SafetyIncident>
safetyService.updateIncident(id: string, updates: Partial<SafetyIncident>): Promise<void>
safetyService.deleteIncident(id: string): Promise<void>

// Training Management
safetyService.getTraining(projectId: string): Promise<SafetyTraining[]>
safetyService.createTraining(training: ...): Promise<SafetyTraining>
safetyService.recordAttendance(trainingId: string, attendee: ...): Promise<void>

// PPE Management
safetyService.getPPEInventory(projectId: string): Promise<PPEInventory[]>
safetyService.assignPPE(assignment: ...): Promise<PPEAssignment>

// Audit Management
safetyService.getAudits(projectId: string): Promise<SafetyAudit[]>
safetyService.createAudit(audit: ...): Promise<SafetyAudit>

// Metrics & Analytics
safetyService.calculateMetrics(projectId: string, start: Date, end: Date): Promise<SafetyMetrics>
safetyService.getDashboardSummary(projectId: string): Promise<SafetyDashboardSummary>
```

---

## 5. State Management

### Context State Structure

```typescript
interface SafetyContextState {
  // Incidents
  incidents: SafetyIncident[];
  incidentsLoading: boolean;
  incidentsError: string | null;

  // Training
  training: SafetyTraining[];
  trainingLoading: boolean;
  trainingError: string | null;

  // PPE
  ppeInventory: PPEInventory[];
  ppeAssignments: PPEAssignment[];
  ppeLoading: boolean;
  ppeError: string | null;

  // Audits
  audits: SafetyAudit[];
  auditsLoading: boolean;
  auditsError: string | null;

  // Metrics
  metrics: SafetyMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;

  // Dashboard
  dashboardSummary: SafetyDashboardSummary | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
}
```

### Performance Optimizations

**1. useCallback for Actions**

```typescript
const fetchIncidents = useCallback(async (projectId: string) => {
  setIncidentsLoading(true);
  setIncidentsError(null);
  try {
    const fetchedIncidents = await safetyService.getIncidents(projectId);
    setIncidents(fetchedIncidents);
  } catch (error) {
    setIncidentsError(error.message);
  } finally {
    setIncidentsLoading(false);
  }
}, []);
```

**2. useMemo for Derived Data**

```typescript
const getCriticalIncidents = useCallback((): SafetyIncident[] => {
  return incidents.filter((i) => i.severity === 'fatal' || i.severity === 'critical');
}, [incidents]);
```

**3. Immutable Updates**

```typescript
const updateIncident = useCallback(async (id: string, updates: Partial<SafetyIncident>) => {
  await safetyService.updateIncident(id, updates);
  setIncidents((prev) =>
    prev.map((incident) => (incident.id === id ? { ...incident, ...updates } : incident))
  );
}, []);
```

---

## 6. API Integration

### Firebase Setup

**Initialize Firebase:**

```typescript
// firebase.config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

### Firestore Collections

| Collection        | Document ID    | Purpose                      |
| ----------------- | -------------- | ---------------------------- |
| `safetyIncidents` | Auto-generated | Store incident records       |
| `safetyTraining`  | Auto-generated | Training sessions            |
| `ppeInventory`    | Auto-generated | PPE stock items              |
| `ppeAssignments`  | Auto-generated | PPE assignments to workers   |
| `safetyAudits`    | Auto-generated | Audit records                |
| `projects`        | Project ID     | Store work hours for metrics |

### Data Conversion

**Firebase Timestamp Handling:**

```typescript
const convertTimestamps = (doc: DocumentData): SafetyIncident => {
  return {
    ...doc,
    occurredAt: doc.occurredAt?.toDate() || new Date(),
    reportedAt: doc.reportedAt?.toDate() || new Date(),
    createdAt: doc.createdAt?.toDate() || new Date(),
    updatedAt: doc.updatedAt?.toDate() || new Date(),
  };
};
```

---

## 7. Type System

### Core Type Definitions

**Location:** `types/safety.types.ts` (502 lines)

**Key Type Hierarchies:**

```typescript
// Enums
export type IncidentSeverity = 'fatal' | 'critical' | 'major' | 'minor' | 'near_miss';
export type IncidentStatus = 'draft' | 'reported' | 'investigating' | 'resolved' | 'closed';
export type IncidentType =
  | 'injury'
  | 'illness'
  | 'near_miss'
  | 'property_damage'
  | 'environmental'
  | 'security';

// Main Entities
export interface SafetyIncident {
  id: string;
  incidentNumber: string;
  projectId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  location: string;
  occurredAt: Date;
  reportedAt: Date;
  reportedBy: string;
  injuredPersons: InjuredPerson[];
  witnesses: Witness[];
  correctiveActions: CorrectiveAction[];
  attachments: Attachment[];
  oshaRecordable: boolean;
  oshaClassification?: string;
  medicalCosts?: number;
  propertyCosts?: number;
  productivityCosts?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 8. OSHA Compliance Implementation

### OSHA Metrics Formulas

**1. TRIR (Total Recordable Incident Rate)**

```typescript
const calculateTRIR = (recordableIncidents: number, totalWorkHours: number): number => {
  // Formula: (Number of OSHA recordable incidents × 200,000) / Total work hours
  // 200,000 = Base for 100 full-time employees working 40 hours/week, 50 weeks/year
  if (totalWorkHours === 0) return 0;
  return (recordableIncidents * 200000) / totalWorkHours;
};
```

**Industry Benchmarks:**

- Excellent: < 2.0
- Average: 2.0 - 4.0
- Poor: > 4.0

**2. LTIFR (Lost Time Injury Frequency Rate)**

```typescript
const calculateLTIFR = (lostTimeInjuries: number, totalWorkHours: number): number => {
  // Formula: (Number of lost time injuries × 200,000) / Total work hours
  if (totalWorkHours === 0) return 0;
  return (lostTimeInjuries * 200000) / totalWorkHours;
};
```

**3. DART (Days Away, Restricted, Transfer Rate)**

```typescript
const calculateDART = (dartCases: number, totalWorkHours: number): number => {
  // Formula: (DART cases × 200,000) / Total work hours
  if (totalWorkHours === 0) return 0;
  return (dartCases * 200000) / totalWorkHours;
};
```

### Auto-Generated Numbering System

```typescript
const generateIncidentNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const incidentsRef = collection(db, 'safetyIncidents');

  const q = query(
    incidentsRef,
    where('incidentNumber', '>=', `INC-${year}-000`),
    where('incidentNumber', '<', `INC-${year + 1}-000`),
    orderBy('incidentNumber', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);

  let nextNumber = 1;
  if (!snapshot.empty) {
    const lastNumber = snapshot.docs[0].data().incidentNumber;
    const lastSequence = parseInt(lastNumber.split('-')[2]);
    nextNumber = lastSequence + 1;
  }

  return `INC-${year}-${String(nextNumber).padStart(3, '0')}`;
};
```

---

## 9. Extending the System

### Adding New Incident Type

**Step 1: Update Types** (`types/safety.types.ts`)

```typescript
export type IncidentType =
  | 'injury'
  | 'illness'
  | 'near_miss'
  | 'property_damage'
  | 'environmental'
  | 'security'
  | 'cybersecurity'; // ← New type
```

**Step 2: Update UI** (`views/IncidentManagementView.tsx`)

```typescript
const incidentTypes = [
  { value: 'injury', label: 'Injury' },
  { value: 'illness', label: 'Illness' },
  { value: 'cybersecurity', label: 'Cybersecurity' }, // ← New option
];
```

---

## 10. Testing Strategy

### Unit Testing

```typescript
// api/__tests__/safetyService.test.ts
import { safetyService } from '../safetyService';

describe('safetyService', () => {
  it('should calculate TRIR correctly', async () => {
    const metrics = await safetyService.calculateMetrics(
      'project-123',
      new Date('2024-01-01'),
      new Date('2024-12-31')
    );

    // 2 recordable incidents, 100,000 work hours
    // TRIR = (2 * 200,000) / 100,000 = 4.0
    expect(metrics.rates.totalRecordableIncidentRate).toBe(4.0);
  });
});
```

---

## 11. Performance Optimization

### React Memoization

```typescript
const criticalIncidents = useMemo(() => {
  return incidents
    .filter((i) => i.severity === 'fatal' || i.severity === 'critical')
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
}, [incidents]);
```

### Firebase Pagination

```typescript
const getIncidentsPaginated = async (
  projectId: string,
  pageSize: number = 25,
  lastDoc?: DocumentSnapshot
): Promise<{ incidents: SafetyIncident[]; lastDoc: DocumentSnapshot | null }> => {
  let q = query(
    collection(db, 'safetyIncidents'),
    where('projectId', '==', projectId),
    orderBy('occurredAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  return {
    incidents: snapshot.docs.map((doc) => convertTimestamps(doc.data())),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
};
```

---

## 12. Deployment Guidelines

### Environment Setup

```env
# .env.production
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=sender_id
REACT_APP_FIREBASE_APP_ID=app_id
```

### Build Process

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /safetyIncidents/{incidentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                    request.resource.data.reportedBy == request.auth.uid;
      allow update, delete: if request.auth != null &&
                             resource.data.reportedBy == request.auth.uid;
    }
  }
}
```

---

## 13. Troubleshooting

### Common Issues

**Issue: Firebase timestamp conversion errors**

```typescript
// Solution: Always check for null timestamps
const convertTimestamps = (doc: DocumentData): SafetyIncident => {
  return {
    ...doc,
    occurredAt: doc.occurredAt?.toDate() || new Date(),
    reportedAt: doc.reportedAt?.toDate() || new Date(),
  };
};
```

**Issue: Incident number conflicts**

```typescript
// Solution: Use Firestore transactions
const generateIncidentNumber = async (): Promise<string> => {
  return await runTransaction(db, async (transaction) => {
    // Query and increment within transaction
    // Prevents race conditions
  });
};
```

**Issue: Large dataset performance**

```typescript
// Solution: Implement pagination and virtual scrolling
// Use react-window for large lists
// Add Firestore composite indexes
```

---

## Appendix

### Quick Reference

**Key Files:**

- `types/safety.types.ts` - Type definitions
- `api/safetyService.ts` - API service layer
- `contexts/SafetyContext.tsx` - State management
- `views/SafetyDashboardView.tsx` - Main dashboard
- `views/IncidentManagementView.tsx` - Incident management

**OSHA Formulas:**

- TRIR = (Recordable Incidents × 200,000) / Total Work Hours
- LTIFR = (Lost Time Injuries × 200,000) / Total Work Hours
- DART = (DART Cases × 200,000) / Total Work Hours

**Contact:**

- Technical Lead: [Your Name]
- Safety Compliance Officer: [Name]
- Documentation: See `docs/` folder
