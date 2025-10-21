# 🏗️ Architecture Guide - NataCarePM

**Version:** 2.0  
**Last Updated:** October 16, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Project Structure](#project-structure)
4. [Layer Architecture](#layer-architecture)
5. [Code Patterns](#code-patterns)
6. [Naming Conventions](#naming-conventions)
7. [State Management](#state-management)
8. [API Design](#api-design)
9. [Type System](#type-system)
10. [Best Practices](#best-practices)

---

## 🎯 System Overview

NataCarePM follows a **modular, layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                     Views Layer                         │
│            (User Interface Components)                  │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Components Layer                        │
│              (Reusable UI Elements)                     │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Contexts Layer                          │
│            (Global State Management)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   Hooks Layer                            │
│            (Reusable Logic & Effects)                   │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                    API Layer                             │
│          (Service Functions & Data Access)              │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                 Firebase Backend                         │
│        (Firestore, Auth, Storage, Functions)           │
└─────────────────────────────────────────────────────────┘
```

---

## 🧱 Architecture Principles

### **1. Separation of Concerns**

- **Views** handle UI layout and user interactions
- **Components** are reusable UI building blocks
- **Contexts** manage global application state
- **Hooks** encapsulate reusable logic
- **API Services** handle all backend communication
- **Types** ensure type safety across layers

### **2. Single Responsibility**

- Each file/function has one clear purpose
- Components focus on rendering
- Services focus on data operations
- Hooks focus on logic reuse

### **3. DRY (Don't Repeat Yourself)**

- Reusable components in `components/`
- Shared logic in custom hooks
- Common types in `types/`
- Utility functions in `utils/`

### **4. Type Safety First**

- TypeScript strict mode enabled
- All functions have explicit types
- Interfaces for complex objects
- No `any` types (except rare cases)

### **5. Scalability**

- Modular design allows easy feature addition
- Clear boundaries between modules
- API layer abstracts backend details
- Context prevents prop drilling

---

## 📁 Project Structure

```
NataCarePM/
│
├── 📂 api/                          # API Service Layer (29 services)
│   ├── projectService.ts            # Project CRUD operations
│   ├── taskService.ts               # Task management
│   ├── chartOfAccountsService.ts    # Accounting operations
│   ├── journalService.ts            # Financial transactions
│   ├── accountsPayableService.ts    # AP module
│   ├── accountsReceivableService.ts # AR module
│   ├── materialRequestService.ts    # Material requests
│   ├── goodsReceiptService.ts       # Goods receipt
│   ├── purchaseOrderService.ts      # Purchase orders
│   ├── inventoryService.ts          # Inventory management
│   ├── vendorService.ts             # Vendor management
│   ├── wbsService.ts                # Work Breakdown Structure
│   ├── evmService.ts                # Earned Value Management
│   ├── costControlService.ts        # Cost control
│   ├── kpiService.ts                # KPI tracking
│   ├── intelligentDocumentService.ts # Document intelligence
│   ├── ocrService.ts                # OCR processing
│   ├── smartTemplatesEngine.ts      # Smart templates
│   ├── documentVersionControl.ts    # Version control
│   ├── digitalSignaturesService.ts  # Digital signatures
│   ├── monitoringService.ts         # System monitoring
│   ├── notificationService.ts       # Notifications
│   ├── automationService.ts         # Automation rules
│   ├── auditService.ts              # Audit trails
│   ├── currencyService.ts           # Currency operations
│   ├── financialForecastingService.ts # Forecasting
│   ├── enhancedRabService.ts        # RAB management
│   └── ... (additional services)
│
├── 📂 components/                   # Reusable UI Components (60+)
│   ├── Button.tsx                   # Button component
│   ├── Card.tsx                     # Card container
│   ├── Modal.tsx                    # Modal dialog
│   ├── Input.tsx                    # Form input
│   ├── Select.tsx                   # Dropdown select
│   ├── Table.tsx                    # Data table
│   ├── Sidebar.tsx                  # Navigation sidebar
│   ├── Navbar.tsx                   # Top navigation
│   ├── ErrorBoundary.tsx            # Error handling
│   ├── SafeViewWrapper.tsx          # View wrapper
│   ├── NavigationDebug.tsx          # Debug navigation
│   │
│   ├── 📂 charts/                   # Chart Components
│   │   ├── GaugeChart.tsx
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   └── ProjectProgressChart.tsx
│   │
│   ├── 📂 forms/                    # Form Components
│   │   ├── CreateTaskModal.tsx
│   │   ├── CreatePOModal.tsx
│   │   ├── PODetailsModal.tsx
│   │   └── ... (form components)
│   │
│   └── 📂 dashboards/               # Dashboard Components
│       ├── MetricCard.tsx
│       ├── ProgressIndicator.tsx
│       └── ... (dashboard widgets)
│
├── 📂 contexts/                     # React Context Providers
│   ├── AuthContext.tsx              # Authentication state
│   ├── ProjectContext.tsx           # Project state
│   ├── ToastContext.tsx             # Toast notifications
│   └── RealtimeCollaborationContext.tsx # Collaboration
│
├── 📂 hooks/                        # Custom React Hooks
│   ├── useAuth.ts                   # Authentication hook
│   ├── useProjectData.ts            # Project data hook
│   ├── useSessionTimeout.ts         # Session management
│   ├── useLocalStorage.ts           # Local storage hook
│   └── ... (additional hooks)
│
├── 📂 types/                        # TypeScript Type Definitions
│   ├── types.ts                     # Core types (Project, Task, User)
│   ├── accounting.ts                # Accounting types
│   ├── logistics.ts                 # Logistics types
│   ├── inventory.ts                 # Inventory types
│   ├── monitoring.ts                # Monitoring types
│   ├── vendor.ts                    # Vendor types
│   ├── wbs.ts                       # WBS types
│   ├── costControl.ts               # Cost control types
│   ├── automation.ts                # Automation types
│   └── components.ts                # Component prop types
│
├── 📂 utils/                        # Utility Functions
│   ├── sanitization.ts              # Input sanitization (12 functions)
│   ├── fileValidation.ts            # File validation (10 functions)
│   ├── formatters.ts                # Data formatters
│   └── ... (utility functions)
│
├── 📂 views/                        # Main Application Views (45+)
│   ├── DashboardView.tsx            # Main dashboard
│   ├── ProjectListView.tsx          # Project listing
│   ├── TaskListView.tsx             # Task management
│   ├── ChartOfAccountsView.tsx      # Accounting
│   ├── JournalView.tsx              # Journal entries
│   ├── AccountsPayableView.tsx      # AP module
│   ├── AccountsReceivableView.tsx   # AR module
│   ├── MaterialRequestView.tsx      # Material requests
│   ├── GoodsReceiptView.tsx         # Goods receipt
│   ├── InventoryView.tsx            # Inventory
│   ├── VendorManagementView.tsx     # Vendors
│   ├── WBSManagementView.tsx        # WBS
│   ├── IntegratedAnalyticsView.tsx  # Analytics
│   └── ... (40+ more views)
│
├── 📂 scripts/                      # Utility Scripts
│   ├── create-user-profiles.js
│   ├── firebase-setup.js
│   ├── setup-real-data.js
│   └── ... (setup scripts)
│
├── 📂 docs/                         # Documentation (YOU ARE HERE)
│   ├── README.md
│   ├── SETUP.md
│   ├── ARCHITECTURE.md
│   └── ... (other docs)
│
├── 📂 archive/                      # Historical Documentation
│   └── historical/
│       ├── phase1/
│       ├── phase2/
│       └── reports/
│
├── App.tsx                          # Root application component
├── index.tsx                        # Application entry point
├── firebaseConfig.ts                # Firebase configuration
├── constants.ts                     # Application constants
├── mockData.ts                      # Mock/test data
├── vite.config.ts                   # Vite build configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies & scripts
└── ... (config files)
```

---

## 🏛️ Layer Architecture

### **1. Views Layer**

**Purpose:** Main application pages/screens

**Characteristics:**

- One view per route/page
- Combines multiple components
- Handles page-level state
- Connects to contexts and hooks
- Manages data fetching

**Example:**

```typescript
// views/DashboardView.tsx
export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { projects } = useProjectData();

  return (
    <SafeViewWrapper>
      <h1>Dashboard</h1>
      <MetricCard projects={projects} />
      <ProjectProgressChart data={projects} />
    </SafeViewWrapper>
  );
};
```

**Naming Convention:** `[Feature]View.tsx`

---

### **2. Components Layer**

**Purpose:** Reusable UI building blocks

**Characteristics:**

- Pure, presentational components
- Receive data via props
- No direct API calls
- Reusable across views
- Type-safe props

**Example:**

```typescript
// components/Card.tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className }) => {
  return (
    <div className={`card ${className}`}>
      <h3>{title}</h3>
      {children}
    </div>
  );
};
```

**Naming Convention:** `[ComponentName].tsx` (PascalCase)

---

### **3. Contexts Layer**

**Purpose:** Global state management

**Characteristics:**

- Provides global state
- Wraps App component
- Uses React Context API
- Avoids prop drilling
- Single source of truth

**Example:**

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Implementation...

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**Naming Convention:** `[Feature]Context.tsx`

---

### **4. Hooks Layer**

**Purpose:** Reusable logic and side effects

**Characteristics:**

- Custom React hooks
- Encapsulate reusable logic
- Handle side effects
- Return data and functions
- Follow React hooks rules

**Example:**

```typescript
// hooks/useProjectData.ts
export const useProjectData = (projectId?: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [projectId]);

  return { projects, loading, error };
};
```

**Naming Convention:** `use[Feature].ts`

---

### **5. API Service Layer**

**Purpose:** Backend communication and data operations

**Characteristics:**

- All Firebase/backend calls
- CRUD operations
- Data transformation
- Error handling
- Type-safe responses

**Example:**

```typescript
// api/projectService.ts
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Project, APIResponse } from '../types/types';

class ProjectService {
  private collectionName = 'projects';

  async getProjects(): Promise<APIResponse<Project[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const projects = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Project
      );

      return {
        success: true,
        data: projects,
        message: 'Projects fetched successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: { message: error.message, code: 'FETCH_ERROR' },
      };
    }
  }

  async createProject(project: Omit<Project, 'id'>): Promise<APIResponse<Project>> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), project);
      const newProject = { id: docRef.id, ...project };

      return {
        success: true,
        data: newProject,
        message: 'Project created successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: { message: error.message, code: 'CREATE_ERROR' },
      };
    }
  }

  // Additional methods: updateProject, deleteProject, getProjectById...
}

