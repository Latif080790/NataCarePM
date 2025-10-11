import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface SecurityConfig {
    maxLoginAttempts: number;
    sessionTimeout: number; // in minutes
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
    };
    twoFactorAuth: boolean;
    ipWhitelist: string[];
}

interface PerformanceConfig {
    cacheTimeout: number; // in minutes
    maxConcurrentRequests: number;
    dataPageSize: number;
    imageCompressionQuality: number;
    enableLazyLoading: boolean;
    enableVirtualization: boolean;
}

interface SecurityMetrics {
    failedLoginAttempts: { [email: string]: { count: number; lastAttempt: Date } };
    activeSessions: { [userId: string]: { loginTime: Date; lastActivity: Date; ipAddress: string } };
    securityEvents: Array<{
        type: 'login_success' | 'login_failure' | 'password_change' | 'suspicious_activity' | 'config_change' | 'data_access' | 'admin_action' | 'security_alert';
        userId?: string;
        timestamp: Date;
        details: any;
        ipAddress: string;
    }>;
}

interface PerformanceMetrics {
    pageLoadTimes: { [page: string]: number[] };
    apiResponseTimes: { [endpoint: string]: number[] };
    memoryUsage: number[];
    errorCounts: { [error: string]: number };
    userEngagement: {
        activeUsers: number;
        averageSessionDuration: number;
        bounceRate: number;
    };
}

const defaultSecurityConfig: SecurityConfig = {
    maxLoginAttempts: 5,
    sessionTimeout: 120, // 2 hours
    passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    },
    twoFactorAuth: false,
    ipWhitelist: []
};

const defaultPerformanceConfig: PerformanceConfig = {
    cacheTimeout: 15,
    maxConcurrentRequests: 10,
    dataPageSize: 50,
    imageCompressionQuality: 0.8,
    enableLazyLoading: true,
    enableVirtualization: true
};

export const useSecurityManager = () => {
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(defaultSecurityConfig);
    const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
        failedLoginAttempts: {},
        activeSessions: {},
        securityEvents: []
    });

    // Password strength validation
    const validatePassword = useCallback((password: string): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];
        const { passwordPolicy } = securityConfig;

        if (password.length < passwordPolicy.minLength) {
            errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
        }

        if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }, [securityConfig.passwordPolicy]);

    // Session management
    const checkSessionValidity = useCallback(() => {
        if (!currentUser) return false;

        const session = securityMetrics.activeSessions[currentUser.uid];
        if (!session) return false;

        const now = new Date();
        const sessionAge = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60); // in minutes

        if (sessionAge > securityConfig.sessionTimeout) {
            addToast('Session expired. Please log in again.', 'error');
            return false;
        }

        // Update last activity
        setSecurityMetrics(prev => ({
            ...prev,
            activeSessions: {
                ...prev.activeSessions,
                [currentUser.uid]: {
                    ...session,
                    lastActivity: now
                }
            }
        }));

        return true;
    }, [currentUser, securityConfig.sessionTimeout, securityMetrics.activeSessions, addToast]);

    // Rate limiting for API calls
    const rateLimiter = useCallback(async <T>(
        fn: () => Promise<T>,
        key: string,
        maxRequests: number = 10,
        windowMs: number = 60000
    ): Promise<T> => {
        const now = Date.now();
        const requests = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
        
        // Filter out old requests
        const recentRequests = requests.filter((timestamp: number) => now - timestamp < windowMs);
        
        if (recentRequests.length >= maxRequests) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Add current request
        recentRequests.push(now);
        localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentRequests));

        return await fn();
    }, []);

    // Input sanitization
    const sanitizeInput = useCallback((input: string): string => {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }, []);

    // Security event logging
    const logSecurityEvent = useCallback((
        type: SecurityMetrics['securityEvents'][0]['type'],
        details: any,
        userId?: string
    ) => {
        const event = {
            type,
            userId,
            timestamp: new Date(),
            details,
            ipAddress: 'unknown' // In a real app, you'd get this from the request
        };

        setSecurityMetrics(prev => ({
            ...prev,
            securityEvents: [event, ...prev.securityEvents].slice(0, 100) // Keep last 100 events
        }));

        // Log to console for debugging (in production, send to security service)
        console.log('Security Event:', event);
    }, []);

    return {
        securityConfig,
        securityMetrics,
        setSecurityConfig,
        validatePassword,
        checkSessionValidity,
        rateLimiter,
        sanitizeInput,
        logSecurityEvent
    };
};

