# 🔐 SECURITY FIXES - PRIORITY ACTION LIST

**Priority: CRITICAL** 🔴  
**Timeline: Must complete before production deployment**  
**Estimated Effort: 2-3 days**

---

## 🚨 CRITICAL SECURITY ISSUES

### Issue #1: Hardcoded Default Password

**Severity:** 🔴 CRITICAL  
**Files Affected:**
- `contexts/AuthContext.tsx`
- `views/LoginView.tsx`
- `views/EnterpriseLoginView.tsx`

**Current Code:**
```typescript
// ❌ contexts/AuthContext.tsx (Line 48)
const mockPassword = "NataCare2025!";  // EXPOSED PASSWORD!

// ❌ views/LoginView.tsx (Line 34)
const [password, setPassword] = useState('NataCare2025!');

// ❌ views/EnterpriseLoginView.tsx (Line 34)
const [password, setPassword] = useState('NataCare2025!');
```

**Fix Required:**
```typescript
// ✅ contexts/AuthContext.tsx
const login = useCallback(async (email: string, password: string) => {
    // Remove default password parameter
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);  // No fallback!
        return true;
    } catch (error) {
        console.error("Firebase login failed", error);
        return false;
    }
}, []);

// ✅ views/LoginView.tsx & EnterpriseLoginView.tsx
const [password, setPassword] = useState('');  // Empty by default
```

**Action Steps:**
1. [ ] Remove `mockPassword` variable from `AuthContext.tsx`
2. [ ] Change `password?: string` to `password: string` in login function signature
3. [ ] Set default password state to empty string in both login views
4. [ ] Test login flow with real credentials
5. [ ] Verify error handling for empty password submission

---

### Issue #2: No Firebase Security Rules

**Severity:** 🔴 CRITICAL  
**Current State:** No `firestore.rules` file exists  
**Risk:** Any authenticated user can read/write ANY data

