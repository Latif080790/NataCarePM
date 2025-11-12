/**
 * Security Configuration
 * Centralized security settings for IP restrictions, rate limiting, and access control
 * 
 * Features:
 * - IP Whitelist/Blacklist management
 * - Geo-location based restrictions
 * - Rate limiting configuration
 * - Security logging settings
 */

// ============================================================================
// TYPES
// ============================================================================

export interface IPRestrictionConfig {
  enabled: boolean;
  whitelist: string[];
  blacklist: string[];
  allowedCountries: string[];
  blockedCountries: string[];
  logBlockedAttempts: boolean;
  notifyAdminOnBlock: boolean;
}

export interface RateLimitConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  windowDuration: number; // in minutes
  maxRequestsPerMinute: number;
}

export interface GeoLocationConfig {
  enabled: boolean;
  apiUrl: string;
  timeout: number; // in milliseconds
  cacheExpiry: number; // in minutes
}

export interface SecurityConfig {
  ipRestriction: IPRestrictionConfig;
  rateLimit: RateLimitConfig;
  geoLocation: GeoLocationConfig;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default IP Restriction Configuration
 * 
 * Whitelist: Trusted IPs that always have access
 * Blacklist: Blocked IPs that are denied access
 * 
 * @example
 * whitelist: ['192.168.1.1', '10.0.0.0/8'] // Single IP or CIDR range
 */
const DEFAULT_IP_RESTRICTION: IPRestrictionConfig = {
  enabled: import.meta.env.VITE_IP_RESTRICTION_ENABLED === 'true' || false,
  
  // Whitelist: Always allow these IPs
  whitelist: [
    '127.0.0.1',           // Localhost
    '::1',                 // IPv6 localhost
    'localhost',           // Localhost hostname
    // Add your office/home IPs here in production
    // '203.0.113.0/24',   // Example: Office network CIDR
  ],
  
  // Blacklist: Always block these IPs
  blacklist: [
    // Add known malicious IPs here
    // '198.51.100.1',
  ],
  
  // Allowed countries (ISO 3166-1 alpha-2 codes)
  allowedCountries: [
    'ID',  // Indonesia
    'SG',  // Singapore
    'MY',  // Malaysia
    'TH',  // Thailand
    'PH',  // Philippines
    'VN',  // Vietnam
    'US',  // United States
    'GB',  // United Kingdom
    'AU',  // Australia
    // Add more as needed
  ],
  
  // Blocked countries (takes precedence over allowed)
  blockedCountries: [
    // Add countries to block
    // 'XX', // Example
  ],
  
  // Logging and notifications
  logBlockedAttempts: true,
  notifyAdminOnBlock: true,
};

/**
 * Default Rate Limiting Configuration
 */
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxLoginAttempts: 5,           // Max failed login attempts
  lockoutDuration: 15,            // Lockout for 15 minutes
  windowDuration: 5,              // Within 5 minute window
  maxRequestsPerMinute: 60,       // Max 60 requests per minute
};

/**
 * Default Geo-Location Configuration
 */
const DEFAULT_GEO_LOCATION: GeoLocationConfig = {
  enabled: import.meta.env.VITE_GEO_RESTRICTION_ENABLED === 'true' || false,
  apiUrl: 'http://ip-api.com/json',  // Free API, no auth required
  timeout: 5000,                      // 5 second timeout
  cacheExpiry: 60,                    // Cache for 60 minutes
};

/**
 * Complete Security Configuration
 */
export const SECURITY_CONFIG: SecurityConfig = {
  ipRestriction: DEFAULT_IP_RESTRICTION,
  rateLimit: DEFAULT_RATE_LIMIT,
  geoLocation: DEFAULT_GEO_LOCATION,
};

// ============================================================================
// ENVIRONMENT-SPECIFIC OVERRIDES
// ============================================================================

/**
 * Development Mode Overrides
 * More permissive in development
 */
if (import.meta.env.DEV) {
  console.log('[Security] Running in DEVELOPMENT mode');
  
  // Disable IP restrictions in dev (unless explicitly enabled)
  if (!import.meta.env.VITE_IP_RESTRICTION_ENABLED) {
    SECURITY_CONFIG.ipRestriction.enabled = false;
  }
  
  // Disable geo-restrictions in dev (unless explicitly enabled)
  if (!import.meta.env.VITE_GEO_RESTRICTION_ENABLED) {
    SECURITY_CONFIG.geoLocation.enabled = false;
  }
  
  // More lenient rate limits in dev
  SECURITY_CONFIG.rateLimit.maxLoginAttempts = 10;
  SECURITY_CONFIG.rateLimit.maxRequestsPerMinute = 120;
}

