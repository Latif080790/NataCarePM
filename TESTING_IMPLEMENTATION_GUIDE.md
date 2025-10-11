# 🧪 TESTING IMPLEMENTATION GUIDE - NataCarePM

**Current Coverage:** 0% 🔴  
**Target Coverage:** 80% ✅  
**Timeline:** 2-3 weeks  
**Priority:** CRITICAL for production

---

## 📊 TESTING STRATEGY OVERVIEW

### Coverage Targets

| Test Type | Target | Priority | Effort |
|-----------|--------|----------|--------|
| **Unit Tests** | 80% | 🔴 Critical | Medium |
| **Integration Tests** | 60% | 🔴 Critical | High |
| **Component Tests** | 70% | 🔴 Critical | Medium |
| **E2E Tests** | 40% | 🟡 High | High |
| **Security Tests** | 100% | 🔴 Critical | Low |

---

## 🚀 PHASE 1: SETUP (Day 1-2)

### Step 1: Install Dependencies

```bash
npm install --save-dev \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @testing-library/react-hooks \
  jsdom \
  @faker-js/faker \
  msw \
  happy-dom
```

### Step 2: Create Configuration Files

**File:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', 'build'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: [
                'src/**/*.{ts,tsx}',
                'api/**/*.{ts,tsx}',
                'components/**/*.{ts,tsx}',
                'contexts/**/*.{ts,tsx}',
                'hooks/**/*.{ts,tsx}',
                'utils/**/*.{ts,tsx}',
                'views/**/*.{ts,tsx}',
            ],
            exclude: [
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData.ts',
                '**/types.ts',
                '**/constants.ts',
                '**/*.stories.tsx',
                '**/test/**',
            ],
            all: true,
            lines: 80,
            functions: 80,
            branches: 75,
            statements: 80,
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
```

**File:** `src/test/setup.ts`
```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock Firebase
vi.mock('../firebaseConfig', () => ({
    auth: {},
    db: {},
    storage: {},
}));

// Mock window.matchMedia
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() { return []; }
    unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
} as any;
```

**File:** `src/test/testUtils.tsx`
```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { ToastProvider } from '../contexts/ToastContext';
import { BrowserRouter } from 'react-router-dom';

// Mock user for testing
export const mockUser = {
    uid: 'test-uid-123',
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@example.com',
    roleId: 'admin',
    avatarUrl: 'https://i.pravatar.cc/150?u=test',
    isOnline: true,
    lastSeen: new Date().toISOString(),
};

// Mock project for testing
export const mockProject = {
    id: 'test-project-1',
    name: 'Test Construction Project',
    location: 'Jakarta',
    startDate: '2024-01-01',
    items: [],
    members: [mockUser],
    dailyReports: [],
    attendances: [],
    expenses: [],
    documents: [],
    purchaseOrders: [],
    inventory: [],
    termins: [],
    auditLog: [],
};

