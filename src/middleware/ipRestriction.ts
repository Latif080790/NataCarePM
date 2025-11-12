/**
 * IP Restriction Middleware
 * Handles IP-based access control, geo-location verification, and security logging
 * 
 * Features:
 * - IP whitelist/blacklist validation
 * - Geo-location based restrictions
 * - Automatic IP blocking after suspicious activity
 * - Security event logging
 */

import { SECURITY_CONFIG, isIPWhitelisted, isIPBlacklisted, isCountryAllowed, addToBlacklist, logSecurityEvent } from '@/config/security';
import { db } from '@/firebaseConfig';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface IPInfo {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  as: string;
  timezone: string;
  lat: number;
  lon: number;
}

export interface IPValidationResult {
  allowed: boolean;
  reason: string;
  ipInfo?: IPInfo;
  action: 'allow' | 'block' | 'whitelist' | 'blacklist';
}

export interface BlockedIPLog {
  ip: string;
  reason: string;
  timestamp: Timestamp;
  userAgent: string;
  url: string;
  geoInfo?: IPInfo;
}

// ============================================================================
// IP DETECTION
// ============================================================================

/**
 * Get client IP address from various sources
 * Priority: Real IP > Forwarded IP > Remote Address
 */
export async function getClientIP(): Promise<string> {
  try {
    // Try multiple IP detection services for redundancy
    const services = [
      'https://api.ipify.org?format=json',
      'https://api.my-ip.io/ip.json',
      'https://ipapi.co/json/',
    ];

    for (const serviceUrl of services) {
      try {
        const response = await fetch(serviceUrl, { 
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          // Different services use different field names
          const ip = data.ip || data.IP || data.query;
          
          if (ip && validateIPFormat(ip)) {
            console.log(`[IP Detection] Detected IP: ${ip} from ${serviceUrl}`);
            return ip;
          }
        }
      } catch (error) {
        console.warn(`[IP Detection] Service ${serviceUrl} failed:`, error);
        continue; // Try next service
      }
    }
    
    // Fallback: return unknown
    console.warn('[IP Detection] All services failed, returning unknown');
    return 'unknown';
  } catch (error) {
    console.error('[IP Detection] Error:', error);
    return 'unknown';
  }
}

/**
 * Validate IP address format
 */
function validateIPFormat(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
  
  if (ipv4Regex.test(ip)) {
    // Validate IPv4 octets are 0-255
    const octets = ip.split('.');
    return octets.every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Regex.test(ip);
}

// ============================================================================
// GEO-LOCATION
// ============================================================================

// In-memory cache for geo-location data
const geoCache = new Map<string, { data: IPInfo; expiry: number }>();

/**
 * Get geo-location information for an IP address
 * Uses ip-api.com free API (no auth required, 45 req/min limit)
 */
export async function getIPGeoLocation(ip: string): Promise<IPInfo | null> {
  // Skip for localhost/unknown
  if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1' || ip === 'unknown') {
    return null;
  }
  
  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && Date.now() < cached.expiry) {
    console.log(`[Geo-Location] Cache hit for ${ip}`);
    return cached.data;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SECURITY_CONFIG.geoLocation.timeout);
    
    const response = await fetch(`${SECURITY_CONFIG.geoLocation.apiUrl}/${ip}?fields=status,message,country,countryCode,region,city,isp,org,as,lat,lon,timezone,query`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Geo-location API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'fail') {
      console.error('[Geo-Location] API error:', data.message);
      return null;
    }
    
    const ipInfo: IPInfo = {
      ip: data.query || ip,
      country: data.country || 'Unknown',
      countryCode: data.countryCode || 'XX',
      region: data.region || 'Unknown',
      city: data.city || 'Unknown',
      isp: data.isp || 'Unknown',
      org: data.org || 'Unknown',
      as: data.as || 'Unknown',
      timezone: data.timezone || 'Unknown',
      lat: data.lat || 0,
      lon: data.lon || 0,
    };
    
    // Cache the result
    const expiryTime = Date.now() + (SECURITY_CONFIG.geoLocation.cacheExpiry * 60 * 1000);
    geoCache.set(ip, { data: ipInfo, expiry: expiryTime });
    
    console.log(`[Geo-Location] Retrieved info for ${ip}: ${ipInfo.city}, ${ipInfo.country}`);
    return ipInfo;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`[Geo-Location] Timeout after ${SECURITY_CONFIG.geoLocation.timeout}ms`);
    } else {
      console.error('[Geo-Location] Error:', error);
    }
    return null;
  }
}

// ============================================================================
// IP VALIDATION
// ============================================================================

/**
 * Validate if an IP address is allowed to access the system
 * 
 * Validation order:
 * 1. Check whitelist (always allow)
 * 2. Check blacklist (always block)
 * 3. Check geo-location restrictions (if enabled)
 * 4. Default: allow
 */
