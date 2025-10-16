# 🚀 FEATURE IMPLEMENTATION ROADMAP - NataCarePM

**Start Date:** October 16, 2025  
**Version:** 3.0 Development  
**Status:** 🚧 Implementation Phase  
**Priority:** HIGH PRIORITY FEATURES

---

## 📋 IMPLEMENTATION OVERVIEW

Implementasi 12 fitur prioritas tinggi dan menengah untuk meningkatkan NataCarePM dari versi 2.0 (Production Ready) ke versi 3.0 (Enterprise Enhanced).

**Total Features:** 12  
**High Priority:** 5 features  
**Medium Priority:** 7 features  
**Estimated Time:** 8-12 weeks

---

## 🎯 PHASE 3A: HIGH PRIORITY FEATURES (Week 1-4)

### **Feature 1: User Profile Management Enhancement** 🔴 CRITICAL

**Status:** 🚧 Ready to Implement  
**Priority:** HIGH  
**Estimated Time:** 5-7 days  
**Complexity:** Medium

#### **Requirements:**

1. **Profile Photo Upload**
   - Upload to Firebase Storage
   - Image cropping & resizing
   - Avatar preview
   - Default avatars
   - File size limit: 2MB
   - Supported formats: JPG, PNG, WebP

2. **Password Change Functionality**
   - Current password verification
   - New password validation (min 8 chars, special chars)
   - Password strength meter
   - Confirmation dialog
   - Email notification on change

3. **Two-Factor Authentication (2FA)**
   - SMS-based OTP
   - Authenticator app support (TOTP)
   - Backup codes generation
   - 2FA recovery options
   - Remember device option

4. **Activity Log**
   - Last 100 user activities
   - Login history with IP & device
   - Actions performed (create, update, delete)
   - Timestamps
   - Export to CSV

5. **Email Notification Preferences**
   - Task assignments (on/off)
   - Project updates (on/off)
   - Financial alerts (on/off)
   - Daily digest (on/off)
   - Real-time notifications (on/off)

6. **Session Management**
   - Active sessions list
   - Device information (browser, OS)
   - Last activity timestamp
   - Logout from specific device
   - Logout all other sessions

7. **Device Management**
   - Trusted devices list
   - Device approval workflow
   - Revoke device access
   - Device activity alerts

#### **Implementation Files:**

```
views/
├── UserProfileView.tsx (Enhanced)
└── ProfileSettingsView.tsx (New)

components/
├── ProfilePhotoUpload.tsx (New)
├── PasswordChangeModal.tsx (New)
├── TwoFactorSetup.tsx (New)
├── ActivityLogTable.tsx (New)
├── NotificationPreferences.tsx (New)
├── SessionManagement.tsx (New)
└── DeviceManagement.tsx (New)

api/
├── userProfileService.ts (Enhanced)
├── authService.ts (Enhanced)
└── activityLogService.ts (New)

types/
└── userProfile.ts (New)

utils/
├── imageProcessing.ts (New)
└── passwordValidator.ts (New)
```

#### **Technical Specifications:**

**1. Profile Photo Upload:**
```typescript
// api/userProfileService.ts
export const uploadProfilePhoto = async (
  userId: string, 
  file: File
): Promise<APIResponse<{ photoURL: string }>> => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: { message: validation.errors.join(', ') } };
    }
    
    // Resize image to 400x400
    const resizedImage = await resizeImage(file, 400, 400);
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `profile-photos/${userId}/${Date.now()}.jpg`);
    const uploadTask = await uploadBytes(storageRef, resizedImage);
    const photoURL = await getDownloadURL(uploadTask.ref);
    
    // Update user profile in Firestore
    await updateDoc(doc(db, 'users', userId), { photoURL });
    
    return {
      success: true,
      data: { photoURL },
      message: 'Profile photo uploaded successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: { message: error.message, code: 'UPLOAD_ERROR' }
    };
  }
};
```

**2. Password Change:**
```typescript
// api/authService.ts
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<APIResponse<void>> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('User not authenticated');
    
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return { success: false, error: { message: validation.errors.join(', ') } };
    }
    
    // Update password
    await updatePassword(user, newPassword);
    
    // Log activity
    await logActivity(user.uid, 'PASSWORD_CHANGED');
    
    // Send email notification
    await sendPasswordChangeEmail(user.email);
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: { message: error.message, code: 'PASSWORD_CHANGE_ERROR' }
    };
  }
};
```

