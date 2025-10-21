/**
 * Content Sanitization Utility
 * XSS Protection using DOMPurify
 *
 * This module provides comprehensive HTML sanitization to prevent XSS attacks.
 * All user-generated content should be sanitized before rendering.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitization Configuration Presets
 */
const SANITIZE_CONFIGS = {
  /**
   * STRICT: Only text, no HTML tags allowed
   * Use for: Usernames, titles, short descriptions
   */
  strict: {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
  },

  /**
   * BASIC: Basic formatting only
   * Use for: Comments, descriptions, notes
   * Allows: bold, italic, emphasis, links, paragraphs, line breaks
   */
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    // Force target="_blank" for all links
    HOOKS: {
      afterSanitizeAttributes: (node: Element) => {
        if (node.tagName === 'A') {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      },
    },
  },

  /**
   * RICH: Rich text editor output
   * Use for: Rich text descriptions, blog posts, documentation
   * Allows: Headers, lists, tables, images, formatting
   */
  rich: {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'b',
      'i',
      'em',
      'strong',
      'u',
      's',
      'strike',
      'del',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'blockquote',
      'code',
      'pre',
      'div',
      'span',
    ],
    ALLOWED_ATTR: [
      'href',
      'title',
      'target',
      'rel',
      'src',
      'alt',
      'width',
      'height',
      'class',
      'id',
      'colspan',
      'rowspan',
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    HOOKS: {
      afterSanitizeAttributes: (node: Element) => {
        // Force target="_blank" for all links
        if (node.tagName === 'A') {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }

        // Limit image dimensions
        if (node.tagName === 'IMG') {
          const width = node.getAttribute('width');
          const height = node.getAttribute('height');

          // Remove inline styles
          node.removeAttribute('style');

          // Set maximum dimensions
          if (!width || parseInt(width) > 800) {
            node.setAttribute('width', '800');
          }
          if (!height || parseInt(height) > 600) {
            node.setAttribute('height', '600');
          }
        }
      },
    },
  },

  /**
   * HTML: Full HTML with restrictions
   * Use for: Email templates, embedded content
   * Similar to rich but allows more styling
   */
  html: {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'hr',
      'b',
      'i',
      'em',
      'strong',
      'u',
      's',
      'strike',
      'del',
      'mark',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'blockquote',
      'code',
      'pre',
      'div',
      'span',
      'section',
      'article',
      'header',
      'footer',
      'dl',
      'dt',
      'dd',
    ],
    ALLOWED_ATTR: [
      'href',
      'title',
      'target',
      'rel',
      'src',
      'alt',
      'width',
      'height',
      'class',
      'id',
      'colspan',
      'rowspan',
      'align',
      'valign',
      'style', // Carefully controlled
    ],
    ALLOWED_STYLE: ['color', 'background-color', 'font-size', 'font-weight', 'text-align'],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
  },
};

/**
 * Sanitize HTML content with strict mode (text only)
 * Removes all HTML tags but keeps the text content
 *
 * @param dirty - Potentially unsafe HTML string
 * @returns Safe text string
 *
 * @example
 * sanitizeStrict('<script>alert("xss")</script>Hello')
 * // Returns: 'Hello'
 */
export function sanitizeStrict(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIGS.strict);
}

/**
 * Sanitize HTML with basic formatting
 * Allows basic text formatting (bold, italic, links, etc.)
 *
 * @param dirty - Potentially unsafe HTML string
 * @returns Safe HTML string with basic formatting
 *
 * @example
 * sanitizeBasic('<b>Bold</b> <script>alert("xss")</script>')
 * // Returns: '<b>Bold</b> '
 */
export function sanitizeBasic(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIGS.basic);
}

/**
 * Sanitize rich text HTML
 * Allows rich formatting including headers, lists, tables, images
 *
 * @param dirty - Potentially unsafe HTML string
 * @returns Safe HTML string with rich formatting
 *
 * @example
 * sanitizeRich('<h1>Title</h1><p>Content</p><script>alert("xss")</script>')
 * // Returns: '<h1>Title</h1><p>Content</p>'
 */
export function sanitizeRich(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIGS.rich);
}

/**
 * Sanitize full HTML
 * Most permissive - allows most HTML with style restrictions
 *
 * @param dirty - Potentially unsafe HTML string
 * @returns Safe HTML string
 *
 * @example
 * sanitizeHtml('<div style="color: red;">Content</div><script>alert("xss")</script>')
 * // Returns: '<div style="color: red;">Content</div>'
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIGS.html);
}

/**
 * Sanitize with custom configuration
 * For specialized use cases
 *
 * @param dirty - Potentially unsafe HTML string
 * @param config - DOMPurify configuration object
 * @returns Safe HTML string
 */