export const usePerformanceMonitor = () => {
    const [performanceConfig, setPerformanceConfig] = useState<PerformanceConfig>(defaultPerformanceConfig);
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
        pageLoadTimes: {},
        apiResponseTimes: {},
        memoryUsage: [],
        errorCounts: {},
        userEngagement: {
            activeUsers: 0,
            averageSessionDuration: 0,
            bounceRate: 0
        }
    });

    // Measure page load time
    const measurePageLoad = useCallback((pageName: string) => {
        const startTime = performance.now();
        
        return () => {
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            
            setPerformanceMetrics(prev => ({
                ...prev,
                pageLoadTimes: {
                    ...prev.pageLoadTimes,
                    [pageName]: [...(prev.pageLoadTimes[pageName] || []), loadTime].slice(-10) // Keep last 10 measurements
                }
            }));
        };
    }, []);

    // Measure API response time
    const measureApiCall = useCallback(async <T>(
        apiCall: () => Promise<T>,
        endpoint: string
    ): Promise<T> => {
        const startTime = performance.now();
        
        try {
            const result = await apiCall();
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            setPerformanceMetrics(prev => ({
                ...prev,
                apiResponseTimes: {
                    ...prev.apiResponseTimes,
                    [endpoint]: [...(prev.apiResponseTimes[endpoint] || []), responseTime].slice(-10)
                }
            }));
            
            return result;
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            // Log error and response time
            setPerformanceMetrics(prev => ({
                ...prev,
                apiResponseTimes: {
                    ...prev.apiResponseTimes,
                    [endpoint]: [...(prev.apiResponseTimes[endpoint] || []), responseTime].slice(-10)
                },
                errorCounts: {
                    ...prev.errorCounts,
                    [endpoint]: (prev.errorCounts[endpoint] || 0) + 1
                }
            }));
            
            throw error;
        }
    }, []);

    // Monitor memory usage
    const monitorMemoryUsage = useCallback(() => {
        if ('memory' in performance) {
            const memInfo = (performance as any).memory;
            const usedMemory = memInfo.usedJSHeapSize / 1024 / 1024; // MB
            
            setPerformanceMetrics(prev => ({
                ...prev,
                memoryUsage: [...prev.memoryUsage, usedMemory].slice(-20) // Keep last 20 measurements
            }));
        }
    }, []);

    // Debounce function for optimizing frequent operations
    const debounce = useCallback(<T extends (...args: any[]) => any>(
        func: T,
        delay: number
    ): ((...args: Parameters<T>) => void) => {
        let timeoutId: NodeJS.Timeout;
        
        return (...args: Parameters<T>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    }, []);

    // Throttle function for limiting execution frequency
    const throttle = useCallback(<T extends (...args: any[]) => any>(
        func: T,
        delay: number
    ): ((...args: Parameters<T>) => void) => {
        let inThrottle: boolean;
        
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, delay);
            }
        };
    }, []);

    // Image optimization
    const optimizeImage = useCallback((
        file: File,
        maxWidth: number = 1920,
        maxHeight: number = 1080
    ): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    performanceConfig.imageCompressionQuality
                );
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }, [performanceConfig.imageCompressionQuality]);

    // Virtual scrolling helper
    const calculateVisibleItems = useCallback((
        scrollTop: number,
        containerHeight: number,
        itemHeight: number,
        totalItems: number,
        overscan: number = 5
    ) => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(
            totalItems - 1,
            Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
        );
        
        return { startIndex, endIndex, visibleItems: endIndex - startIndex + 1 };
    }, []);

    // Performance report generation
    const generatePerformanceReport = useCallback(() => {
        const report = {
            averagePageLoadTime: Object.entries(performanceMetrics.pageLoadTimes).reduce((acc, [page, times]) => {
                acc[page] = times.reduce((sum, time) => sum + time, 0) / times.length;
                return acc;
            }, {} as { [page: string]: number }),
            
            averageApiResponseTime: Object.entries(performanceMetrics.apiResponseTimes).reduce((acc, [endpoint, times]) => {
                acc[endpoint] = times.reduce((sum, time) => sum + time, 0) / times.length;
                return acc;
            }, {} as { [endpoint: string]: number }),
            
            memoryUsage: {
                current: performanceMetrics.memoryUsage[performanceMetrics.memoryUsage.length - 1] || 0,
                average: performanceMetrics.memoryUsage.reduce((sum, usage) => sum + usage, 0) / performanceMetrics.memoryUsage.length || 0,
                peak: Math.max(...performanceMetrics.memoryUsage) || 0
            },
            
            errorRates: Object.entries(performanceMetrics.errorCounts).reduce((acc, [endpoint, count]) => {
                const totalCalls = performanceMetrics.apiResponseTimes[endpoint]?.length || 1;
                acc[endpoint] = (count / totalCalls) * 100;
                return acc;
            }, {} as { [endpoint: string]: number }),
            
            userEngagement: performanceMetrics.userEngagement
        };
        
        return report;
    }, [performanceMetrics]);

    // Monitor performance periodically
    useEffect(() => {
        const interval = setInterval(() => {
            monitorMemoryUsage();
        }, 30000); // Every 30 seconds
        
        return () => clearInterval(interval);
    }, [monitorMemoryUsage]);

    return {
        performanceConfig,
        performanceMetrics,
        setPerformanceConfig,
        measurePageLoad,
        measureApiCall,
        monitorMemoryUsage,
        debounce,
        throttle,
        optimizeImage,
        calculateVisibleItems,
        generatePerformanceReport
    };
};