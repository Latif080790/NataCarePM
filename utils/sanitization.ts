/**
 * 🔒 SANITIZATION UTILITIES
 * Prevents XSS attacks and injection vulnerabilities
 */

/**
 * Sanitize user input by escaping HTML special characters
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
 * Sanitize HTML content (more aggressive cleaning)
 */
export function sanitizeHTML(html: string): string {
    if (!html) return '';
    
    // Remove all HTML tags
    const withoutTags = html.replace(/<[^>]*>/g, '');
    
    // Then apply basic sanitization
    return sanitizeInput(withoutTags);
}

/**
 * Sanitize filename to prevent directory traversal and malicious characters
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
 * Sanitize CSV cell to prevent formula injection
 * Prevents exploitation of =, +, -, @, tab, carriage return
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
 * Sanitize URL to prevent javascript: and data: protocols
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
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Validate strong password
 * Requirements:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 */
export function isStrongPassword(password: string): { valid: boolean; message: string } {
    if (!password || password.length < 8) {
        return { valid: false, message: 'Password harus minimal 8 karakter' };
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

/**
 * Sanitize phone number (Indonesia format)
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
 */
export function sanitizeNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
}

/**
 * Sanitize and validate date
 */
export function sanitizeDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}
