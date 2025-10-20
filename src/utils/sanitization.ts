/**
 * 🔒 SANITIZATION UTILITIES - ENHANCED WITH DOMPURIFY
 * Prevents XSS attacks and injection vulnerabilities
 * 
 * Features:
 * - DOMPurify integration for HTML sanitization
 * - Protection against formula injection in CSV
 * - URL protocol validation
 * - File name sanitization
 * - Rich text editor content cleaning
 * - User-generated content security
 * 
 * @module utils/sanitization
 */

import DOMPurify from 'dompurify';

// ============================================================================
// DOMPURIFY CONFIGURATION
// ============================================================================

/**
 * Default DOMPurify configuration for rich text
 * Applied per-use rather than globally
 */
const defaultDOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'span', 'div'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'alt', 'src', 'width', 'height',
    'class', 'id', 'style', 'target', 'rel'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  FORCE_BODY: false,
};

// ============================================================================
// HTML & RICH TEXT SANITIZATION
// ============================================================================

/**
 * Sanitize HTML content using DOMPurify (most secure)
 * Removes all malicious code while preserving safe HTML structure
 * 
 * @param html - HTML string to sanitize
 * @param options - Optional DOMPurify configuration
 * @returns Sanitized HTML string
 * 
 * @example
 * ```typescript
 * const userHTML = '<p>Hello <script>alert("XSS")</script></p>';
 * const safe = sanitizeHTMLContent(userHTML);
 * // Result: '<p>Hello </p>'
 * ```
 */
export function sanitizeHTMLContent(
  html: string,
  options?: any
): string {
  if (!html) return '';
  
  const sanitized = DOMPurify.sanitize(html, options || defaultDOMPurifyConfig);
  return String(sanitized);
}

/**
 * Sanitize rich text editor content
 * Allows common formatting tags but removes dangerous content
 * 
 * @param richText - Rich text HTML from editor
 * @returns Sanitized rich text
 */
export function sanitizeRichText(richText: string): string {
  if (!richText) return '';
  
  const sanitized = DOMPurify.sanitize(richText, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  });
  return String(sanitized);
}

/**
 * Strip all HTML tags and return plain text
 * 
 * @param html - HTML string
 * @returns Plain text without any HTML
 */
export function stripHTMLTags(html: string): string {
  if (!html) return '';
  
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true
  });
  return String(sanitized);
}

/**
 * Sanitize HTML for display in attributes (title, alt, etc.)
 * 
 * @param text - Text for HTML attribute
 * @returns Sanitized attribute value
 */
export function sanitizeHTMLAttribute(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/[<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return entities[char] || char;
    });
}

// ============================================================================
// USER INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize general user input (text fields, textarea)
 * Escapes HTML special characters to prevent XSS
 * 
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user-generated content (comments, descriptions)
 * Allows line breaks but removes dangerous content
 * 
 * @param content - User-generated content
 * @returns Sanitized content
 */
