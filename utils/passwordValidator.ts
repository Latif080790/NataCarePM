/**
 * Password Validator
 * 
 * Validates password strength and provides feedback.
 * Enforces enterprise-grade password policies.
 */

export interface PasswordStrength {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  feedback: string[];
  isValid: boolean;
}

// Common passwords to block
const COMMON_PASSWORDS = [
  'password', '12345678', 'qwerty', 'abc123', 'monkey', 'letmein',
  '111111', 'password123', 'admin', 'welcome', 'login', 'passw0rd',
  'password1', '123456789', '12345', '1234567', 'sunshine', 'master',
  'iloveyou', 'ashley', 'bailey', 'shadow', 'superman', 'qwerty123',
  'azerty', 'trustno1', 'dragon', 'starwars'
];

/**
 * Validate password strength and requirements
 * 
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - No common passwords
 * - No repeating characters (3+)
 * 
 * @param password - Password to validate
 * @returns Password strength assessment
 */
export const validatePassword = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Requirement 1: Minimum length (12 characters)
  if (password.length < 12) {
    feedback.push('Password must be at least 12 characters long');
    return {
      score: 0,
      level: 'weak',
      feedback,
      isValid: false
    };
  }
  score += 20;

  // Bonus for length
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Requirement 2: Uppercase letters
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters (A-Z)');
  } else {
    score += 20;
  }

  // Requirement 3: Lowercase letters
  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters (a-z)');
  } else {
    score += 20;
  }

  // Requirement 4: Numbers
  if (!/[0-9]/.test(password)) {
    feedback.push('Add numbers (0-9)');
  } else {
    score += 20;
  }

  // Requirement 5: Special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    feedback.push('Add special characters (!@#$%^&*)');
  } else {
    score += 20;
  }

  // Check for common passwords
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
    feedback.push('Avoid common words and patterns');
    score = Math.min(score, 30);
  }

  // Check for repeating characters (3 or more)
  if (/(.)\1{2,}/.test(password)) {
    feedback.push('Avoid repeating characters (e.g., aaa, 111)');
    score -= 10;
  }

  // Check for sequential characters
  if (/abc|bcd|cde|def|123|234|345|456|567|678|789/i.test(password)) {
    feedback.push('Avoid sequential characters (e.g., abc, 123)');
    score -= 10;
  }

  // Check for keyboard patterns
  if (/qwerty|asdfgh|zxcvbn/i.test(password)) {
    feedback.push('Avoid keyboard patterns (e.g., qwerty)');
    score -= 10;
  }

  // Ensure score doesn't go below 0 or above 100
  score = Math.max(0, Math.min(100, score));

  // Determine password strength level
  let level: PasswordStrength['level'];
  if (score < 40) {
    level = 'weak';
  } else if (score < 60) {
    level = 'fair';
  } else if (score < 80) {
    level = 'good';
  } else if (score < 100) {
    level = 'strong';
  } else {
    level = 'excellent';
  }

  // Password is valid if score >= 80 AND no critical feedback
  const isValid = score >= 80 && feedback.length === 0;

  // Add positive feedback if valid
  if (isValid) {
    feedback.push('✓ Strong password!');
  }

  return {
    score,
    level,
    feedback,
    isValid
  };
};

/**
 * Get password strength color for UI
 */
export const getPasswordStrengthColor = (level: PasswordStrength['level']): string => {
  switch (level) {
    case 'weak':
      return '#ef4444'; // red
    case 'fair':
      return '#f59e0b'; // orange
    case 'good':
      return '#eab308'; // yellow
    case 'strong':
      return '#22c55e'; // green
    case 'excellent':
      return '#16a34a'; // dark green
  }
};

/**
 * Generate a strong random password
 * 
 * @param length - Password length (default: 16)
 * @returns Generated password
 */
export const generateStrongPassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // removed I, O
  const lowercase = 'abcdefghijkmnpqrstuvwxyz'; // removed l, o
  const numbers = '23456789'; // removed 0, 1
  const special = '!@#$%^&*()_+-=[]{}';

  const allChars = uppercase + lowercase + numbers + special;
  let password = '';

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Estimate time to crack password (for display purposes)
 */
export const estimateCrackTime = (password: string): string => {
  const { score } = validatePassword(password);

  if (score < 40) {
    return 'Less than 1 minute';
  } else if (score < 60) {
    return 'A few hours';
  } else if (score < 80) {
    return 'Several days';
  } else if (score < 100) {
    return 'Several months';
  } else {
    return 'Centuries';
  }
};