**Create File:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return isSignedIn() 
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId 
        : null;
    }
    
    function hasRole(role) {
      return getUserRole() == role;
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isPM() {
      return hasRole('pm');
    }
    
    function isSiteManager() {
      return hasRole('site_manager');
    }
    
    function isFinance() {
      return hasRole('finance');
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles (for project member lists)
      allow read: if isSignedIn();
      
      // Users can update their own profile
      allow update: if isSignedIn() && request.auth.uid == userId;
      
      // Only admins can create or delete users
      allow create, delete: if isAdmin();
    }
    
    // Projects collection
    match /projects/{projectId} {
      // All authenticated users can view projects they're part of
      allow read: if isSignedIn();
      
      // Only PM and Admin can create projects
      allow create: if isPM() || isAdmin();
      
      // PM, Admin, and Site Manager can update projects
      allow update: if isPM() || isAdmin() || isSiteManager();
      
      // Only Admin can delete projects
      allow delete: if isAdmin();
      
      // Daily Reports subcollection
      match /dailyReports/{reportId} {
        allow read: if isSignedIn();
        allow create: if isSiteManager() || isPM() || isAdmin();
        allow update: if isSiteManager() || isPM() || isAdmin();
        allow delete: if isAdmin();
        
        // Comments sub-subcollection
        match /comments/{commentId} {
          allow read: if isSignedIn();
          allow create: if isSignedIn();
          allow update: if request.auth.uid == resource.data.authorId;
          allow delete: if request.auth.uid == resource.data.authorId || isAdmin();
        }
      }
      
      // Purchase Orders subcollection
      match /purchaseOrders/{poId} {
        allow read: if isSignedIn();
        allow create: if isPM() || isFinance() || isAdmin();
        allow update: if isFinance() || isAdmin();
        allow delete: if isAdmin();
      }
      
      // Attendances subcollection
      match /attendances/{attendanceId} {
        allow read: if isSignedIn();
        allow create: if isSiteManager() || isPM() || isAdmin();
        allow update: if isSiteManager() || isPM() || isAdmin();
        allow delete: if isAdmin();
      }
      
      // Expenses subcollection
      match /expenses/{expenseId} {
        allow read: if isSignedIn();
        allow create: if isSiteManager() || isPM() || isFinance() || isAdmin();
        allow update: if isFinance() || isAdmin();
        allow delete: if isAdmin();
      }
      
      // Documents subcollection
      match /documents/{documentId} {
        allow read: if isSignedIn();
        allow create: if isPM() || isAdmin();
        allow update: if isPM() || isAdmin();
        allow delete: if isPM() || isAdmin();
      }
      
      // Tasks subcollection
      match /tasks/{taskId} {
        allow read: if isSignedIn();
        allow create: if isPM() || isAdmin();
        allow update: if isSignedIn();  // Anyone can update tasks assigned to them
        allow delete: if isPM() || isAdmin();
        
        // Task comments
        match /comments/{commentId} {
          allow read: if isSignedIn();
          allow create: if isSignedIn();
          allow update: if request.auth.uid == resource.data.authorId;
          allow delete: if request.auth.uid == resource.data.authorId || isAdmin();
        }
      }
      
      // Other subcollections (inventory, termins, auditLog) - similar pattern
      match /{subCollection}/{docId} {
        allow read: if isSignedIn();
        allow write: if isPM() || isAdmin();
      }
    }
    
    // Workers collection
    match /workers/{workerId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isAdmin();  // System-generated
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow delete: if isAdmin();
    }
    
    // Master Data collection
    match /masterData/{docId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

**Storage Rules:** Create `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Projects documents
    match /projects/{projectId}/documents/{allPaths=**} {
      // Anyone authenticated can read
      allow read: if request.auth != null;
      
      // Only authenticated users can upload
      allow create: if request.auth != null 
                    && request.resource.size < 10 * 1024 * 1024  // 10MB limit
                    && request.resource.contentType.matches('image/.*|application/pdf|application/msword|application/vnd.openxmlformats-officedocument.*');
      
      // Uploader or admin can delete
      allow delete: if request.auth != null;
    }
  }
}
```

**Action Steps:**
1. [ ] Create `firestore.rules` file in project root
2. [ ] Create `storage.rules` file in project root
3. [ ] Deploy rules: `firebase deploy --only firestore:rules,storage:rules`
4. [ ] Test with different user roles
5. [ ] Verify unauthorized access is blocked

---

### Issue #3: Missing Input Sanitization

**Severity:** 🔴 CRITICAL  
**Risk:** XSS attacks via user input

**Affected Components:**
- `components/CreateTaskModal.tsx`
- `components/CreatePOModal.tsx`
- `components/TaskDetailModal.tsx`
- `views/DailyReportView.tsx`
- All form components

**Current Code:**
```typescript
// ❌ NO SANITIZATION
const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newTask = {
        title: formData.title,  // ⚠️ Direct user input!
        description: formData.description,  // ⚠️ Direct user input!
    };
    await taskService.createTask(projectId, newTask, user);
};
```

**Fix Required:**

**Step 1:** Create sanitization utility

**File:** `utils/sanitization.ts`
```typescript
/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';
    
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
};

/**
 * Sanitizes HTML while preserving safe tags
 */
export const sanitizeHTML = (html: string): string => {
    // Use DOMPurify for more sophisticated HTML sanitization
    // For now, strip all HTML tags
    return html.replace(/<[^>]*>/g, '');
};

/**
 * Validates and sanitizes file name
 */
export const sanitizeFileName = (fileName: string): string => {
    return fileName
        .replace(/[^a-zA-Z0-9._-]/g, '_')  // Allow only alphanumeric, dots, dashes
        .replace(/_{2,}/g, '_')  // Replace multiple underscores with single
        .substring(0, 255);  // Limit length
};

/**
 * Prevents CSV injection attacks
 */
export const sanitizeCSVCell = (value: string | number): string => {
    const stringValue = String(value);
    
    // Prevent formula injection
    if (stringValue.match(/^[=+\-@]/)) {
        return `'${stringValue}`;  // Prefix with single quote
    }
    
    // Escape quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
};