// Custom render with all providers
interface AllTheProvidersProps {
    children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
    return (
        <AuthProvider>
            <ProjectProvider>
                <ToastProvider>
                    <BrowserRouter>
                        {children}
                    </BrowserRouter>
                </ToastProvider>
            </ProjectProvider>
        </AuthProvider>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

**Update `package.json`:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## 🔬 PHASE 2: UNIT TESTS (Week 1)

### Day 1-2: Utility Functions

**File:** `utils/sanitization.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { 
    sanitizeInput, 
    sanitizeHTML, 
    sanitizeFileName, 
    sanitizeCSVCell,
    sanitizeURL 
} from './sanitization';

describe('sanitizeInput', () => {
    it('should escape HTML special characters', () => {
        const input = '<script>alert("XSS")</script>';
        const result = sanitizeInput(input);
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
    });
    
    it('should handle empty string', () => {
        expect(sanitizeInput('')).toBe('');
    });
    
    it('should trim whitespace', () => {
        expect(sanitizeInput('  test  ')).toBe('test');
    });
    
    it('should escape quotes', () => {
        const input = 'Test "quoted" text';
        const result = sanitizeInput(input);
        expect(result).toContain('&quot;');
    });
});

describe('sanitizeFileName', () => {
    it('should replace special characters with underscores', () => {
        const input = 'my file@#$.pdf';
        const result = sanitizeFileName(input);
        expect(result).toBe('my_file___.pdf');
    });
    
    it('should limit length to 255 characters', () => {
        const longName = 'a'.repeat(300) + '.pdf';
        const result = sanitizeFileName(longName);
        expect(result.length).toBeLessThanOrEqual(255);
    });
    
    it('should preserve dots and dashes', () => {
        const input = 'my-file.v1.0.pdf';
        const result = sanitizeFileName(input);
        expect(result).toBe('my-file.v1.0.pdf');
    });
});

describe('sanitizeCSVCell', () => {
    it('should prevent formula injection with =', () => {
        const input = '=1+1';
        const result = sanitizeCSVCell(input);
        expect(result).toBe("'=1+1");
    });
    
    it('should prevent formula injection with +', () => {
        const input = '+1+1';
        const result = sanitizeCSVCell(input);
        expect(result).toBe("'+1+1");
    });
    
    it('should escape quotes in normal text', () => {
        const input = 'Test "quoted" text';
        const result = sanitizeCSVCell(input);
        expect(result).toBe('"Test ""quoted"" text"');
    });
    
    it('should handle numbers', () => {
        const result = sanitizeCSVCell(12345);
        expect(result).toBe('"12345"');
    });
});

describe('sanitizeURL', () => {
    it('should block javascript: protocol', () => {
        const input = 'javascript:alert("XSS")';
        const result = sanitizeURL(input);
        expect(result).toBe('');
    });
    
    it('should block data: protocol', () => {
        const input = 'data:text/html,<script>alert("XSS")</script>';
        const result = sanitizeURL(input);
        expect(result).toBe('');
    });
    
    it('should add https:// to relative URLs', () => {
        const input = 'example.com/page';
        const result = sanitizeURL(input);
        expect(result).toBe('https://example.com/page');
    });
    
    it('should preserve valid HTTPS URLs', () => {
        const input = 'https://example.com/page';
        const result = sanitizeURL(input);
        expect(result).toBe('https://example.com/page');
    });
});
```

**File:** `utils/fileValidation.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { validateFile, MAX_FILE_SIZE } from './fileValidation';

describe('validateFile', () => {
    it('should reject files larger than MAX_FILE_SIZE', () => {
        const largeFile = new File(['x'.repeat(MAX_FILE_SIZE + 1)], 'large.pdf', {
            type: 'application/pdf',
        });
        
        const result = validateFile(largeFile);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('melebihi batas');
    });
    
    it('should accept valid PDF file', () => {
        const pdfFile = new File(['PDF content'], 'document.pdf', {
            type: 'application/pdf',
        });
        
        const result = validateFile(pdfFile);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });
    
    it('should reject executable files', () => {
        const exeFile = new File(['malicious'], 'virus.exe', {
            type: 'application/octet-stream',
        });
        
        const result = validateFile(exeFile);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('tidak diizinkan');
    });
    
    it('should reject files with mismatched extension', () => {
        const fakeFile = new File(['fake'], 'document.pdf', {
            type: 'application/msword',  // Extension says PDF, MIME says DOC
        });
        
        const result = validateFile(fakeFile);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('tidak sesuai');
    });
    
    it('should reject files with too long names', () => {
        const longName = 'a'.repeat(300) + '.pdf';
        const file = new File(['content'], longName, {
            type: 'application/pdf',
        });
        
        const result = validateFile(file);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('terlalu panjang');
    });
});
```

### Day 3-4: Hooks

**File:** `hooks/useProjectCalculations.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProjectCalculations } from './useProjectCalculations';
import { mockProject } from '../test/testUtils';

describe('useProjectCalculations', () => {
    it('should return null for null project', () => {
        const { result } = renderHook(() => useProjectCalculations(null));
        expect(result.current.metrics).toBeNull();
        expect(result.current.loading).toBe(false);
    });
    
    it('should calculate total budget correctly', () => {
        const project = {
            ...mockProject,
            items: [
                { id: 1, volume: 100, hargaSatuan: 50000, /* ... */ },
                { id: 2, volume: 50, hargaSatuan: 100000, /* ... */ },
            ],
        };
        
        const { result } = renderHook(() => useProjectCalculations(project));
        
        expect(result.current.metrics?.totalBudget).toBe(10000000); // 5M + 5M
    });
    
    it('should calculate CPI correctly', () => {
        const project = {
            ...mockProject,
            items: [{ id: 1, volume: 100, hargaSatuan: 1000, progress: 50 }],
            expenses: [{ id: 1, amount: 40000 }],
        };
        
        const { result } = renderHook(() => useProjectCalculations(project));
        
        // EV = 100 * 1000 * 0.5 = 50000
        // AC = 40000
        // CPI = EV / AC = 50000 / 40000 = 1.25
        expect(result.current.metrics?.evm.cpi).toBeCloseTo(1.25, 2);
    });
    
    it('should handle empty items array', () => {
        const project = {
            ...mockProject,
            items: [],
        };
        
        const { result } = renderHook(() => useProjectCalculations(project));
        
        expect(result.current.metrics?.totalBudget).toBe(0);
    });
});
```

### Day 5: Context Tests

**File:** `contexts/AuthContext.test.tsx`
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
        // Immediately call with null user
        callback(null);
        return vi.fn(); // unsubscribe function
    }),
}));

