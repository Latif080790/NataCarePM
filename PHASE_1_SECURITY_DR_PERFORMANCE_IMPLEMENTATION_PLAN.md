# 🔐 PHASE 1: SECURITY + DISASTER RECOVERY + PERFORMANCE
## Implementation Plan - Detailed & Comprehensive

**Start Date:** 17 Oktober 2025  
**Target Completion:** 2 November 2025 (16 days)  
**Total Effort:** 180 hours  
**Priority:** 🔴 CRITICAL  
**Team Size:** 1 Senior Developer (full-time)

---

## 🎯 OBJECTIVES & SUCCESS CRITERIA

### **Primary Goals**
1. ✅ Eliminate critical security vulnerabilities (CVSS 7+)
2. ✅ Implement disaster recovery capability (RTO: 4h, RPO: 1h)
3. ✅ Improve performance by 50% (load time: 3.5s → <2s)
4. ✅ Achieve 80%+ test coverage for security features
5. ✅ Zero production incidents during implementation

### **Success Metrics**
```
Security:
├── Rate limiting: 100% on auth endpoints
├── 2FA adoption: Setup for admin users
├── Input validation: 100% coverage
├── RBAC: 100% route protection
└── Security headers: All implemented

Disaster Recovery:
├── Backup automation: Daily + real-time
├── Recovery procedures: Documented & tested
├── RTO: ≤ 4 hours
├── RPO: ≤ 1 hour
└── DR drill: Passed

Performance:
├── Load time: <2 seconds (vs 3.5s)
├── Bundle size: <1MB initial (vs 2.8MB)
├── Lighthouse score: >90 (vs ~70)
├── Cache hit rate: >80%
└── Re-render reduction: >50%
```

---

## 📋 DETAILED IMPLEMENTATION ROADMAP

### **WEEK 1: SECURITY HARDENING (Days 1-5)**

---

#### **DAY 1: Rate Limiting & Auth Security**
**Duration:** 8 hours  
**Priority:** 🔴 CRITICAL

##### **Tasks:**

**1.1 Install Dependencies** (30 min)
```bash
npm install express-rate-limit --save
npm install lodash.throttle lodash.debounce --save
npm install @types/lodash.throttle @types/lodash.debounce --save-dev
```

**1.2 Create Rate Limit Utility** (2 hours)
**File:** `utils/rateLimiter.ts`

```typescript
import { Timestamp } from 'firebase/firestore';

interface RateLimitConfig {
  windowMs: number;        // Time window in ms
  maxAttempts: number;     // Max attempts in window
  blockDurationMs: number; // How long to block after max attempts
}

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry>;
  private configs: Map<string, RateLimitConfig>;

  constructor() {
    this.storage = new Map();
    this.configs = new Map();
    this.setupDefaultConfigs();
  }

  private setupDefaultConfigs() {
    // Login attempts: 5 attempts per 15 minutes
    this.configs.set('login', {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 5,
      blockDurationMs: 30 * 60 * 1000 // 30 min block
    });

    // Password reset: 3 attempts per hour
    this.configs.set('password-reset', {
      windowMs: 60 * 60 * 1000,
      maxAttempts: 3,
      blockDurationMs: 60 * 60 * 1000 // 1 hour block
    });

    // API calls: 100 per minute
    this.configs.set('api', {
      windowMs: 60 * 1000,
      maxAttempts: 100,
      blockDurationMs: 5 * 60 * 1000 // 5 min block
    });

    // 2FA attempts: 3 per 15 minutes
    this.configs.set('2fa', {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 3,
      blockDurationMs: 15 * 60 * 1000
    });
  }

  checkLimit(identifier: string, type: string): {
    allowed: boolean;
    remainingAttempts: number;
    resetAt?: Date;
    blockedUntil?: Date;
  } {
    const config = this.configs.get(type);
    if (!config) {
      throw new Error(`Rate limit config not found for type: ${type}`);
    }

    const key = `${type}:${identifier}`;
    const now = Date.now();
    const entry = this.storage.get(key);

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: new Date(entry.blockedUntil)
      };
    }

    // No previous attempts or window expired
    if (!entry || (now - entry.firstAttempt) > config.windowMs) {
      this.storage.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts - 1,
        resetAt: new Date(now + config.windowMs)
      };
    }

    // Within window, increment attempts
    entry.attempts++;
    entry.lastAttempt = now;

    // Max attempts reached
    if (entry.attempts > config.maxAttempts) {
      entry.blockedUntil = now + config.blockDurationMs;
      this.storage.set(key, entry);
      
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: new Date(entry.blockedUntil)
      };
    }

    this.storage.set(key, entry);
    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - entry.attempts,
      resetAt: new Date(entry.firstAttempt + config.windowMs)
    };
  }

  reset(identifier: string, type: string): void {
    const key = `${type}:${identifier}`;
    this.storage.delete(key);
  }

  // Cleanup old entries (run periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      const config = this.configs.get(key.split(':')[0]);
      if (!config) continue;

      // Remove if window expired and not blocked
      if ((now - entry.firstAttempt) > config.windowMs && 
          (!entry.blockedUntil || entry.blockedUntil < now)) {
        this.storage.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
```