**3. Two-Factor Authentication:**
```typescript
// api/authService.ts
export const enableTwoFactor = async (
  method: '2FA_SMS' | '2FA_TOTP'
): Promise<APIResponse<{ secret?: string; qrCode?: string; backupCodes: string[] }>> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    let result: any = {};
    
    if (method === '2FA_TOTP') {
      // Generate TOTP secret
      const secret = generateTOTPSecret();
      const qrCode = await generateQRCode(secret, user.email!);
      result = { secret, qrCode };
    }
    
    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    
    // Save to Firestore
    await updateDoc(doc(db, 'users', user.uid), {
      twoFactorEnabled: true,
      twoFactorMethod: method,
      twoFactorSecret: result.secret || null,
      backupCodes: backupCodes.map(code => hashBackupCode(code)),
      twoFactorEnabledAt: new Date()
    });
    
    // Log activity
    await logActivity(user.uid, '2FA_ENABLED', { method });
    
    return {
      success: true,
      data: { ...result, backupCodes },
      message: 'Two-factor authentication enabled'
    };
  } catch (error) {
    return {
      success: false,
      error: { message: error.message, code: '2FA_ENABLE_ERROR' }
    };
  }
};
```

**4. Activity Log:**
```typescript
// api/activityLogService.ts
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  device: {
    browser: string;
    os: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
  };
  timestamp: Date;
  metadata?: Record<string, any>;
}

export const getUserActivityLog = async (
  userId: string,
  limit: number = 100
): Promise<APIResponse<ActivityLog[]>> => {
  try {
    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as ActivityLog[];
    
    return {
      success: true,
      data: logs,
      message: 'Activity log fetched successfully'
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: { message: error.message, code: 'FETCH_ERROR' }
    };
  }
};

export const logActivity = async (
  userId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const ipAddress = await getClientIP();
    const userAgent = navigator.userAgent;
    const device = parseUserAgent(userAgent);
    
    await addDoc(collection(db, 'activityLogs'), {
      userId,
      action,
      ipAddress,
      userAgent,
      device,
      timestamp: new Date(),
      metadata: metadata || {}
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
```

**5. Session Management:**
```typescript
// api/sessionService.ts
export interface UserSession {
  id: string;
  userId: string;
  deviceId: string;
  browser: string;
  os: string;
  ipAddress: string;
  lastActivity: Date;
  createdAt: Date;
  isCurrentDevice: boolean;
}

export const getUserSessions = async (
  userId: string
): Promise<APIResponse<UserSession[]>> => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      where('active', '==', true),
      orderBy('lastActivity', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const currentDeviceId = getDeviceId();
    
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastActivity: doc.data().lastActivity.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      isCurrentDevice: doc.data().deviceId === currentDeviceId
    })) as UserSession[];
    
    return {
      success: true,
      data: sessions,
      message: 'Sessions fetched successfully'
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: { message: error.message, code: 'FETCH_ERROR' }
    };
  }
};

export const logoutSession = async (
  sessionId: string
): Promise<APIResponse<void>> => {
  try {
    await updateDoc(doc(db, 'sessions', sessionId), {
      active: false,
      loggedOutAt: new Date()
    });
    
    return {
      success: true,
      message: 'Session logged out successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: { message: error.message, code: 'LOGOUT_ERROR' }
    };
  }
};

export const logoutAllOtherSessions = async (
  userId: string
): Promise<APIResponse<number>> => {
  try {
    const currentDeviceId = getDeviceId();
    
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(q);
    let count = 0;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      if (doc.data().deviceId !== currentDeviceId) {
        batch.update(doc.ref, {
          active: false,
          loggedOutAt: new Date()
        });
        count++;
      }
    });
    
    await batch.commit();
    
    return {
      success: true,
      data: count,
      message: `${count} session(s) logged out`
    };
  } catch (error) {
    return {
      success: false,
      data: 0,
      error: { message: error.message, code: 'LOGOUT_ERROR' }
    };
  }
};
```

#### **UI Components:**