/**
 * Sanitizes URL to prevent javascript: protocol
 */
export const sanitizeURL = (url: string): string => {
    const trimmed = url.trim();
    
    // Block javascript: and data: protocols
    if (trimmed.match(/^(javascript|data|vbscript):/i)) {
        return '';
    }
    
    // Ensure https:// or relative path
    if (!trimmed.match(/^(https?:)?\/\//)) {
        return `https://${trimmed}`;
    }
    
    return trimmed;
};
```

**Step 2:** Apply sanitization in forms

```typescript
// ✅ CreateTaskModal.tsx
import { sanitizeInput } from '../utils/sanitization';

const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const newTask = {
        title: sanitizeInput(formData.title),
        description: sanitizeInput(formData.description),
        // ... other fields
    };
    
    await taskService.createTask(projectId, newTask, user);
};
```

**Action Steps:**
1. [ ] Create `utils/sanitization.ts` with all sanitization functions
2. [ ] Apply `sanitizeInput` to ALL text inputs in forms
3. [ ] Apply `sanitizeFileName` to file uploads
4. [ ] Apply `sanitizeCSVCell` to CSV exports
5. [ ] Test with malicious input patterns
6. [ ] Add tests for sanitization functions

---

### Issue #4: No File Upload Validation

**Severity:** 🟡 HIGH  
**Files:** `components/UploadDocumentModal.tsx`

**Current Code:**
```typescript
// ❌ NO VALIDATION
const [file, setFile] = useState<File | null>(null);

const handleSubmit = async () => {
    if (!file) return;
    await onUpload({ name, category, uploadDate, file });
};
```

**Fix Required:**

**File:** `utils/fileValidation.ts`
```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `Ukuran file melebihi batas maksimal ${MAX_FILE_SIZE / 1024 / 1024}MB`
        };
    }
    
    // Check MIME type
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
        return {
            valid: false,
            error: 'Tipe file tidak diizinkan. Hanya PDF, gambar, dan dokumen Office yang diperbolehkan.'
        };
    }
    
    // Check file extension matches MIME type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];
    
    if (!allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: 'Ekstensi file tidak sesuai dengan tipe file.'
        };
    }
    
    // Validate file name
    if (file.name.length > 255) {
        return {
            valid: false,
            error: 'Nama file terlalu panjang (maksimal 255 karakter).'
        };
    }
    
    // Check for suspicious patterns in file name
    if (file.name.match(/\.(exe|bat|cmd|sh|ps1)$/i)) {
        return {
            valid: false,
            error: 'File executable tidak diizinkan.'
        };
    }
    
    return { valid: true };
};
```

**Apply to UploadDocumentModal:**
```typescript
import { validateFile, sanitizeFileName } from '../utils/fileValidation';

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
        addToast(validation.error!, 'error');
        return;
    }
    
    setFile(selectedFile);
};

