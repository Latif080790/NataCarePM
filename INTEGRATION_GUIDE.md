# 🛡️ INTEGRATION GUIDE - Sanitization & Validation Utilities

**Purpose:** Step-by-step guide to integrate security utilities into all components  
**Timeline:** 1-2 days  
**Priority:** 🔴 CRITICAL

---

## 📋 OVERVIEW

We need to integrate 2 utilities into components:
1. **Input Sanitization** (`utils/sanitization.ts`) - Prevent XSS attacks
2. **File Validation** (`utils/fileValidation.ts`) - Prevent malicious uploads

---

## 🎯 COMPONENTS TO UPDATE

### High Priority (Do First)
1. ✅ `components/CreateTaskModal.tsx` - Task creation form
2. ✅ `components/CreatePOModal.tsx` - Purchase Order form
3. ✅ `components/TaskDetailModal.tsx` - Task editing
4. ✅ `components/UploadDocumentModal.tsx` - File uploads
5. ✅ `views/ProfileView.tsx` - User profile editing
6. ✅ `views/RabAhspView.tsx` - CSV export

### Medium Priority
7. ⚪ `views/DailyReportView.tsx` - Daily report form
8. ⚪ `views/AttendanceView.tsx` - Attendance form
9. ⚪ `views/LogisticsView.tsx` - Logistics form
10. ⚪ `views/FinanceView.tsx` - Finance form

---

## 📝 STEP 1: Update CreateTaskModal.tsx

**File:** `components/CreateTaskModal.tsx`

### Import Utilities
```typescript
// Add at top of file
import { sanitizeInput, isValidEmail } from '../utils/sanitization';
```

### Update Form Submission
```typescript
const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        // 🔒 Sanitize all text inputs
        const sanitizedTask = {
            title: sanitizeInput(title),
            description: sanitizeInput(description),
            projectId: currentProject?.id || '',
            status: status,
            priority: priority,
            assignedTo: selectedUsers.map(uid => uid),
            dueDate: dueDate || undefined,
            tags: tags.map(tag => sanitizeInput(tag)),
            estimatedHours: estimatedHours || undefined,
        };

        // Validate required fields
        if (!sanitizedTask.title || sanitizedTask.title.trim() === '') {
            showToast('Judul task harus diisi', 'error');
            return;
        }

        // Create task with sanitized data
        await taskService.createTask(sanitizedTask);
        
        showToast('Task berhasil dibuat!', 'success');
        onSuccess();
        onClose();
    } catch (error) {
        console.error('Error creating task:', error);
        showToast('Gagal membuat task', 'error');
    } finally {
        setIsSubmitting(false);
    }
};
```

### Update Input Fields (Optional - Real-time validation)
```typescript
<Input
    label="Judul Task"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    required
    maxLength={200}
    placeholder="Contoh: Pengecoran lantai 2"
/>

<textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    maxLength={2000}
    placeholder="Deskripsi detail task..."
    className="w-full p-3 border rounded-lg"
/>
```

---

## 📝 STEP 2: Update UploadDocumentModal.tsx

**File:** `components/UploadDocumentModal.tsx`

### Import Utilities
```typescript
import { 
    validateFile, 
    generateSafeFilename, 
    formatFileSize 
} from '../utils/fileValidation';
```

### Update File Selection Handler
```typescript
const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🔒 Validate file
    const validation = validateFile(file);
    
    if (!validation.valid) {
        showToast(validation.error!, 'error');
        e.target.value = ''; // Clear input
        return;
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
            showToast(warning, 'warning');
        });
    }

    // Generate safe filename
    const safeFilename = generateSafeFilename(file.name);
    
    setSelectedFile(file);
    setFilename(safeFilename);
    
    // Show file info
    showToast(
        `File dipilih: ${file.name} (${formatFileSize(file.size)})`,
        'success'
    );
};
```

### Update File Upload Handler
```typescript
const handleUpload = async () => {
    if (!selectedFile || !currentProject) return;

    setIsUploading(true);

    try {
        // Generate safe path
        const safeFilename = generateSafeFilename(selectedFile.name);
        const uploadPath = `projects/${currentProject.id}/documents/${safeFilename}`;

        // Upload to Firebase Storage
        const storageRef = ref(storage, uploadPath);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error('Upload error:', error);
                showToast('Gagal upload file', 'error');
                setIsUploading(false);
            },
            async () => {
                // Get download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                // Save document metadata to Firestore
                const docData = {
                    name: selectedFile.name,
                    safeFilename: safeFilename,
                    url: downloadURL,
                    size: selectedFile.size,
                    type: selectedFile.type,
                    uploadedBy: currentUser?.uid || '',
                    uploadedAt: new Date().toISOString(),
                    category: category || 'other',
                    description: sanitizeInput(description || ''),
                };

                await projectService.addDocument(currentProject.id, docData);
                
                showToast('Dokumen berhasil diupload!', 'success');
                onSuccess();
                onClose();
            }
        );
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Gagal upload dokumen', 'error');
    } finally {
        setIsUploading(false);
    }
};
```