export const projectService = new ProjectService();
```

**Naming Convention:** `[feature]Service.ts`

---

## 🎨 Code Patterns

### **1. Component Pattern**

```typescript
// Functional component with TypeScript
import React from 'react';

interface MyComponentProps {
  title: string;
  count: number;
  onAction?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  count,
  onAction
}) => {
  // State
  const [isActive, setIsActive] = React.useState(false);

  // Effects
  React.useEffect(() => {
    // Side effects here
  }, [count]);

  // Handlers
  const handleClick = () => {
    setIsActive(!isActive);
    onAction?.();
  };

  // Render
  return (
    <div className="my-component">
      <h2>{title}</h2>
      <p>Count: {count}</p>
      <button onClick={handleClick}>
        {isActive ? 'Active' : 'Inactive'}
      </button>
    </div>
  );
};
```

### **2. API Response Pattern**

```typescript
// Standardized API response
interface APIResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: {
    message: string;
    code: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

// Usage in service
async function fetchData(): Promise<APIResponse<DataType>> {
  try {
    const data = await someOperation();
    return {
      success: true,
      data: data,
      message: 'Operation successful',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error.message,
        code: 'OPERATION_FAILED',
      },
    };
  }
}
```

### **3. Error Boundary Pattern**

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

### **4. Custom Hook Pattern**

```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}
```

---

## 📛 Naming Conventions

### **Files**

```
Components:     PascalCase.tsx    (Button.tsx, UserCard.tsx)
Views:          PascalCase.tsx    (DashboardView.tsx)
Services:       camelCase.ts      (projectService.ts)
Hooks:          camelCase.ts      (useAuth.ts, useProjectData.ts)
Types:          camelCase.ts      (types.ts, accounting.ts)
Utils:          camelCase.ts      (sanitization.ts)
Constants:      camelCase.ts      (constants.ts)
```

### **Variables & Functions**

```typescript
// Variables: camelCase
const userName = 'John';
const projectList = [];
const isActive = true;

