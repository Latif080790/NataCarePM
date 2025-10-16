/**
 * Password Validator Utility
 * Comprehensive password validation with strength scoring and user-friendly feedback
 * Inspired by zxcvbn-like heuristics for security and UX
 */

import { PASSWORD_REQUIREMENTS } from '../types/userProfile';

// ========================================
// TYPES
// ========================================

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

export interface PasswordValidationResult {
  valid: boolean;
  strength: PasswordStrength;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  suggestions: string[];
  estimatedCrackTime: string; // Human-readable
}

export interface PasswordStrengthCheck {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasNoCommonPatterns: boolean;
  hasNoRepeatingChars: boolean;
  hasNoSequentialChars: boolean;
}

// ========================================
// CONSTANTS
// ========================================

// Common weak passwords (small subset for demo)
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'bailey', 'passw0rd', 'shadow', '123123', '654321', 'superman',
  'qazwsx', 'michael', 'football', 'password1', 'password123', 'admin', 'welcome',
  'login', 'root', 'toor', 'test', 'guest', 'user', 'demo', 'default'
]);

// Common patterns to avoid
const SEQUENTIAL_PATTERNS = [
  'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl',
  '123', '234', '345', '456', '567', '678', '789', '890',
  'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop',
  'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl',
  'zxc', 'xcv', 'cvb', 'vbn', 'bnm'
];

// ========================================
// VALIDATION FUNCTIONS
// ========================================

/**
 * Main password validation function
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Basic validation
  if (!password) {
    return {
      valid: false,
      strength: 'weak',
      score: 0,
      errors: ['Password tidak boleh kosong'],
      warnings: [],
      suggestions: ['Masukkan password dengan minimal 8 karakter'],
      estimatedCrackTime: 'Instant',
    };
  }

  // Run checks
  const checks = runPasswordChecks(password);
  
  // Length check
  if (!checks.hasMinLength) {
    errors.push(`Password harus minimal ${PASSWORD_REQUIREMENTS.minLength} karakter`);
  }

  // Character type checks
  if (!checks.hasUppercase) {
    warnings.push('Tidak ada huruf kapital (A-Z)');
    suggestions.push('Tambahkan huruf kapital untuk meningkatkan keamanan');
  }

  if (!checks.hasLowercase) {
    warnings.push('Tidak ada huruf kecil (a-z)');
    suggestions.push('Tambahkan huruf kecil untuk meningkatkan keamanan');
  }

  if (!checks.hasNumber) {
    warnings.push('Tidak ada angka (0-9)');
    suggestions.push('Tambahkan angka untuk meningkatkan keamanan');
  }

  if (!checks.hasSpecialChar) {
    warnings.push('Tidak ada karakter khusus (!@#$%^&*)');
    suggestions.push('Tambahkan karakter khusus untuk keamanan maksimal');
  }

  // Pattern checks
  if (!checks.hasNoCommonPatterns) {
    errors.push('Password terlalu umum dan mudah ditebak');
    suggestions.push('Gunakan kombinasi karakter yang lebih unik');
  }

  if (!checks.hasNoRepeatingChars) {
    warnings.push('Terdapat karakter yang berulang');
    suggestions.push('Hindari pengulangan karakter (contoh: aaa, 111)');
  }

  if (!checks.hasNoSequentialChars) {
    warnings.push('Terdapat urutan karakter (contoh: abc, 123)');
    suggestions.push('Hindari urutan karakter yang mudah ditebak');
  }

  // Calculate strength score
  const score = calculatePasswordScore(password, checks);
  const strength = getPasswordStrength(score);
  const estimatedCrackTime = estimateCrackTime(score);

  // Final validation (require at least 'good' strength = 40 score)
  const valid = errors.length === 0 && score >= 40;

  if (!valid && errors.length === 0) {
    errors.push('Password terlalu lemah. Tingkatkan kompleksitas password Anda.');
  }

  return {
    valid,
    strength,
    score,
    errors,
    warnings,
    suggestions,
    estimatedCrackTime,
  };
};

/**
 * Run all password checks
 */
export const runPasswordChecks = (password: string): PasswordStrengthCheck => {
  return {
    hasMinLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    hasNoCommonPatterns: !isCommonPassword(password),
    hasNoRepeatingChars: !hasRepeatingCharacters(password),
    hasNoSequentialChars: !hasSequentialCharacters(password),
  };
};

/**
 * Calculate password strength score (0-100)
 */
export const calculatePasswordScore = (
  password: string,
  checks?: PasswordStrengthCheck
): number => {
  const passwordChecks = checks || runPasswordChecks(password);
  let score = 0;

  // Length scoring (max 30 points)
  const lengthScore = Math.min((password.length / 20) * 30, 30);
  score += lengthScore;

  // Character diversity (max 40 points - 10 per type)
  if (passwordChecks.hasUppercase) score += 10;
  if (passwordChecks.hasLowercase) score += 10;
  if (passwordChecks.hasNumber) score += 10;
  if (passwordChecks.hasSpecialChar) score += 10;

  // Pattern checks (max 30 points - 10 per check)
  if (passwordChecks.hasNoCommonPatterns) score += 10;
  if (passwordChecks.hasNoRepeatingChars) score += 10;
  if (passwordChecks.hasNoSequentialChars) score += 10;

  // Bonus for longer passwords (diminishing returns)
  if (password.length >= 12) score += 5;
  if (password.length >= 16) score += 5;

  return Math.min(Math.round(score), 100);
};