### Add File Type Info Display
```typescript
<div className="mb-4">
    <p className="text-sm text-slate-600 mb-2">Tipe file yang diperbolehkan:</p>
    <div className="flex flex-wrap gap-2">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">PDF</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Word</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Excel</span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Images</span>
    </div>
    <p className="text-xs text-slate-500 mt-2">Maksimal: 10MB</p>
</div>

<input
    type="file"
    onChange={handleFileSelect}
    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
    className="w-full"
/>

{selectedFile && (
    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm font-medium">File dipilih:</p>
        <p className="text-sm text-slate-600">{selectedFile.name}</p>
        <p className="text-xs text-slate-500">
            Ukuran: {formatFileSize(selectedFile.size)}
        </p>
    </div>
)}
```

---

## 📝 STEP 3: Update RabAhspView.tsx (CSV Export)

**File:** `views/RabAhspView.tsx`

### Import Utility
```typescript
import { sanitizeCSVCell } from '../utils/sanitization';
```

### Update Export Function
```typescript
const exportToCSV = () => {
    if (!currentProject?.items || currentProject.items.length === 0) {
        showToast('Tidak ada data untuk diekspor', 'warning');
        return;
    }

    try {
        // CSV Header
        const headers = [
            'No',
            'Pekerjaan',
            'Volume',
            'Satuan',
            'Harga Satuan',
            'Jumlah',
            'Progress (%)',
            'Status'
        ];

        // 🔒 Sanitize header row
        const headerRow = headers.map(h => sanitizeCSVCell(h)).join(',');

        // 🔒 Sanitize data rows
        const dataRows = itemsWithProgress.map((item, index) => {
            return [
                sanitizeCSVCell(index + 1),
                sanitizeCSVCell(item.pekerjaan),
                sanitizeCSVCell(item.volume),
                sanitizeCSVCell(item.satuan),
                sanitizeCSVCell(item.hargaSatuan),
                sanitizeCSVCell(item.jumlah),
                sanitizeCSVCell(item.progress || 0),
                sanitizeCSVCell(getItemStatus(item))
            ].join(',');
        });

        // Combine header and data
        const csvContent = [headerRow, ...dataRows].join('\n');

        // Create safe filename
        const timestamp = new Date().toISOString().split('T')[0];
        const safeProjectName = currentProject.name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `RAB_${safeProjectName}_${timestamp}.csv`;

        // Download CSV
        const blob = new Blob(['\uFEFF' + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        showToast('Data berhasil diekspor ke CSV', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Gagal ekspor data', 'error');
    }
};
```

---

## 📝 STEP 4: Update ProfileView.tsx

**File:** `views/ProfileView.tsx`

### Import Utilities
```typescript
import { 
    sanitizeInput, 
    isValidEmail, 
    isStrongPassword,
    sanitizePhoneNumber 
} from '../utils/sanitization';
```

### Update Profile Update Handler
```typescript
const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        // 🔒 Validate email
        if (email && !isValidEmail(email)) {
            showToast('Format email tidak valid', 'error');
            return;
        }

        // 🔒 Sanitize inputs
        const sanitizedData = {
            name: sanitizeInput(name),
            email: email.toLowerCase().trim(),
            phoneNumber: phoneNumber ? sanitizePhoneNumber(phoneNumber) : undefined,
            department: department ? sanitizeInput(department) : undefined,
            position: position ? sanitizeInput(position) : undefined,
        };

        // Update in Firestore
        await projectService.updateUser(currentUser.uid, sanitizedData);
        
        showToast('Profile berhasil diupdate!', 'success');
    } catch (error) {
        console.error('Profile update error:', error);
        showToast('Gagal update profile', 'error');
    } finally {
        setIsSubmitting(false);
    }
};
```