**1.3 Update Auth Service with Rate Limiting** (2 hours)
**File:** `api/authService.ts`

Add at the top:
```typescript
import { rateLimiter } from '../utils/rateLimiter';
```

Find the login function and wrap it:
```typescript
export const login = async (email: string, password: string) => {
  // Rate limit check
  const rateCheck = rateLimiter.checkLimit(email, 'login');
  
  if (!rateCheck.allowed) {
    const message = rateCheck.blockedUntil 
      ? `Too many login attempts. Account locked until ${rateCheck.blockedUntil.toLocaleTimeString()}`
      : 'Too many login attempts. Please try again later.';
    
    throw new Error(message);
  }

  try {
    // Existing login logic
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Success - reset rate limit
    rateLimiter.reset(email, 'login');
    
    return result;
  } catch (error) {
    // Failed login - rate limit will persist
    throw error;
  }
};
```

**1.4 Strong Password Policy** (1 hour)
**File:** `utils/passwordValidator.ts` (NEW)

```typescript
export interface PasswordStrength {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  feedback: string[];
  isValid: boolean;
}

const COMMON_PASSWORDS = [
  'password', '12345678', 'qwerty', 'abc123', 'monkey', 'letmein',
  '111111', 'password123', 'admin', 'welcome', 'login', 'passw0rd'
];

export const validatePassword = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Minimum length: 12 characters
  if (password.length < 12) {
    feedback.push('Password must be at least 12 characters long');
    return { score: 0, level: 'weak', feedback, isValid: false };
  }
  score += 20;

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters (A-Z)');
  } else {
    score += 20;
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters (a-z)');
  } else {
    score += 20;
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers (0-9)');
  } else {
    score += 20;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Add special characters (!@#$%^&*)');
  } else {
    score += 20;
  }

  // Check for common passwords
  if (COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common))) {
    feedback.push('Avoid common passwords');
    score = Math.min(score, 30);
  }

  // Check for repeating characters
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters');
    score -= 10;
  }

  // Determine level
  let level: PasswordStrength['level'];
  if (score < 40) level = 'weak';
  else if (score < 60) level = 'fair';
  else if (score < 80) level = 'good';
  else if (score < 100) level = 'strong';
  else level = 'excellent';

  const isValid = score >= 80 && feedback.length === 0;

  if (isValid) {
    feedback.push('✓ Strong password!');
  }

  return { score, level, feedback, isValid };
};
```

**1.5 Create Password Strength Component** (1.5 hours)
**File:** `components/PasswordStrengthIndicator.tsx` (NEW)

