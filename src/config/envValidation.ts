/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables at application startup
 * Prevents runtime errors due to missing configuration
 * 
 * @module config/envValidation
 */

import { z } from 'zod';
import { logger } from '@/utils/logger.enhanced';

/**
 * Environment validation schema
 * All required variables must be present and valid
 */
const envSchema = z.object({
  // ========================================
  // FIREBASE (REQUIRED)
  // ========================================
  VITE_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  VITE_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),

  // ========================================
  // GEMINI AI (REQUIRED for AI features)
  // ========================================
  VITE_GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // ========================================
  // MONITORING (RECOMMENDED)
  // ========================================
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_SENTRY_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  VITE_SENTRY_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_SENTRY_TRACE_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.2),
  VITE_SENTRY_REPLAY_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),

  VITE_GA4_MEASUREMENT_ID: z.string().optional(),
  VITE_GA4_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),

  // ========================================
  // FEATURE FLAGS (OPTIONAL)
  // ========================================
  VITE_ENABLE_DEBUG: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  VITE_ENABLE_CONSOLE_LOGS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  VITE_ENABLE_2FA: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),
  VITE_SESSION_TIMEOUT_MINUTES: z.coerce.number().positive().default(30),
  VITE_MAX_LOGIN_ATTEMPTS: z.coerce.number().positive().default(5),

  // ========================================
  // RATE LIMITING (OPTIONAL)
  // ========================================
  VITE_API_RATE_LIMIT_PER_MINUTE: z.coerce.number().positive().default(100),
  VITE_FILE_UPLOAD_MAX_SIZE_MB: z.coerce.number().positive().default(10),

  // ========================================
  // THIRD-PARTY SERVICES (OPTIONAL)
  // ========================================
  VITE_SENDGRID_API_KEY: z.string().optional(),
  VITE_SENDGRID_FROM_EMAIL: z.string().email().optional(),

  VITE_TWILIO_ACCOUNT_SID: z.string().optional(),
  VITE_TWILIO_AUTH_TOKEN: z.string().optional(),
  VITE_TWILIO_PHONE_NUMBER: z.string().optional(),

  VITE_WEBHOOK_URL: z.string().url().optional(),

  // ========================================
  // APP CONFIGURATION (OPTIONAL)
  // ========================================
  VITE_APP_NAME: z.string().default('NataCarePM'),
  VITE_APP_VERSION: z.string().default('0.0.0'),
  VITE_APP_URL: z.string().url().optional(),
  VITE_API_BASE_URL: z.string().url().optional(),

  VITE_ENABLE_SERVICE_WORKER: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  VITE_CACHE_DURATION_MINUTES: z.coerce.number().positive().default(5),
  VITE_ENABLE_OFFLINE_MODE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),
});

/**
 * Validated environment configuration type
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Throws error if validation fails
 * 
 * @returns Validated environment configuration
 * @throws {Error} If required environment variables are missing or invalid
 */
export function validateEnv(): EnvConfig {
  try {
    const env = {
      VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
      
      VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
      GEMINI_API_KEY: import.meta.env.GEMINI_API_KEY,
      
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      VITE_SENTRY_ENABLED: import.meta.env.VITE_SENTRY_ENABLED,
      VITE_SENTRY_ENVIRONMENT: import.meta.env.VITE_SENTRY_ENVIRONMENT,
      VITE_SENTRY_TRACE_SAMPLE_RATE: import.meta.env.VITE_SENTRY_TRACE_SAMPLE_RATE,
      VITE_SENTRY_REPLAY_SAMPLE_RATE: import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE,
      
      VITE_GA4_MEASUREMENT_ID: import.meta.env.VITE_GA4_MEASUREMENT_ID,
      VITE_GA4_ENABLED: import.meta.env.VITE_GA4_ENABLED,
      
      VITE_ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG,
      VITE_ENABLE_CONSOLE_LOGS: import.meta.env.VITE_ENABLE_CONSOLE_LOGS,
      VITE_LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL,
      
      VITE_ENABLE_2FA: import.meta.env.VITE_ENABLE_2FA,
      VITE_SESSION_TIMEOUT_MINUTES: import.meta.env.VITE_SESSION_TIMEOUT_MINUTES,
      VITE_MAX_LOGIN_ATTEMPTS: import.meta.env.VITE_MAX_LOGIN_ATTEMPTS,
      
      VITE_API_RATE_LIMIT_PER_MINUTE: import.meta.env.VITE_API_RATE_LIMIT_PER_MINUTE,
      VITE_FILE_UPLOAD_MAX_SIZE_MB: import.meta.env.VITE_FILE_UPLOAD_MAX_SIZE_MB,
      
      VITE_SENDGRID_API_KEY: import.meta.env.VITE_SENDGRID_API_KEY,
      VITE_SENDGRID_FROM_EMAIL: import.meta.env.VITE_SENDGRID_FROM_EMAIL,
      
      VITE_TWILIO_ACCOUNT_SID: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
      VITE_TWILIO_AUTH_TOKEN: import.meta.env.VITE_TWILIO_AUTH_TOKEN,
      VITE_TWILIO_PHONE_NUMBER: import.meta.env.VITE_TWILIO_PHONE_NUMBER,
      
      VITE_WEBHOOK_URL: import.meta.env.VITE_WEBHOOK_URL,
      
      VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
      VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
      VITE_APP_URL: import.meta.env.VITE_APP_URL,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      
      VITE_ENABLE_SERVICE_WORKER: import.meta.env.VITE_ENABLE_SERVICE_WORKER,
      VITE_CACHE_DURATION_MINUTES: import.meta.env.VITE_CACHE_DURATION_MINUTES,
      VITE_ENABLE_OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE_MODE,
    };

    const validated = envSchema.parse(env);
    
    // Log validation success in development
    if (import.meta.env.DEV) {
      logger.info('Environment variables validated successfully', {
        environment: validated.VITE_SENTRY_ENVIRONMENT,
        debugMode: validated.VITE_ENABLE_DEBUG,
        twoFactorEnabled: validated.VITE_ENABLE_2FA,
      });
    }
    
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed', error, {
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
      
      throw new Error(
        'Invalid environment configuration. Please check your .env file.\n' +
        'See .env.production.example for required variables.'
      );
    }
    
    throw error;
  }
}

/**
 * Get validated environment configuration
 * Call this once at app startup
 */
let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/**
 * Helper function to check if we're in production
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Helper function to check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return getEnv().VITE_ENABLE_DEBUG;
}

/**
 * Helper function to check if console logs should be shown
 */
export function shouldShowConsoleLogs(): boolean {
  return getEnv().VITE_ENABLE_CONSOLE_LOGS || import.meta.env.DEV;
}