export function sanitizeUserContent(content: string): string {
  if (!content) return '';
  
  // Convert newlines to <br> tags
  const withBreaks = content.replace(/\n/g, '<br>');
  
  // Sanitize with DOMPurify
  return sanitizeHTMLContent(withBreaks, {
    ALLOWED_TAGS: ['br', 'p'],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitize project/task names and titles
 * Removes special characters that could cause issues
 * 
 * @param name - Project or task name
 * @returns Sanitized name
 */
export function sanitizeName(name: string): string {
  if (!name) return '';
  
  return name
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s\-_.']/g, '') // Keep only alphanumeric, spaces, and safe characters
    .substring(0, 200); // Limit length
}

/**
 * Sanitize document names and descriptions
 * 
 * @param text - Document text
 * @returns Sanitized text
 */
export function sanitizeDocumentText(text: string): string {
  if (!text) return '';
  
  return stripHTMLTags(text).trim();
}

// ============================================================================
// FILE & PATH SANITIZATION
// ============================================================================

/**
 * Sanitize filename to prevent directory traversal and malicious characters
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFileName(filename: string): string {
    if (!filename) return '';
    
    return filename
        .trim()
        // Remove directory traversal attempts
        .replace(/\.\./g, '')
        .replace(/\\/g, '')
        .replace(/\//g, '')
        // Remove special characters except dots, dashes, underscores
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        // Limit length
        .substring(0, 255);
}

/**
 * Sanitize file path to prevent traversal attacks
 * 
 * @param path - File path
 * @returns Sanitized path
 */
export function sanitizeFilePath(path: string): string {
  if (!path) return '';
  
  return path
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/\/\//g, '/') // Remove double slashes
    .replace(/\\/g, '/') // Normalize slashes
    .trim();
}

// ============================================================================
// URL & PROTOCOL SANITIZATION
// ============================================================================

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * 
 * @param url - URL string
 * @returns Sanitized URL or empty string if dangerous
 */
export function sanitizeURL(url: string): string {
    if (!url) return '';
    
    const trimmedURL = url.trim();
    
    // Block dangerous protocols
    const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
    if (dangerousProtocols.test(trimmedURL)) {
        console.warn('⚠️ Blocked dangerous URL protocol:', trimmedURL);
        return '';
    }
    
    // Ensure HTTPS for external links
    if (!trimmedURL.match(/^https?:\/\//i)) {
        return `https://${trimmedURL}`;
    }
    
    return trimmedURL;
}

/**
 * Sanitize mailto link
 * 
 * @param email - Email address
 * @returns Sanitized mailto URL
 */
export function sanitizeMailtoURL(email: string): string {
  if (!email) return '';
  
  const sanitized = email.trim().toLowerCase();
  return `mailto:${sanitized}`;
}

// ============================================================================
// DATA FORMAT SANITIZATION
// ============================================================================

/**
 * Sanitize CSV cell to prevent formula injection
 * Prevents exploitation of =, +, -, @, tab, carriage return
 * 
 * @param value - Cell value
 * @returns Sanitized CSV cell value
 */
export function sanitizeCSVCell(value: any): string {
    if (value === null || value === undefined) return '';
    
    const strValue = String(value);
    
    // Prevent formula injection
    if (strValue.match(/^[=+\-@\t\r]/)) {
        return `'${strValue}`;
    }
    
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (strValue.match(/[",\n\r]/)) {
        return `"${strValue.replace(/"/g, '""')}"`;
    }
    
    return `"${strValue}"`;
}

/**
 * Sanitize JSON input to prevent injection
 * 
 * @param jsonString - JSON string
 * @returns Parsed and sanitized object or null
 */
export function sanitizeJSON(jsonString: string): any {
  if (!jsonString) return null;
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.error('Invalid JSON:', error);
    return null;
  }
}

// ============================================================================
// API RESPONSE SANITIZATION
// ============================================================================

/**
 * Sanitize API response data
 * Recursively sanitizes all string values in an object
 * 
 * @param data - API response data
 * @returns Sanitized data
 */
export function sanitizeAPIResponse(data: any): any {
  if (data === null || data === undefined) return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeAPIResponse(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeAPIResponse(data[key]);
      }
    }
    return sanitized;
  }
  
  // Handle strings - sanitize HTML
  if (typeof data === 'string') {
    return sanitizeHTMLContent(data);
  }
  
  // Return other types as-is
  return data;
}

/**
 * Sanitize object for safe display
 * Removes sensitive fields and sanitizes content
 * 
 * @param obj - Object to sanitize
 * @param sensitiveFields - Fields to remove
 * @returns Sanitized object
 */
export function sanitizeObjectForDisplay(
  obj: any,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey']
): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    // Skip sensitive fields
    if (sensitiveFields.includes(key)) {
      continue;
    }
    
    const value = obj[key];
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObjectForDisplay(value, sensitiveFields);
    }
    // Sanitize strings
    else if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    }
    // Keep other types as-is
    else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate email format
 * 
 * @param email - Email address
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Validate strong password
 * Requirements:
 * - At least 12 characters (updated from 8)
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 * 
 * @param password - Password string
 * @returns Validation result
 */
export function isStrongPassword(password: string): { valid: boolean; message: string } {
    if (!password || password.length < 12) {
        return { valid: false, message: 'Password harus minimal 12 karakter' };
    }
    
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password harus mengandung huruf besar' };
    }
    
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password harus mengandung huruf kecil' };
    }
    
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password harus mengandung angka' };
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { valid: false, message: 'Password harus mengandung karakter khusus' };
    }
    
    return { valid: true, message: 'Password kuat' };
}

// ============================================================================
// NUMBER & DATE SANITIZATION
// ============================================================================

/**
 * Sanitize phone number (Indonesia format)
 * 
 * @param phone - Phone number
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Handle Indonesian format
    if (digitsOnly.startsWith('62')) {
        return '+' + digitsOnly;
    } else if (digitsOnly.startsWith('0')) {
        return '+62' + digitsOnly.substring(1);
    }
    
    return '+62' + digitsOnly;
}

/**
 * Sanitize numeric input
 * 
 * @param value - Numeric value
 * @returns Parsed number or null
 */
export function sanitizeNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
}

/**
 * Sanitize and validate date
 * 
 * @param dateStr - Date string
 * @returns Valid Date object or null
 */
export function sanitizeDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

// ============================================================================
// COMPREHENSIVE SANITIZATION UTILITY
// ============================================================================

/**
 * Comprehensive sanitization for user data
 * Applies appropriate sanitization based on data type
 * 
 * @param data - Data to sanitize
 * @param type - Type of data (html, text, url, filename, etc.)
 * @returns Sanitized data
 */
export function sanitize(data: string, type: 'html' | 'richtext' | 'text' | 'url' | 'filename' | 'name' | 'csv' = 'text'): string {
  switch (type) {
    case 'html':
      return sanitizeHTMLContent(data);
    case 'richtext':
      return sanitizeRichText(data);
    case 'url':
      return sanitizeURL(data);
    case 'filename':
      return sanitizeFileName(data);
    case 'name':
      return sanitizeName(data);
    case 'csv':
      return sanitizeCSVCell(data);
    case 'text':
    default:
      return sanitizeInput(data);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // HTML sanitization
  sanitizeHTMLContent,
  sanitizeRichText,
  stripHTMLTags,
  sanitizeHTMLAttribute,
  
  // User input
  sanitizeInput,
  sanitizeUserContent,
  sanitizeName,
  sanitizeDocumentText,
  
  // Files
  sanitizeFileName,
  sanitizeFilePath,
  
  // URLs
  sanitizeURL,
  sanitizeMailtoURL,
  
  // Data formats
  sanitizeCSVCell,
  sanitizeJSON,
  
  // API
  sanitizeAPIResponse,
  sanitizeObjectForDisplay,
  
  // Validation
  isValidEmail,
  isStrongPassword,
  
  // Numbers & Dates
  sanitizePhoneNumber,
  sanitizeNumber,
  sanitizeDate,
  
  // Comprehensive
  sanitize
};