### Update Password Change Handler
```typescript
const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    
    // 🔒 Validate new password strength
    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
        showToast(passwordCheck.message, 'error');
        return;
    }

    // Check password confirmation
    if (newPassword !== confirmPassword) {
        showToast('Password konfirmasi tidak cocok', 'error');
        return;
    }

    setIsChangingPassword(true);

    try {
        // Re-authenticate user with current password
        const credential = EmailAuthProvider.credential(
            currentUser.email!,
            currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser!, credential);

        // Update password
        await updatePassword(auth.currentUser!, newPassword);
        
        showToast('Password berhasil diubah!', 'success');
        
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        console.error('Password change error:', error);
        
        if (error.code === 'auth/wrong-password') {
            showToast('Password lama tidak sesuai', 'error');
        } else {
            showToast('Gagal mengubah password', 'error');
        }
    } finally {
        setIsChangingPassword(false);
    }
};
```

### Add Password Strength Indicator
```typescript
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    const check = isStrongPassword(password);
    
    return (
        <div className="mt-2">
            <div className="flex items-center space-x-2">
                {check.valid ? (
                    <CheckCircle size={16} className="text-green-500" />
                ) : (
                    <XCircle size={16} className="text-red-500" />
                )}
                <span className={`text-sm ${check.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {check.message}
                </span>
            </div>
            
            <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p className={password.length >= 8 ? 'text-green-600' : ''}>
                    ✓ Minimal 8 karakter
                </p>
                <p className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Mengandung huruf besar
                </p>
                <p className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Mengandung huruf kecil
                </p>
                <p className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Mengandung angka
                </p>
                <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Mengandung karakter khusus
                </p>
            </div>
        </div>
    );
};

// Usage in form:
<Input
    type="password"
    label="Password Baru"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    required
/>
{newPassword && <PasswordStrengthIndicator password={newPassword} />}
```

---

## ✅ TESTING CHECKLIST

### Input Sanitization Tests
- [ ] Try entering `<script>alert('XSS')</script>` in task title → Should be escaped
- [ ] Try entering `=1+1` in CSV export → Should be prefixed with `'`
- [ ] Try entering special characters in names → Should be sanitized
- [ ] Verify sanitized data in Firestore console

### File Validation Tests
- [ ] Try uploading .exe file → Should be rejected
- [ ] Try uploading 15MB file → Should be rejected
- [ ] Try uploading valid PDF → Should succeed
- [ ] Try uploading file with `../` in name → Should be sanitized
- [ ] Verify safe filenames in Firebase Storage

### Password Validation Tests
- [ ] Try weak password (e.g., "12345") → Should show error
- [ ] Try password without uppercase → Should show error
- [ ] Try password without special char → Should show error
- [ ] Try strong password → Should show success

---

## 🎯 QUICK IMPLEMENTATION CHECKLIST

```
Day 1 Morning (2-3 hours):
✅ Update CreateTaskModal.tsx
✅ Update CreatePOModal.tsx
✅ Update TaskDetailModal.tsx

Day 1 Afternoon (2-3 hours):
✅ Update UploadDocumentModal.tsx
✅ Update RabAhspView.tsx (CSV)
✅ Update ProfileView.tsx

Day 2 Morning (2-3 hours):
⚪ Update DailyReportView.tsx
⚪ Update AttendanceView.tsx
⚪ Update LogisticsView.tsx

Day 2 Afternoon (2-3 hours):
⚪ Manual testing all forms
⚪ Fix any issues found
⚪ Document integration complete
```

---

## 📚 REFERENCE

### Sanitization Functions
```typescript
// Basic text sanitization
sanitizeInput(text)        // Escape HTML chars
sanitizeHTML(html)         // Remove all HTML tags
sanitizeFileName(name)     // Remove dangerous chars
sanitizeCSVCell(value)     // Prevent formula injection
sanitizeURL(url)           // Block dangerous protocols

// Validation
isValidEmail(email)        // Email format check
isStrongPassword(pass)     // Password strength check

// Formatting
sanitizePhoneNumber(phone) // Format to +62
sanitizeNumber(value)      // Extract number
sanitizeDate(dateStr)      // Parse date safely
```

### File Validation Functions
```typescript
// Main validation
validateFile(file)                    // Comprehensive check
validateFiles(files)                  // Batch validation
validateFileForUpload(file, options)  // Pre-upload check

// Utilities
generateSafeFilename(name)  // Create safe filename
formatFileSize(bytes)       // Human-readable size
getFileExtension(name)      // Extract extension
isImageFile(file)          // Check if image
isDocumentFile(file)       // Check if document
```

---

**Total Estimated Time:** 1-2 days  
**Priority:** 🔴 CRITICAL  
**Next After This:** Manual security testing