/**
 * Get password strength label from score
 */
export const getPasswordStrength = (score: number): PasswordStrength => {
  if (score >= 80) return 'very-strong';
  if (score >= 60) return 'strong';
  if (score >= 40) return 'good';
  if (score >= 20) return 'fair';
  return 'weak';
};

/**
 * Get strength color for UI
 */
export const getStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'very-strong': return '#10b981'; // green-500
    case 'strong': return '#22c55e'; // green-400
    case 'good': return '#eab308'; // yellow-500
    case 'fair': return '#f59e0b'; // amber-500
    case 'weak': return '#ef4444'; // red-500
    default: return '#6b7280'; // gray-500
  }
};

/**
 * Get strength label in Indonesian
 */
export const getStrengthLabel = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'very-strong': return 'Sangat Kuat';
    case 'strong': return 'Kuat';
    case 'good': return 'Baik';
    case 'fair': return 'Cukup';
    case 'weak': return 'Lemah';
    default: return 'Tidak Diketahui';
  }
};

/**
 * Estimate crack time based on score
 */
export const estimateCrackTime = (score: number): string => {
  if (score >= 80) return 'Berabad-abad';
  if (score >= 60) return 'Puluhan tahun';
  if (score >= 40) return 'Beberapa tahun';
  if (score >= 20) return 'Beberapa bulan';
  if (score >= 10) return 'Beberapa hari';
  return 'Beberapa jam';
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Check if password is in common password list
 */
const isCommonPassword = (password: string): boolean => {
  const normalized = password.toLowerCase();
  
  // Check exact match
  if (COMMON_PASSWORDS.has(normalized)) {
    return true;
  }

  // Check with common substitutions (l33t speak)
  const leet = normalized
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a');

  return COMMON_PASSWORDS.has(leet);
};

/**
 * Check for repeating characters (aaa, 111, etc.)
 */
const hasRepeatingCharacters = (password: string): boolean => {
  // Check for 3+ consecutive identical characters
  return /(.)\1{2,}/.test(password);
};

/**
 * Check for sequential characters
 */
const hasSequentialCharacters = (password: string): boolean => {
  const normalized = password.toLowerCase();
  
  // Check for sequential patterns
  for (const pattern of SEQUENTIAL_PATTERNS) {
    if (normalized.includes(pattern) || normalized.includes(reverseString(pattern))) {
      return true;
    }
  }

  return false;
};

/**
 * Reverse a string
 */
const reverseString = (str: string): string => {
  return str.split('').reverse().join('');
};

// ========================================
// PASSWORD COMPARISON
// ========================================

/**
 * Check if new password is different from old password
 */
export const isPasswordDifferent = (
  newPassword: string,
  oldPassword: string
): boolean => {
  return newPassword !== oldPassword;
};

/**
 * Check password similarity (simple Levenshtein-like check)
 */
export const getPasswordSimilarity = (
  password1: string,
  password2: string
): number => {
  // Simple character overlap check (0-100%)
  const p1 = password1.toLowerCase();
  const p2 = password2.toLowerCase();
  
  let matches = 0;
  const minLength = Math.min(p1.length, p2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (p1[i] === p2[i]) matches++;
  }
  
  return (matches / Math.max(p1.length, p2.length)) * 100;
};

/**
 * Check if password is too similar to old password
 */
export const isTooSimilar = (
  newPassword: string,
  oldPassword: string,
  threshold: number = 70 // 70% similarity threshold
): boolean => {
  const similarity = getPasswordSimilarity(newPassword, oldPassword);
  return similarity >= threshold;
};

// ========================================
// PASSWORD HISTORY CHECK
// ========================================

/**
 * Check if password has been used recently
 */
export const isPasswordInHistory = (
  newPassword: string,
  passwordHistory: string[] // Should be hashed passwords in real app
): boolean => {
  // In a real implementation, you would hash newPassword and compare with hashed history
  // For now, we'll do a simple check (NOT SECURE for production without hashing)
  return passwordHistory.includes(newPassword);
};

// ========================================
// UTILITY EXPORTS
// ========================================

/**
 * Quick password strength check (no detailed errors)
 */
export const quickStrengthCheck = (password: string): {
  strength: PasswordStrength;
  score: number;
  color: string;
  label: string;
} => {
  const score = calculatePasswordScore(password);
  const strength = getPasswordStrength(score);
  
  return {
    strength,
    score,
    color: getStrengthColor(strength),
    label: getStrengthLabel(strength),
  };
};

/**
 * Get password requirements as array of strings (for UI display)
 */
export const getPasswordRequirements = (): string[] => {
  return [
    `Minimal ${PASSWORD_REQUIREMENTS.minLength} karakter`,
    'Minimal 1 huruf kapital (A-Z)',
    'Minimal 1 huruf kecil (a-z)',
    'Minimal 1 angka (0-9)',
    'Minimal 1 karakter khusus (!@#$%^&*)',
    'Tidak boleh password umum atau mudah ditebak',
    'Hindari urutan karakter (abc, 123) atau pengulangan (aaa, 111)',
  ];
};