// Functions: camelCase
function calculateTotal() {}
const handleSubmit = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_ENDPOINT = 'https://api.example.com';

// Types/Interfaces: PascalCase
interface UserProfile {}
type ProjectStatus = 'active' | 'completed';

// Components: PascalCase
const UserCard: React.FC = () => {};
export const DashboardView = () => {};
```

### **CSS Classes**

```css
/* kebab-case */
.project-card {
}
.user-profile-header {
}
.btn-primary {
}
```

---

## 🔄 State Management

### **Local State** (useState)

For component-specific state:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '', email: '' });
```

### **Global State** (Context API)

For app-wide state:

```typescript
// In Context
const [user, setUser] = useState<User | null>(null);

// In Component
const { user, setUser } = useAuth();
```

### **Server State** (Custom Hooks)

For data from backend:

```typescript
const { projects, loading, error } = useProjectData();
```

### **URL State** (React Router)

For routing state:

```typescript
const { projectId } = useParams();
const navigate = useNavigate();
```

---

## 🔌 API Design

### **Service Structure**

Each service is a class with methods for CRUD operations:

```typescript
class FeatureService {
  private collectionName = 'features';

  // CREATE
  async create(data: CreateDTO): Promise<APIResponse<Entity>> {}

  // READ
  async getAll(): Promise<APIResponse<Entity[]>> {}
  async getById(id: string): Promise<APIResponse<Entity>> {}

  // UPDATE
  async update(id: string, data: UpdateDTO): Promise<APIResponse<Entity>> {}

  // DELETE
  async delete(id: string): Promise<APIResponse<void>> {}

  // CUSTOM OPERATIONS
  async customOperation(params: any): Promise<APIResponse<any>> {}
}

export const featureService = new FeatureService();
```