export async function validateIPAccess(ip: string): Promise<IPValidationResult> {
  // Skip validation if IP restrictions are disabled
  if (!SECURITY_CONFIG.ipRestriction.enabled) {
    return {
      allowed: true,
      reason: 'IP restrictions disabled',
      action: 'allow',
    };
  }
  
  // 1. Check whitelist first (highest priority)
  if (isIPWhitelisted(ip)) {
    console.log(`[IP Restriction] ✅ Whitelisted: ${ip}`);
    return {
      allowed: true,
      reason: 'IP is whitelisted',
      action: 'whitelist',
    };
  }
  
  // 2. Check blacklist (second priority)
  if (isIPBlacklisted(ip)) {
    console.warn(`[IP Restriction] ❌ Blacklisted: ${ip}`);
    
    // Log the blocked attempt
    await logBlockedAttempt(ip, 'IP is blacklisted', null);
    
    return {
      allowed: false,
      reason: 'IP is blacklisted',
      action: 'blacklist',
    };
  }
  
  // 3. Check geo-location restrictions (if enabled)
  if (SECURITY_CONFIG.geoLocation.enabled) {
    const geoInfo = await getIPGeoLocation(ip);
    
    if (geoInfo) {
      const countryAllowed = isCountryAllowed(geoInfo.countryCode);
      
      if (!countryAllowed) {
        console.warn(`[IP Restriction] ❌ Blocked country: ${geoInfo.country} (${geoInfo.countryCode})`);
        
        // Log the blocked attempt
        await logBlockedAttempt(ip, `Country not allowed: ${geoInfo.country}`, geoInfo);
        
        return {
          allowed: false,
          reason: `Access from ${geoInfo.country} is not allowed`,
          ipInfo: geoInfo,
          action: 'block',
        };
      }
      
      console.log(`[IP Restriction] ✅ Allowed country: ${geoInfo.country} (${geoInfo.countryCode})`);
      return {
        allowed: true,
        reason: `Access from ${geoInfo.country} is allowed`,
        ipInfo: geoInfo,
        action: 'allow',
      };
    }
  }
  
  // 4. Default: allow (if no restrictions apply)
  console.log(`[IP Restriction] ✅ Default allow: ${ip}`);
  return {
    allowed: true,
    reason: 'No restrictions apply',
    action: 'allow',
  };
}

// ============================================================================
// SUSPICIOUS ACTIVITY DETECTION
// ============================================================================

/**
 * Check if an IP has suspicious activity (multiple failed attempts)
 * Auto-blacklist after threshold
 */
export async function checkSuspiciousActivity(ip: string): Promise<boolean> {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Query blocked attempts in last 5 minutes
    const q = query(
      collection(db, 'blockedIPs'),
      where('ip', '==', ip),
      where('timestamp', '>=', Timestamp.fromDate(fiveMinutesAgo)),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    const attemptCount = snapshot.size;
    
    // Auto-blacklist after 5 blocked attempts in 5 minutes
    if (attemptCount >= 5) {
      console.warn(`[IP Restriction] 🚨 Auto-blacklisting ${ip} (${attemptCount} attempts)`);
      addToBlacklist(ip);
      
      // Log security event
      logSecurityEvent('auto_blacklist', {
        ip,
        attempts: attemptCount,
        reason: 'Excessive blocked attempts',
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[IP Restriction] Error checking suspicious activity:', error);
    return false;
  }
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log blocked IP attempt to Firestore
 */
async function logBlockedAttempt(
  ip: string,
  reason: string,
  geoInfo: IPInfo | null
): Promise<void> {
  if (!SECURITY_CONFIG.ipRestriction.logBlockedAttempts) {
    return;
  }
  
  try {
    const logEntry: BlockedIPLog = {
      ip,
      reason,
      timestamp: Timestamp.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...(geoInfo && { geoInfo }),
    };
    
    await addDoc(collection(db, 'blockedIPs'), logEntry);
    console.log(`[IP Restriction] Logged blocked attempt: ${ip} - ${reason}`);
    
    // Check for suspicious activity
    await checkSuspiciousActivity(ip);
    
    // Notify admin if enabled
    if (SECURITY_CONFIG.ipRestriction.notifyAdminOnBlock) {
      // TODO: Implement admin notification
      console.warn('[IP Restriction] TODO: Notify admin of blocked access');
    }
  } catch (error) {
    console.error('[IP Restriction] Error logging blocked attempt:', error);
  }
}

/**
 * Get recent blocked IP logs (for admin panel)
 */
export async function getBlockedIPLogs(limitCount: number = 50): Promise<BlockedIPLog[]> {
  try {
    const q = query(
      collection(db, 'blockedIPs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as BlockedIPLog);
  } catch (error) {
    console.error('[IP Restriction] Error fetching blocked IP logs:', error);
    return [];
  }
}

// ============================================================================
// MIDDLEWARE WRAPPER
// ============================================================================

/**
 * IP Restriction Middleware
 * Use this before sensitive operations (login, data access, etc.)
 * 
 * @example
 * const result = await ipRestrictionMiddleware();
 * if (!result.allowed) {
 *   throw new Error(result.reason);
 * }
 */
export async function ipRestrictionMiddleware(): Promise<IPValidationResult> {
  try {
    const ip = await getClientIP();
    const result = await validateIPAccess(ip);
    
    if (!result.allowed) {
      console.warn('[IP Restriction] ❌ Access denied:', result);
    } else {
      console.log('[IP Restriction] ✅ Access allowed:', result);
    }
    
    return result;
  } catch (error) {
    console.error('[IP Restriction] Middleware error:', error);
    
    // Fail-open: allow access if validation fails (unless strict mode)
    return {
      allowed: true,
      reason: 'Validation error - fail-open',
      action: 'allow',
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ipRestriction = {
  getClientIP,
  getIPGeoLocation,
  validateIPAccess,
  checkSuspiciousActivity,
  getBlockedIPLogs,
  middleware: ipRestrictionMiddleware,
};

export default ipRestriction;