```typescript
import React from 'react';
import { validatePassword, PasswordStrength } from '../utils/passwordValidator';

interface PasswordStrengthIndicatorProps {
  password: string;
  show: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  show
}) => {
  if (!show || !password) return null;

  const strength = validatePassword(password);

  const getColor = () => {
    switch (strength.level) {
      case 'weak': return '#ef4444';
      case 'fair': return '#f59e0b';
      case 'good': return '#eab308';
      case 'strong': return '#22c55e';
      case 'excellent': return '#16a34a';
    }
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ flex: 1, height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${strength.score}%`, 
              height: '100%', 
              backgroundColor: getColor(),
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
        <span style={{ fontSize: '12px', fontWeight: '600', color: getColor() }}>
          {strength.level.toUpperCase()}
        </span>
      </div>
      {strength.feedback.length > 0 && (
        <ul style={{ margin: '4px 0 0 0', padding: '0 0 0 20px', fontSize: '12px', color: '#6b7280' }}>
          {strength.feedback.map((fb, idx) => (
            <li key={idx} style={{ color: fb.startsWith('✓') ? '#22c55e' : '#ef4444' }}>
              {fb}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

**1.6 Testing** (1 hour)
Create `__tests__/security/rateLimiter.test.ts`

**Verification:**
- ✅ Login limited to 5 attempts per 15 min
- ✅ Account locks for 30 min after max attempts
- ✅ Password validation works
- ✅ Password strength indicator shows

---

#### **DAY 2: Two-Factor Authentication (2FA)**
**Duration:** 8 hours  
**Priority:** 🔴 CRITICAL

##### **Tasks:**

**2.1 Install Dependencies** (15 min)
```bash
npm install otpauth qrcode --save
npm install @types/qrcode --save-dev
```

**2.2 Create 2FA Service** (3 hours)
**File:** `api/twoFactorService.ts` (NEW)

```typescript
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  enabled: boolean;
  createdAt: Date;
}

interface TwoFactorData {
  userId: string;
  secret: string;
  backupCodes: string[];
  enabled: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export const twoFactorService = {
  /**
   * Generate 2FA secret and QR code for user
   */
  async generateSecret(userId: string, email: string): Promise<TwoFactorSecret> {
    // Generate secret
    const secret = new OTPAuth.Secret({ size: 20 });
    
    // Create TOTP
    const totp = new OTPAuth.TOTP({
      issuer: 'NataCarePM',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret
    });

    // Generate QR code
    const otpauthURL = totp.toString();
    const qrCode = await QRCode.toDataURL(otpauthURL);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);

    // Save to Firestore (not enabled yet)
    const twoFactorData: TwoFactorData = {
      userId,
      secret: secret.base32,
      backupCodes: backupCodes.map(code => this.hashBackupCode(code)),
      enabled: false,
      createdAt: new Date()
    };

    await setDoc(doc(db, 'twoFactorAuth', userId), twoFactorData);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes, // Return unhashed for user to save
      enabled: false,
      createdAt: new Date()
    };
  },

  /**
   * Verify TOTP code and enable 2FA
   */
  async enableTwoFactor(userId: string, code: string): Promise<boolean> {
    const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));
    
    if (!twoFactorDoc.exists()) {
      throw new Error('2FA not initialized. Generate secret first.');
    }

    const data = twoFactorDoc.data() as TwoFactorData;
    
    // Verify code
    const isValid = this.verifyTOTP(data.secret, code);
    
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    // Enable 2FA
    await updateDoc(doc(db, 'twoFactorAuth', userId), {
      enabled: true,
      lastUsed: new Date()
    });

    return true;
  },

  /**
   * Verify TOTP code during login
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));
    
    if (!twoFactorDoc.exists()) {
      return false; // 2FA not setup
    }

    const data = twoFactorDoc.data() as TwoFactorData;
    
    if (!data.enabled) {
      return false; // 2FA not enabled
    }

    // Try TOTP code
    const totpValid = this.verifyTOTP(data.secret, code);
    if (totpValid) {
      await updateDoc(doc(db, 'twoFactorAuth', userId), {
        lastUsed: new Date()
      });
      return true;
    }

    // Try backup code
    const backupValid = await this.verifyBackupCode(userId, code, data.backupCodes);
    if (backupValid) {
      return true;
    }

    return false;
  },

  /**
   * Check if user has 2FA enabled
   */
  async isEnabled(userId: string): Promise<boolean> {
    const twoFactorDoc = await getDoc(doc(db, 'twoFactorAuth', userId));
    
    if (!twoFactorDoc.exists()) {
      return false;
    }

    const data = twoFactorDoc.data() as TwoFactorData;
    return data.enabled === true;
  },

  /**
   * Disable 2FA
   */
  async disable(userId: string, code: string): Promise<boolean> {
    const isValid = await this.verifyCode(userId, code);
    
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    await deleteDoc(doc(db, 'twoFactorAuth', userId));
    return true;
  },

  /**
   * Verify TOTP code
   */
  verifyTOTP(secret: string, code: string): boolean {
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });

    // Allow 1 time step before/after for clock drift
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  },

  /**
   * Generate backup codes
   */
  generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  },

  /**
   * Hash backup code for storage
   */
  hashBackupCode(code: string): string {
    // Simple hash - in production use bcrypt
    return btoa(code);
  },

  /**
   * Verify and consume backup code
   */
  async verifyBackupCode(
    userId: string, 
    code: string, 
    hashedCodes: string[]
  ): Promise<boolean> {
    const hashedInput = this.hashBackupCode(code);
    const index = hashedCodes.indexOf(hashedInput);
    
    if (index === -1) {
      return false;
    }

    // Remove used backup code
    hashedCodes.splice(index, 1);
    await updateDoc(doc(db, 'twoFactorAuth', userId), {
      backupCodes: hashedCodes,
      lastUsed: new Date()
    });

    return true;
  }
};
```

**2.3 Create 2FA Setup Component** (2 hours)
**File:** `components/TwoFactorSetup.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import { twoFactorService } from '../api/twoFactorService';
import { useAuth } from '../contexts/AuthContext';

export const TwoFactorSetup: React.FC = () => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<'generate' | 'verify' | 'backup' | 'complete'>('generate');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      const result = await twoFactorService.generateSecret(
        currentUser.uid,
        currentUser.email || ''
      );
      
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!currentUser || !verificationCode) return;
    
    setLoading(true);
    setError('');
    
    try {
      await twoFactorService.enableTwoFactor(currentUser.uid, verificationCode);
      setStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setStep('complete');
  };

  if (step === 'generate') {
    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <h2>Setup Two-Factor Authentication</h2>
        <p>Add an extra layer of security to your account.</p>
        <button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <h2>Scan QR Code</h2>
        <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
        {qrCode && <img src={qrCode} alt="QR Code" style={{ margin: '16px 0' }} />}
        <p style={{ fontSize: '12px', color: '#666' }}>
          Or enter this code manually: <code>{secret}</code>
        </p>
        
        <div style={{ marginTop: '24px' }}>
          <label>Enter verification code from your app:</label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="000000"
            maxLength={6}
            style={{ display: 'block', margin: '8px 0', padding: '8px', fontSize: '18px' }}
          />
          <button onClick={handleVerify} disabled={loading || verificationCode.length !== 6}>
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  if (step === 'backup') {
    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <h2>Save Backup Codes</h2>
        <p style={{ color: '#ef4444', fontWeight: 'bold' }}>
          ⚠️ Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
        </p>
        <div style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '16px', 
          borderRadius: '8px',
          margin: '16px 0',
          fontFamily: 'monospace'
        }}>
          {backupCodes.map((code, idx) => (
            <div key={idx} style={{ margin: '4px 0' }}>{code}</div>
          ))}
        </div>
        <button onClick={() => {
          navigator.clipboard.writeText(backupCodes.join('\n'));
          alert('Backup codes copied to clipboard!');
        }}>
          Copy to Clipboard
        </button>
        <button onClick={handleComplete} style={{ marginLeft: '8px' }}>
          I've Saved My Codes
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h2>✓ Two-Factor Authentication Enabled!</h2>
      <p>Your account is now protected with 2FA.</p>
    </div>
  );
};
```

**2.4 Create 2FA Verification Component** (1.5 hours)
**File:** `components/TwoFactorVerify.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import { twoFactorService } from '../api/twoFactorService';

interface TwoFactorVerifyProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
  userId,
  onSuccess,
  onCancel
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackupCode, setShowBackupCode] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      setError('Please enter a valid code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isValid = await twoFactorService.verifyCode(userId, code);
      
      if (isValid) {
        onSuccess();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div style={{ 
      padding: '32px', 
      maxWidth: '400px', 
      margin: '0 auto',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h2>Two-Factor Authentication</h2>
      <p>Enter the 6-digit code from your authenticator app</p>
      
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, showBackupCode ? 8 : 6))}
        onKeyPress={handleKeyPress}
        placeholder={showBackupCode ? "Backup code" : "000000"}
        maxLength={showBackupCode ? 8 : 6}
        autoFocus
        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          fontSize: '24px',
          textAlign: 'center',
          letterSpacing: '4px',
          border: '2px solid #e5e7eb',
          borderRadius: '4px',
          margin: '16px 0'
        }}
      />

      {error && (
        <p style={{ color: '#ef4444', fontSize: '14px', margin: '8px 0' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleVerify}
        disabled={loading || code.length < 6}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading || code.length < 6 ? 0.5 : 1
        }}
      >
        {loading ? 'Verifying...' : 'Verify'}
      </button>

      <button
        onClick={() => setShowBackupCode(!showBackupCode)}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '8px',
          backgroundColor: 'transparent',
          color: '#6b7280',
          border: '1px solid #e5e7eb',
          borderRadius: '4px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        {showBackupCode ? 'Use authenticator code' : 'Use backup code'}
      </button>

      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '8px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
};
```

**2.5 Testing** (1 hour)

**Verification:**
- ✅ QR code generates correctly
- ✅ Google Authenticator can scan code
- ✅ TOTP verification works
- ✅ Backup codes work
- ✅ Used backup codes are removed

---

#### **DAY 3: Input Validation & Sanitization**
**Duration:** 8 hours  
**Priority:** 🔴 CRITICAL

*(Continue in next message due to length)*

---

## 📊 PROGRESS TRACKING

**Daily Checklist:**
- [ ] Day 1: Rate Limiting ✅
- [ ] Day 2: 2FA Implementation
- [ ] Day 3: Input Validation
- [ ] Day 4: RBAC & Security Headers
- [ ] Day 5: Security Testing
- [ ] Day 6: DR - Backup System
- [ ] Day 7: DR - Recovery Procedures
- [ ] Day 8: DR - Testing & Failover
- [ ] Day 9: Performance - Lazy Loading
- [ ] Day 10: Performance - Memoization
- [ ] Day 11: Performance - Caching
- [ ] Day 12: Performance Testing
- [ ] Day 13-14: Integration Testing
- [ ] Day 15: Documentation
- [ ] Day 16: Final Verification & Report

---

**Next:** Detailed implementation for Days 3-16 to follow...