vi.mock('../api/projectService', () => ({
    projectService: {
        getUserById: vi.fn(),
    },
}));

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should provide initial state', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });
        
        expect(result.current.currentUser).toBeNull();
        expect(result.current.loading).toBe(false);
    });
    
    it('should login successfully', async () => {
        const mockFirebaseUser = {
            uid: 'firebase-uid-123',
            email: 'test@example.com',
        };
        
        (signInWithEmailAndPassword as any).mockResolvedValue({
            user: mockFirebaseUser,
        });
        
        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });
        
        let loginResult: boolean = false;
        await act(async () => {
            loginResult = await result.current.login('test@example.com', 'password123');
        });
        
        expect(loginResult).toBe(true);
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(),
            'test@example.com',
            'password123'
        );
    });
    
    it('should handle login failure', async () => {
        (signInWithEmailAndPassword as any).mockRejectedValue(
            new Error('Invalid credentials')
        );
        
        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });
        
        let loginResult: boolean = true;
        await act(async () => {
            loginResult = await result.current.login('test@example.com', 'wrong-password');
        });
        
        expect(loginResult).toBe(false);
    });
    
    it('should logout successfully', async () => {
        (signOut as any).mockResolvedValue(undefined);
        
        const { result } = renderHook(() => useAuth(), {
            wrapper: AuthProvider,
        });
        
        await act(async () => {
            await result.current.logout();
        });
        
        expect(signOut).toHaveBeenCalled();
    });
});
```

---

## 🧩 PHASE 3: COMPONENT TESTS (Week 2)

### Day 1-2: Core Components

**File:** `components/Button.test.tsx`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
    it('should render with correct text', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByRole('button')).toHaveTextContent('Click Me');
    });
    
    it('should call onClick handler when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click Me</Button>);
        
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
    
    it('should be disabled when loading', () => {
        render(<Button loading>Click Me</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });
    
    it('should show loading spinner when loading', () => {
        const { container } = render(<Button loading>Click Me</Button>);
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
    
    it('should apply primary variant styles by default', () => {
        render(<Button>Primary</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-blue-600');
    });
    
    it('should apply destructive variant styles', () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-red-600');
    });
    
    it('should not call onClick when disabled', () => {
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Disabled</Button>);
        
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).not.toHaveBeenCalled();
    });
    
    it('should render with icon', () => {
        const Icon = () => <span data-testid="icon">Icon</span>;
        render(<Button icon={<Icon />}>With Icon</Button>);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
});
```

**File:** `components/Card.test.tsx`
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