/**
 * Production Mode Overrides
 * Strict security in production
 */
if (import.meta.env.PROD) {
  console.log('[Security] Running in PRODUCTION mode');
  
  // Enable IP restrictions by default in production
  SECURITY_CONFIG.ipRestriction.enabled = true;
  
  // Enable geo-restrictions in production
  SECURITY_CONFIG.geoLocation.enabled = true;
  
  // Strict rate limits
  SECURITY_CONFIG.rateLimit.maxLoginAttempts = 3;
  SECURITY_CONFIG.rateLimit.lockoutDuration = 30;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if an IP is in the whitelist
 */
export function isIPWhitelisted(ip: string): boolean {
  return SECURITY_CONFIG.ipRestriction.whitelist.includes(ip) ||
         SECURITY_CONFIG.ipRestriction.whitelist.some(entry => {
           // Support for CIDR ranges (basic check)
           if (entry.includes('/')) {
             return ip.startsWith(entry.split('/')[0].split('.').slice(0, -1).join('.'));
           }
           return entry === ip;
         });
}

/**
 * Check if an IP is in the blacklist
 */
export function isIPBlacklisted(ip: string): boolean {
  return SECURITY_CONFIG.ipRestriction.blacklist.includes(ip) ||
         SECURITY_CONFIG.ipRestriction.blacklist.some(entry => {
           // Support for CIDR ranges (basic check)
           if (entry.includes('/')) {
             return ip.startsWith(entry.split('/')[0].split('.').slice(0, -1).join('.'));
           }
           return entry === ip;
         });
}

/**
 * Check if a country is allowed
 */
export function isCountryAllowed(countryCode: string): boolean {
  // If no countries specified, allow all
  if (SECURITY_CONFIG.ipRestriction.allowedCountries.length === 0) {
    return true;
  }
  
  // Check if in blocked list first (takes precedence)
  if (SECURITY_CONFIG.ipRestriction.blockedCountries.includes(countryCode)) {
    return false;
  }
  
  // Check if in allowed list
  return SECURITY_CONFIG.ipRestriction.allowedCountries.includes(countryCode);
}

/**
 * Add IP to whitelist dynamically
 * (Use this for admin panel functionality)
 */
export function addToWhitelist(ip: string): void {
  if (!SECURITY_CONFIG.ipRestriction.whitelist.includes(ip)) {
    SECURITY_CONFIG.ipRestriction.whitelist.push(ip);
    console.log(`[Security] Added ${ip} to whitelist`);
  }
}

/**
 * Add IP to blacklist dynamically
 * (Use this for admin panel functionality)
 */
export function addToBlacklist(ip: string): void {
  if (!SECURITY_CONFIG.ipRestriction.blacklist.includes(ip)) {
    SECURITY_CONFIG.ipRestriction.blacklist.push(ip);
    console.log(`[Security] Added ${ip} to blacklist`);
  }
}

/**
 * Remove IP from whitelist
 */
export function removeFromWhitelist(ip: string): void {
  const index = SECURITY_CONFIG.ipRestriction.whitelist.indexOf(ip);
  if (index > -1) {
    SECURITY_CONFIG.ipRestriction.whitelist.splice(index, 1);
    console.log(`[Security] Removed ${ip} from whitelist`);
  }
}

/**
 * Remove IP from blacklist
 */
export function removeFromBlacklist(ip: string): void {
  const index = SECURITY_CONFIG.ipRestriction.blacklist.indexOf(ip);
  if (index > -1) {
    SECURITY_CONFIG.ipRestriction.blacklist.splice(index, 1);
    console.log(`[Security] Removed ${ip} from blacklist`);
  }
}

/**
 * Get current security configuration (read-only)
 */
export function getSecurityConfig(): Readonly<SecurityConfig> {
  return Object.freeze(SECURITY_CONFIG);
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };
  
  if (import.meta.env.DEV) {
    console.warn('[Security Event]', logEntry);
  }
  
  // TODO: Send to logging service (Firestore, Sentry, etc.)
  // await logToFirestore('securityEvents', logEntry);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SECURITY_CONFIG;