### **Error Handling**

All service methods return standardized APIResponse:

- `success: true` → Operation successful
- `success: false` → Operation failed, check `error` field

---

## 📐 Type System

### **Core Types** (`types/types.ts`)

```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  budget: number;
  startDate: Date;
  endDate: Date;
}

export type UserRole = 'admin' | 'project_manager' | 'accountant' | 'team_member';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';
```

### **Module-Specific Types**

- `types/accounting.ts` - Accounting module types
- `types/logistics.ts` - Logistics module types
- etc.

---

## ✅ Best Practices

### **1. Component Design**

- ✅ Small, focused components
- ✅ Props explicitly typed
- ✅ Use destructuring for props
- ✅ Extract complex logic to hooks
- ❌ Don't mix UI and business logic

### **2. State Management**

- ✅ Use local state when possible
- ✅ Use context for global state
- ✅ Custom hooks for data fetching
- ❌ Don't overuse context

### **3. API Calls**

- ✅ All API calls in service layer
- ✅ Handle errors consistently
- ✅ Return standardized responses
- ❌ No direct Firebase calls in components

### **4. Type Safety**

- ✅ Explicit types for all functions
- ✅ Interfaces for complex objects
- ✅ Use TypeScript strict mode
- ❌ Avoid `any` type

### **5. Code Organization**

- ✅ One component per file
- ✅ Group related files
- ✅ Clear folder structure
- ❌ Don't mix concerns

---

## 🎓 Learning Path

For new developers:

1. Study project structure
2. Review type definitions in `types/`
3. Examine existing components
4. Look at service implementations
5. Practice on feature branch

---

**Architecture Guide Version:** 2.0  
**Last Updated:** October 16, 2025  
**Next Review:** January 2026

**Status:** ✅ Production Ready