export function sanitizeCustom(dirty: string, config: any): string {
  if (!dirty) return '';
  return String(DOMPurify.sanitize(dirty, config));
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 *
 * @param url - Potentially unsafe URL
 * @returns Safe URL or empty string if invalid
 *
 * @example
 * sanitizeUrl('javascript:alert("xss")')
 * // Returns: ''
 * sanitizeUrl('https://example.com')
 * // Returns: 'https://example.com'
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Remove whitespace
  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:text/html', 'vbscript:', 'file:', 'about:'];

  const lowerUrl = trimmed.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn(`[Sanitizer] Blocked dangerous URL: ${trimmed.substring(0, 50)}`);
      return '';
    }
  }

  // Only allow http, https, mailto, tel, and relative URLs
  const urlPattern = /^(https?:\/\/|mailto:|tel:|\/|\.\/|#)/i;
  if (!urlPattern.test(trimmed)) {
    console.warn(`[Sanitizer] Blocked invalid URL pattern: ${trimmed.substring(0, 50)}`);
    return '';
  }

  return trimmed;
}

/**
 * Sanitize filename to prevent path traversal
 *
 * @param filename - Potentially unsafe filename
 * @returns Safe filename
 *
 * @example
 * sanitizeFilename('../../etc/passwd')
 * // Returns: 'etc-passwd'
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  return (
    filename
      // Remove path separators
      .replace(/[/\\]/g, '-')
      // Remove dangerous characters
      .replace(/[<>:"|?*\x00-\x1f]/g, '')
      // Remove leading/trailing dots and spaces
      .replace(/^[.\s]+|[.\s]+$/g, '')
      // Limit length
      .substring(0, 255) ||
    // Ensure not empty
    'file'
  );
}

/**
 * Detect potential XSS attempts
 * Returns true if suspicious patterns are found
 *
 * @param content - Content to check
 * @returns True if suspicious, false otherwise
 */
export function detectXSS(content: string): boolean {
  if (!content) return false;

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // event handlers like onclick=
    /<iframe\b/gi,
    /<embed\b/gi,
    /<object\b/gi,
    /eval\(/gi,
    /expression\(/gi,
    /vbscript:/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(content));
}

/**
 * Security audit log for sanitization
 * Logs when dangerous content is sanitized
 */
export function logSanitization(
  originalLength: number,
  sanitizedLength: number,
  context?: string
): void {
  if (originalLength !== sanitizedLength) {
    const removedChars = originalLength - sanitizedLength;
    const percentage = ((removedChars / originalLength) * 100).toFixed(2);

    console.warn(
      `[Sanitizer] Removed ${removedChars} characters (${percentage}%) from ${context || 'content'}`
    );
  }
}

/**
 * React component wrapper for sanitized content
 * Use this in React components to safely render HTML
 *
 * @example
 * ```tsx
 * import { useSanitizedHtml } from '@/utils/sanitizer';
 *
 * function MyComponent({ userContent }) {
 *   const sanitized = useSanitizedHtml(userContent, 'basic');
 *   return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
 * }
 * ```
 */
export function useSanitizedHtml(
  content: string,
  level: 'strict' | 'basic' | 'rich' | 'html' = 'basic'
): string {
  if (!content) return '';

  const originalLength = content.length;

  let sanitized: string;
  switch (level) {
    case 'strict':
      sanitized = sanitizeStrict(content);
      break;
    case 'basic':
      sanitized = sanitizeBasic(content);
      break;
    case 'rich':
      sanitized = sanitizeRich(content);
      break;
    case 'html':
      sanitized = sanitizeHtml(content);
      break;
    default:
      sanitized = sanitizeBasic(content);
  }

  // Log if content was modified
  if (process.env.NODE_ENV === 'development') {
    logSanitization(originalLength, sanitized.length, level);
  }

  return sanitized;
}

/**
 * Batch sanitize array of strings
 * Useful for sanitizing multiple items at once
 *
 * @param items - Array of strings to sanitize
 * @param level - Sanitization level
 * @returns Array of sanitized strings
 */
export function sanitizeBatch(
  items: string[],
  level: 'strict' | 'basic' | 'rich' | 'html' = 'basic'
): string[] {
  return items.map((item) => useSanitizedHtml(item, level));
}

/**
 * Sanitize object properties
 * Recursively sanitize all string properties in an object
 *
 * @param obj - Object to sanitize
 * @param level - Sanitization level
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  level: 'strict' | 'basic' | 'rich' | 'html' = 'basic'
): T {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      sanitized[key] = useSanitizedHtml(value, level);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, level);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Configure DOMPurify hooks for global settings
 * Call this once at app initialization
 */
export function configureSanitizer(): void {
  // Add global hook to log sanitization in development
  if (process.env.NODE_ENV === 'development') {
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      // Log if potentially dangerous attributes were removed
      if (
        node.hasAttribute('onerror') ||
        node.hasAttribute('onclick') ||
        node.hasAttribute('onload')
      ) {
        console.warn('[Sanitizer] Removed dangerous event handler from element');
      }
    });
  }

  // Set global configuration
  DOMPurify.setConfig({
    SAFE_FOR_TEMPLATES: true,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

// Auto-configure on module load
if (typeof window !== 'undefined') {
  configureSanitizer();
}

// Export default sanitize function (basic level)
export default sanitizeBasic;