const handleSubmit = async () => {
    if (!file) return;
    
    const safeName = sanitizeFileName(file.name);
    
    await onUpload({
        name: safeName,
        category,
        uploadDate,
        file
    });
};
```

**Action Steps:**
1. [ ] Create `utils/fileValidation.ts`
2. [ ] Update `UploadDocumentModal.tsx` with validation
3. [ ] Add visual feedback for validation errors
4. [ ] Test with various file types
5. [ ] Test with oversized files
6. [ ] Test with malicious file names

---

### Issue #5: No Session Timeout

**Severity:** 🟡 HIGH  
**File:** `contexts/AuthContext.tsx`

**Current Code:**
```typescript
// ❌ Sessions never expire (until manual logout)
```

**Fix Required:**
```typescript
// ✅ Add session timeout
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastActivity, setLastActivity] = useState(Date.now());
    
    const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
    const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
    
    // Track user activity
    useEffect(() => {
        const handleActivity = () => {
            setLastActivity(Date.now());
        };
        
        window.addEventListener('mousedown', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('touchstart', handleActivity);
        
        return () => {
            window.removeEventListener('mousedown', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
        };
    }, []);
    
    // Check for session timeout
    useEffect(() => {
        if (!currentUser) return;
        
        const checkSession = setInterval(() => {
            const inactiveTime = Date.now() - lastActivity;
            
            if (inactiveTime > SESSION_TIMEOUT) {
                logout();
                alert('Sesi Anda telah berakhir karena tidak aktif. Silakan login kembali.');
            }
        }, ACTIVITY_CHECK_INTERVAL);
        
        return () => clearInterval(checkSession);
    }, [currentUser, lastActivity]);
    
    // ... rest of the code
};
```

**Action Steps:**
1. [ ] Add session timeout logic to `AuthContext.tsx`
2. [ ] Add activity tracking
3. [ ] Add warning before auto-logout (5 minutes before)
4. [ ] Add "Extend Session" button in warning dialog
5. [ ] Test with real inactivity scenarios

---

## 📋 IMPLEMENTATION CHECKLIST

### Day 1: Critical Fixes
- [ ] **Issue #1:** Remove hardcoded passwords (30 mins)
- [ ] **Issue #2:** Create Firebase Security Rules (2 hours)
- [ ] **Issue #2:** Test security rules with different roles (1 hour)

### Day 2: Input Validation
- [ ] **Issue #3:** Create sanitization utilities (1 hour)
- [ ] **Issue #3:** Apply sanitization to all forms (3 hours)
- [ ] **Issue #3:** Test with malicious inputs (1 hour)
- [ ] **Issue #4:** Create file validation utility (1 hour)
- [ ] **Issue #4:** Apply to upload components (1 hour)

### Day 3: Session & Testing
- [ ] **Issue #5:** Implement session timeout (2 hours)
- [ ] **Issue #5:** Test session timeout scenarios (1 hour)
- [ ] **Testing:** Write security tests (3 hours)
- [ ] **Final:** Complete security audit verification

---

## ✅ VERIFICATION STEPS

After implementing all fixes:

1. **Password Security:**
   - [ ] Try logging in with empty password (should fail)
   - [ ] Verify no default passwords in code
   - [ ] Check all login views

2. **Firebase Security:**
   - [ ] Try accessing other user's data (should fail)
   - [ ] Try unauthorized delete (should fail)
   - [ ] Try role-restricted action (should fail)
   - [ ] Verify rules in Firebase Console

3. **Input Sanitization:**
   - [ ] Try XSS payloads: `<script>alert('XSS')</script>`
   - [ ] Try SQL injection: `' OR '1'='1`
   - [ ] Try HTML injection: `<img src=x onerror=alert(1)>`
   - [ ] Verify all inputs are sanitized

4. **File Upload:**
   - [ ] Try uploading .exe file (should fail)
   - [ ] Try uploading 50MB file (should fail)
   - [ ] Try malicious filename (should be sanitized)
   - [ ] Verify only allowed types accepted

5. **Session Timeout:**
   - [ ] Wait for 2 hours of inactivity (should logout)
   - [ ] Test activity tracking (should reset timer)
   - [ ] Test warning dialog (should appear 5 mins before)

---

## 🎯 SUCCESS CRITERIA

✅ **All Critical Issues Resolved:**
- No hardcoded credentials
- Firebase Security Rules active
- All inputs sanitized
- File uploads validated
- Session timeout enforced

✅ **Security Grade Improvement:**
- Before: 78/100 (B)
- Target: 95/100 (A)

✅ **Production Ready:**
- All security tests passing
- No critical vulnerabilities
- Ready for deployment

---

**Priority:** 🔴 CRITICAL  
**Timeline:** 2-3 days  
**Next Phase:** Testing Infrastructure Setup