**1. ProfilePhotoUpload Component:**
```typescript
// components/ProfilePhotoUpload.tsx
import React, { useState } from 'react';
import { Upload, Camera, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { uploadProfilePhoto } from '../api/userProfileService';
import { useToast } from '../contexts/ToastContext';

export const ProfilePhotoUpload: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const response = await uploadProfilePhoto(user!.id, file);
      if (response.success) {
        showToast('Profile photo updated successfully', 'success');
        updateUser({ photoURL: response.data!.photoURL });
      } else {
        showToast(response.error!.message, 'error');
      }
    } catch (error) {
      showToast('Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <img
          src={preview || user?.photoURL || '/default-avatar.png'}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
          <Camera className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Change Photo'}</span>
        </div>
      </label>

      <p className="text-sm text-gray-500">
        JPG, PNG or WebP. Max size 2MB.
      </p>
    </div>
  );
};
```

**2. PasswordChangeModal Component:**
```typescript
// components/PasswordChangeModal.tsx
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { changePassword } from '../api/authService';
import { useToast } from '../contexts/ToastContext';
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = {
    hasLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  };

  const isPasswordStrong = Object.values(passwordStrength).every(v => v);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      showToast('Password does not meet strength requirements', 'error');
      return;
    }

    if (!passwordsMatch) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await changePassword(currentPassword, newPassword);
      if (response.success) {
        showToast('Password changed successfully', 'success');
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(response.error!.message, 'error');
      }
    } catch (error) {
      showToast('Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type={showPassword ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          icon={<Lock className="w-4 h-4" />}
        />

        <Input
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          icon={<Lock className="w-4 h-4" />}
        />

        {newPassword && (
          <div className="space-y-2 text-sm">
            <p className="font-medium">Password must contain:</p>
            <div className="space-y-1">
              <PasswordRequirement 
                met={passwordStrength.hasLength} 
                text="At least 8 characters" 
              />
              <PasswordRequirement 
                met={passwordStrength.hasUppercase} 
                text="One uppercase letter" 
              />
              <PasswordRequirement 
                met={passwordStrength.hasLowercase} 
                text="One lowercase letter" 
              />
              <PasswordRequirement 
                met={passwordStrength.hasNumber} 
                text="One number" 
              />
              <PasswordRequirement 
                met={passwordStrength.hasSpecial} 
                text="One special character" 
              />
            </div>
          </div>
        )}

        <Input
          label="Confirm New Password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          icon={<Lock className="w-4 h-4" />}
        />

        {confirmPassword && (
          <div className="flex items-center space-x-2 text-sm">
            {passwordsMatch ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Passwords match</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Passwords do not match</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="showPassword" className="text-sm text-gray-600">
            Show passwords
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !isPasswordStrong || !passwordsMatch}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const PasswordRequirement: React.FC<{ met: boolean; text: string }> = ({ 
  met, 
  text 
}) => (
  <div className="flex items-center space-x-2">
    {met ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-gray-300" />
    )}
    <span className={met ? 'text-green-600' : 'text-gray-500'}>{text}</span>
  </div>
);
```

---

### **Testing Checklist for Feature 1:**

- [ ] Profile photo upload works
- [ ] Image resizing functions correctly
- [ ] Password change validates current password
- [ ] Password strength meter displays correctly
- [ ] 2FA setup generates valid TOTP secrets
- [ ] Backup codes are generated and stored securely
- [ ] Activity log displays user actions
- [ ] Session management shows active sessions
- [ ] Logout from specific device works
- [ ] Email notifications are sent correctly
- [ ] All forms validate input properly
- [ ] Error handling works for all scenarios

---

## 📝 IMPLEMENTATION STATUS

**Feature 1: User Profile Management** - 📋 Specifications Complete, Ready to Code

**Next Steps:**
1. Review specifications
2. Create component files
3. Implement backend services
4. Add Firebase Security Rules
5. Create UI components
6. Test thoroughly
7. Deploy to staging

---

**Apakah Anda ingin saya:**
1. ✅ **Mulai implementasi kode** untuk Feature 1?
2. 📋 **Lanjutkan dengan spesifikasi** untuk Feature 2-12?
3. 🔄 **Review dan revisi** spesifikasi Feature 1 dulu?

Silakan pilih atau beri instruksi spesifik!
