/**
 * Content Security Policy (CSP) Monitoring
 * Reports CSP violations to help identify and fix security issues
 */

import { logger } from './logger.enhanced';

/**
 * CSP Violation Report Structure
 */
interface CSPViolationReport {
  'document-uri': string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  'blocked-uri': string;
  'source-file'?: string;
  'line-number'?: number;
  'column-number'?: number;
  'status-code'?: number;
}

/**
 * Initialize CSP violation reporting
 * 
 * Browser will send violation reports to this handler when CSP is violated
 * Helps identify:
 * - Blocked inline scripts
 * - Blocked external resources
 * - Blocked unsafe-eval usage
 * - Other CSP violations
 */
export function initCSPMonitoring() {
  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation: CSPViolationReport = {
      'document-uri': event.documentURI,
      'violated-directive': event.violatedDirective,
      'effective-directive': event.effectiveDirective,
      'original-policy': event.originalPolicy,
      'blocked-uri': event.blockedURI,
      'source-file': event.sourceFile || undefined,
      'line-number': event.lineNumber || undefined,
      'column-number': event.columnNumber || undefined,
      'status-code': event.statusCode || undefined,
    };

    // Log violation
    logger.warn('[CSP] Security Policy Violation', {
      directive: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
    });

    // In production, send to monitoring service
    if (import.meta.env.PROD) {
      reportCSPViolation(violation);
    }

    // In development, log full details
    if (import.meta.env.DEV) {
      console.warn('[CSP] Violation Details:', violation);
      console.warn('[CSP] Event:', event);
    }
  });

  logger.info('[CSP] Monitoring initialized');
}

/**
 * Report CSP violation to monitoring service
 * 
 * In production, send violations to:
 * 1. Sentry (error tracking)
 * 2. Firebase Analytics (metrics)
 * 3. Custom logging endpoint
 */
async function reportCSPViolation(violation: CSPViolationReport) {
  try {
    // Report to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureMessage('CSP Violation', {
        level: 'warning',
        tags: {
          directive: violation['violated-directive'],
          blockedUri: violation['blocked-uri'],
        },
        extra: violation,
      });
    }

    // Report to Firebase Analytics if available
    if (window.firebase?.analytics) {
      window.firebase.analytics().logEvent('csp_violation', {
        violated_directive: violation['violated-directive'],
        blocked_uri: violation['blocked-uri'],
        source_file: violation['source-file'],
      });
    }

    // Optional: Send to custom logging endpoint
    // await fetch('/api/csp-report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(violation),
    // });
  } catch (error) {
    console.error('[CSP] Failed to report violation:', error);
  }
}

/**
 * Check if CSP is enabled and active
 */
export function isCSPEnabled(): boolean {
  // Check if CSP meta tag exists
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  return !!cspMeta;
}

/**
 * Get current CSP policy
 */
export function getCurrentCSP(): string | null {
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]') as HTMLMetaElement;
  return cspMeta?.content || null;
}

/**
 * Parse CSP directives into object
 */
export function parseCSP(policy: string): Record<string, string[]> {
  const directives: Record<string, string[]> = {};
  
  policy.split(';').forEach((directive) => {
    const [name, ...values] = directive.trim().split(/\s+/);
    if (name) {
      directives[name] = values;
    }
  });
  
  return directives;
}

/**
 * Validate that critical CSP directives are present
 */
export function validateCSP(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const policy = getCurrentCSP();
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!policy) {
    return {
      valid: false,
      missing: ['Content-Security-Policy header/meta tag'],
      warnings: [],
    };
  }

  const directives = parseCSP(policy);

  // Check required directives
  const required = ['default-src', 'script-src', 'style-src', 'img-src'];
  required.forEach((directive) => {
    if (!directives[directive]) {
      missing.push(directive);
    }
  });

  // Check for unsafe directives
  if (directives['script-src']?.includes("'unsafe-eval'")) {
    warnings.push("script-src allows 'unsafe-eval' - consider removing");
  }
  if (directives['script-src']?.includes("'unsafe-inline'")) {
    warnings.push("script-src allows 'unsafe-inline' - consider using nonces");
  }
  if (directives['style-src']?.includes("'unsafe-inline'")) {
    warnings.push("style-src allows 'unsafe-inline' - acceptable for styles but verify necessity");
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Generate CSP nonce for inline scripts
 * Server-side implementation for production
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Add nonce to inline script/style
 * Usage: <script nonce={getNonce()}>...</script>
 */
export function getNonce(): string | undefined {
  // In production, this should come from server
  // For now, return undefined (CSP will allow if configured)
  return undefined;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, context?: any) => void;
    };
    firebase?: {
      analytics: () => {
        logEvent: (eventName: string, params?: any) => void;
      };
    };
  }
}
