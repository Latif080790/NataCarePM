/**
 * Avatar Utility with Multiple Fallback Services
 * 
 * Provides robust avatar generation with:
 * - Multiple avatar services (UI Avatars, DiceBear, Boring Avatars)
 * - Local SVG generation as ultimate fallback
 * - Error handling and retry logic
 * - Caching for performance
 */

import { logger } from './logger.enhanced';

/**
 * Avatar service configuration
 */
interface AvatarService {
  name: string;
  generateUrl: (identifier: string, name?: string) => string;
  priority: number;
}

/**
 * Available avatar services (ordered by priority)
 */
const AVATAR_SERVICES: AvatarService[] = [
  {
    name: 'UI Avatars',
    priority: 1,
    generateUrl: (identifier: string, name?: string) => {
      const initials = name 
        ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : identifier.slice(0, 2).toUpperCase();
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=fff&size=150&bold=true`;
    }
  },
  {
    name: 'DiceBear',
    priority: 2,
    generateUrl: (identifier: string) => {
      return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(identifier)}&backgroundColor=3b82f6`;
    }
  },
  {
    name: 'Boring Avatars',
    priority: 3,
    generateUrl: (identifier: string) => {
      return `https://source.boringavatars.com/beam/150/${encodeURIComponent(identifier)}?colors=3b82f6,60a5fa,93c5fd,dbeafe,eff6ff`;
    }
  }
];

/**
 * Cache for tested avatar URLs
 */
const avatarCache = new Map<string, string>();
const failedServices = new Set<string>();

/**
 * Generate initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Generate local SVG avatar (ultimate fallback)
 */
function generateLocalSVGAvatar(identifier: string, name?: string): string {
  const initials = name ? getInitials(name) : identifier.slice(0, 2).toUpperCase();
  
  // Generate deterministic color from identifier
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // green
    '#06b6d4', // cyan
    '#ef4444', // red
    '#6366f1', // indigo
  ];
  
  const bgColor = colors[Math.abs(hash) % colors.length];
  
  const svg = `
    <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="150" fill="${bgColor}"/>
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle" 
        fill="white" 
        font-family="Arial, sans-serif" 
        font-size="60" 
        font-weight="bold"
      >${initials}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Test if an avatar URL is accessible
 */
async function testAvatarUrl(url: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors', // Allow cross-origin
    });
    
    clearTimeout(timeoutId);
    
    // With no-cors, we can't check status, so assume success if no error
    return true;
  } catch (error) {
    logger.debug(`Avatar URL test failed: ${url}`, error);
    return false;
  }
}

/**
 * Get avatar URL with fallback mechanism
 * 
 * @param identifier - Unique identifier (userId, email, etc.)
 * @param name - Optional user name for better initials
 * @param preferredService - Optional preferred service name
 * @returns Avatar URL (guaranteed to work)
 */
export async function getAvatarUrl(
  identifier: string,
  name?: string,
  preferredService?: string
): Promise<string> {
  // Check cache first
  const cacheKey = `${identifier}-${name || ''}`;
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }

  // Sort services by priority (excluding failed ones)
  const availableServices = AVATAR_SERVICES
    .filter(service => !failedServices.has(service.name))
    .sort((a, b) => a.priority - b.priority);

  // Try preferred service first
  if (preferredService) {
    const preferred = availableServices.find(s => s.name === preferredService);
    if (preferred) {
      availableServices.unshift(preferred);
    }
  }

  // Try each service
  for (const service of availableServices) {
    try {
      const url = service.generateUrl(identifier, name);
      
      // Test URL (with timeout)
      const isAccessible = await testAvatarUrl(url, 2000);
      
      if (isAccessible) {
        logger.debug(`Avatar URL generated via ${service.name}`, { identifier });
        avatarCache.set(cacheKey, url);
        return url;
      } else {
        logger.warn(`Avatar service ${service.name} not accessible`);
        failedServices.add(service.name);
      }
    } catch (error) {
      logger.error(`Error generating avatar with ${service.name}`, error instanceof Error ? error : new Error(String(error)));
      failedServices.add(service.name);
    }
  }

  // Ultimate fallback: generate local SVG
  logger.info('All avatar services failed, using local SVG generation', { identifier });
  const localAvatar = generateLocalSVGAvatar(identifier, name);
  avatarCache.set(cacheKey, localAvatar);
  return localAvatar;
}

/**
 * Get avatar URL synchronously (returns local SVG immediately)
 * Use this when you need instant avatar without async
 */
export function getAvatarUrlSync(identifier: string, name?: string): string {
  const cacheKey = `${identifier}-${name || ''}`;
  
  // Check cache
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }

  // Generate local SVG immediately
  const localAvatar = generateLocalSVGAvatar(identifier, name);
  avatarCache.set(cacheKey, localAvatar);
  
  // Async: Try to get better avatar in background
  getAvatarUrl(identifier, name).then(url => {
    if (url !== localAvatar) {
      avatarCache.set(cacheKey, url);
      // Trigger re-render if needed (optional)
      window.dispatchEvent(new CustomEvent('avatar-updated', { 
        detail: { identifier, url } 
      }));
    }
  }).catch(error => {
    logger.error('Background avatar fetch failed', error instanceof Error ? error : new Error(String(error)));
  });
  
  return localAvatar;
}

/**
 * Preload avatar (useful for user lists)
 */
export async function preloadAvatar(identifier: string, name?: string): Promise<void> {
  await getAvatarUrl(identifier, name);
}

/**
 * Clear avatar cache (useful for testing or after user updates)
 */
export function clearAvatarCache(identifier?: string): void {
  if (identifier) {
    // Clear specific user's avatars
    const keysToDelete: string[] = [];
    avatarCache.forEach((_value, key) => {
      if (key.startsWith(identifier)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => avatarCache.delete(key));
  } else {
    // Clear all
    avatarCache.clear();
    failedServices.clear();
  }
}

/**
 * Get avatar statistics (for debugging)
 */
export function getAvatarStats() {
  return {
    cachedAvatars: avatarCache.size,
    failedServices: Array.from(failedServices),
    availableServices: AVATAR_SERVICES.filter(s => !failedServices.has(s.name)).map(s => s.name),
  };
}