describe('Card Components', () => {
    it('should render Card with children', () => {
        render(
            <Card>
                <CardContent>Test Content</CardContent>
            </Card>
        );
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
    
    it('should render CardHeader with title', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Test Title</CardTitle>
                </CardHeader>
            </Card>
        );
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
    
    it('should apply custom className', () => {
        const { container } = render(
            <Card className="custom-class">
                <CardContent>Content</CardContent>
            </Card>
        );
        expect(container.firstChild).toHaveClass('custom-class');
    });
});
```

### Day 3-4: Form Components

**File:** `components/CreateTaskModal.test.tsx`
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTaskModal } from './CreateTaskModal';
import { mockUser, mockProject } from '../test/testUtils';

vi.mock('../api/taskService', () => ({
    taskService: {
        createTask: vi.fn(),
    },
}));

describe('CreateTaskModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();
    
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should render modal when open', () => {
        render(
            <CreateTaskModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );
        
        expect(screen.getByText('Buat Task Baru')).toBeInTheDocument();
    });
    
    it('should not render when closed', () => {
        const { container } = render(
            <CreateTaskModal
                isOpen={false}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );
        
        expect(container.firstChild).toBeNull();
    });
    
    it('should validate required fields', async () => {
        render(
            <CreateTaskModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );
        
        // Try to submit without filling required fields
        const submitButton = screen.getByText('Buat Task');
        fireEvent.click(submitButton);
        
        await waitFor(() => {
            expect(screen.getByText(/title is required/i)).toBeInTheDocument();
        });
    });
    
    it('should create task with valid data', async () => {
        const user = userEvent.setup();
        
        render(
            <CreateTaskModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );
        
        // Fill form
        await user.type(screen.getByLabelText(/title/i), 'New Task');
        await user.type(screen.getByLabelText(/description/i), 'Task description');
        await user.selectOptions(screen.getByLabelText(/priority/i), 'high');
        
        // Submit
        await user.click(screen.getByText('Buat Task'));
        
        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });
    
    it('should handle submission errors', async () => {
        const { taskService } = await import('../api/taskService');
        (taskService.createTask as any).mockRejectedValue(new Error('Network error'));
        
        const user = userEvent.setup();
        
        render(
            <CreateTaskModal
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );
        
        // Fill and submit
        await user.type(screen.getByLabelText(/title/i), 'New Task');
        await user.click(screen.getByText('Buat Task'));
        
        await waitFor(() => {
            expect(screen.getByText(/error/i)).toBeInTheDocument();
        });
    });
});
```

---

## 🔗 PHASE 4: INTEGRATION TESTS (Week 2-3)

**File:** `integration/authentication.test.tsx`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { signInWithEmailAndPassword } from 'firebase/auth';

vi.mock('firebase/auth');
vi.mock('../api/projectService');

describe('Authentication Flow', () => {
    it('should complete full login flow', async () => {
        const user = userEvent.setup();
        
        (signInWithEmailAndPassword as any).mockResolvedValue({
            user: { uid: 'test-uid', email: 'test@example.com' }
        });
        
        render(<App />);
        
        // Should show login form
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        
        // Fill login form
        await user.type(screen.getByLabelText(/email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');
        await user.click(screen.getByRole('button', { name: /login/i }));
        
        // Should navigate to dashboard
        await waitFor(() => {
            expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        });
    });
    
    it('should handle login failure', async () => {
        const user = userEvent.setup();
        
        (signInWithEmailAndPassword as any).mockRejectedValue(
            new Error('Invalid credentials')
        );
        
        render(<App />);
        
        await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
        await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
        await user.click(screen.getByRole('button', { name: /login/i }));
        
        await waitFor(() => {
            expect(screen.getByText(/gagal masuk/i)).toBeInTheDocument();
        });
    });
});
```

---

## 🎭 PHASE 5: E2E TESTS (Week 3)

**Setup Playwright:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**File:** `e2e/authentication.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
    test('should login and navigate to dashboard', async ({ page }) => {
        await page.goto('http://localhost:3000');
        
        // Fill login form
        await page.fill('input[type="email"]', 'pm@natacara.dev');
        await page.fill('input[type="password"]', 'NataCare2025!');
        await page.click('button:has-text("Login")');
        
        // Wait for dashboard
        await page.waitForURL('**/dashboard');
        
        // Verify dashboard elements
        await expect(page.locator('text=Dashboard')).toBeVisible();
        await expect(page.locator('text=Total Budget')).toBeVisible();
    });
    
    test('should logout successfully', async ({ page }) => {
        // Login first
        await page.goto('http://localhost:3000');
        await page.fill('input[type="email"]', 'pm@natacara.dev');
        await page.fill('input[type="password"]', 'NataCare2025!');
        await page.click('button:has-text("Login")');
        
        // Wait for dashboard
        await page.waitForURL('**/dashboard');
        
        // Logout
        await page.click('[aria-label="Logout"]');
        
        // Should return to login
        await expect(page.locator('input[type="email"]')).toBeVisible();
    });
});
```

---

## 📋 TESTING CHECKLIST

### Unit Tests (80% coverage target)
- [ ] `utils/sanitization.ts` - All functions
- [ ] `utils/fileValidation.ts` - All validation rules
- [ ] `hooks/useProjectCalculations.ts` - EVM calculations
- [ ] `hooks/useSecurityAndPerformance.ts` - Security functions
- [ ] `constants.ts` - Helper functions (hasPermission, formatCurrency)

### Component Tests (70% coverage target)
- [ ] `Button` - All variants, states, events
- [ ] `Card` - All compositions
- [ ] `Modal` - Open/close, events
- [ ] `Input` - Value changes, validation
- [ ] `CreateTaskModal` - Form validation, submission
- [ ] `CreatePOModal` - Form validation
- [ ] `TaskDetailModal` - Display, edit, delete
- [ ] `UploadDocumentModal` - File validation
- [ ] `DashboardSkeleton` - Rendering

### Context Tests (90% coverage target)
- [ ] `AuthContext` - Login, logout, session
- [ ] `ProjectContext` - CRUD operations
- [ ] `ToastContext` - Add, remove toasts

### Integration Tests (60% coverage target)
- [ ] Login → Dashboard flow
- [ ] Create Task → View Task flow
- [ ] Upload Document → View Document flow
- [ ] Add Daily Report → View Report flow
- [ ] Update Progress → Recalculate Metrics flow

### E2E Tests (40% coverage target)
- [ ] Complete user journey: Login → Create Project → Add Task → Logout
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### Security Tests (100% of security features)
- [ ] XSS attack prevention
- [ ] SQL injection prevention
- [ ] File upload validation
- [ ] Session timeout
- [ ] Permission checks

---

## ✅ ACCEPTANCE CRITERIA

### Code Coverage
```
Statements   : 80.00% ( 1234 / 1543 )
Branches     : 75.00% ( 456 / 608 )
Functions    : 80.00% ( 234 / 293 )
Lines        : 80.00% ( 1189 / 1486 )
```

### Test Quality
- All tests pass consistently
- No flaky tests
- Fast execution (< 30 seconds for unit tests)
- Clear test names and descriptions
- Proper cleanup after each test

### CI/CD Integration
- Tests run on every commit
- Coverage reports generated
- Failed tests block deployment
- Coverage badge in README

---

## 🎯 SUCCESS METRICS

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Unit Test Coverage | 0% | 80% | 🔴 |
| Component Test Coverage | 0% | 70% | 🔴 |
| Integration Test Coverage | 0% | 60% | 🔴 |
| E2E Test Coverage | 0% | 40% | 🔴 |
| Test Execution Time | N/A | < 2 min | ⚪ |
| Flaky Test Rate | N/A | < 1% | ⚪ |

**Timeline:** 2-3 weeks  
**Effort:** 1-2 developers full-time  
**Priority:** 🔴 CRITICAL for production

---

**Next Steps:**
1. Complete Phase 1 setup (Day 1-2)
2. Write unit tests for utilities (Day 3-5)
3. Write component tests (Week 2)
4. Write integration tests (Week 2-3)
5. Setup E2E tests (Week 3)
6. Achieve 80% coverage target
7. Integrate with CI/CD pipeline
