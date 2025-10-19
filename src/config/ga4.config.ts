/**
 * Google Analytics 4 Configuration
 * 
 * Priority 2C: Monitoring & Analytics
 * 
 * Features:
 * - Page view tracking
 * - Event tracking (custom events)
 * - User properties tracking
 * - E-commerce tracking (if needed)
 * - Web Vitals tracking (performance metrics)
 */

import ReactGA from 'react-ga4';
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * GA4 Configuration Interface
 */
export interface GA4Config {
  measurementId: string;
  enabled: boolean;
  debug: boolean;
  trackWebVitals: boolean;
}

/**
 * Default GA4 Configuration
 */
const defaultConfig: GA4Config = {
  // TODO: Replace with actual GA4 Measurement ID from Google Analytics
  measurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || '',
  enabled: import.meta.env.MODE === 'production' || import.meta.env.VITE_GA4_ENABLED === 'true',
  debug: import.meta.env.MODE === 'development',
  trackWebVitals: true,
};

/**
 * Initialize Google Analytics 4
 */
export function initializeGA4(config: Partial<GA4Config> = {}): void {
  const finalConfig = { ...defaultConfig, ...config };

  // Skip initialization if disabled or no measurement ID
  if (!finalConfig.enabled || !finalConfig.measurementId) {
    console.log('[GA4] Initialization skipped:', 
      !finalConfig.enabled ? 'Disabled' : 'No Measurement ID provided'
    );
    return;
  }

  ReactGA.initialize(finalConfig.measurementId, {
    gaOptions: {
      debug_mode: finalConfig.debug,
    },
    gtagOptions: {
      send_page_view: false, // We'll send page views manually
    },
  });

  console.log('[GA4] Initialized successfully:', {
    measurementId: finalConfig.measurementId,
    debug: finalConfig.debug,
  });

  // Track Web Vitals if enabled
  if (finalConfig.trackWebVitals) {
    trackWebVitals();
  }
}

/**
 * Track page view
 */
export function trackPageView(path?: string, title?: string): void {
  const page = path || window.location.pathname + window.location.search;
  const pageTitle = title || document.title;

  ReactGA.send({
    hitType: 'pageview',
    page,
    title: pageTitle,
  });

  console.log('[GA4] Page view tracked:', { page, title: pageTitle });
}

/**
 * Track custom event
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });

  console.log('[GA4] Event tracked:', { category, action, label, value });
}

/**
 * Track user login
 */
export function trackLogin(method: string): void {
  ReactGA.event('login', {
    method,
  });

  console.log('[GA4] Login tracked:', { method });
}

/**
 * Track user signup
 */
export function trackSignup(method: string): void {
  ReactGA.event('sign_up', {
    method,
  });

  console.log('[GA4] Signup tracked:', { method });
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string): void {
  ReactGA.event('search', {
    search_term: searchTerm,
  });

  console.log('[GA4] Search tracked:', { searchTerm });
}

/**
 * Set user ID (for cross-device tracking)
 */
export function setGA4UserId(userId: string): void {
  ReactGA.set({ user_id: userId });
  console.log('[GA4] User ID set:', userId);
}

/**
 * Set user properties
 */
export function setGA4UserProperties(properties: Record<string, any>): void {
  ReactGA.set(properties);
  console.log('[GA4] User properties set:', properties);
}

/**
 * Track project-specific events
 */
export const ProjectEvents = {
  created: (projectId: string, projectType: string) => {
    trackEvent('Project', 'Created', projectType);
    ReactGA.event('project_created', {
      project_id: projectId,
      project_type: projectType,
    });
  },

  viewed: (projectId: string, projectType: string) => {
    trackEvent('Project', 'Viewed', projectType);
    ReactGA.event('project_viewed', {
      project_id: projectId,
      project_type: projectType,
    });
  },

  updated: (projectId: string, field: string) => {
    trackEvent('Project', 'Updated', field);
    ReactGA.event('project_updated', {
      project_id: projectId,
      field,
    });
  },

  deleted: (projectId: string) => {
    trackEvent('Project', 'Deleted');
    ReactGA.event('project_deleted', {
      project_id: projectId,
    });
  },

  shared: (projectId: string, method: string) => {
    trackEvent('Project', 'Shared', method);
    ReactGA.event('share', {
      content_type: 'project',
      content_id: projectId,
      method,
    });
  },
};

/**
 * Track task-specific events
 */
export const TaskEvents = {
  created: (taskId: string, projectId: string) => {
    trackEvent('Task', 'Created');
    ReactGA.event('task_created', {
      task_id: taskId,
      project_id: projectId,
    });
  },

  completed: (taskId: string, projectId: string) => {
    trackEvent('Task', 'Completed');
    ReactGA.event('task_completed', {
      task_id: taskId,
      project_id: projectId,
    });
  },

  updated: (taskId: string, field: string) => {
    trackEvent('Task', 'Updated', field);
    ReactGA.event('task_updated', {
      task_id: taskId,
      field,
    });
  },

  deleted: (taskId: string) => {
    trackEvent('Task', 'Deleted');
    ReactGA.event('task_deleted', {
      task_id: taskId,
    });
  },
};

/**
 * Track PWA-specific events
 */
export const PWAEvents = {
  installed: () => {
    trackEvent('PWA', 'Installed');
    ReactGA.event('pwa_installed');
  },

  promptShown: () => {
    trackEvent('PWA', 'Prompt Shown');
    ReactGA.event('pwa_prompt_shown');
  },

  promptAccepted: () => {
    trackEvent('PWA', 'Prompt Accepted');
    ReactGA.event('pwa_prompt_accepted');
  },

  promptDismissed: () => {
    trackEvent('PWA', 'Prompt Dismissed');
    ReactGA.event('pwa_prompt_dismissed');
  },

  offlineUsage: () => {
    trackEvent('PWA', 'Offline Usage');
    ReactGA.event('pwa_offline_usage');
  },

  pushEnabled: () => {
    trackEvent('PWA', 'Push Enabled');
    ReactGA.event('pwa_push_enabled');
  },

  pushDisabled: () => {
    trackEvent('PWA', 'Push Disabled');
    ReactGA.event('pwa_push_disabled');
  },
};

/**
 * Track Web Vitals (Core Web Vitals)
 */
function trackWebVitals(): void {
  function sendToGA4(metric: Metric): void {
    const { name, value, id } = metric;

    ReactGA.event('web_vitals', {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      metric_name: name,
      non_interaction: true,
    });

    console.log('[GA4] Web Vital tracked:', {
      name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      id,
    });
  }

  // Cumulative Layout Shift
  onCLS(sendToGA4);
  
  // First Input Delay
  onFID(sendToGA4);
  
  // First Contentful Paint
  onFCP(sendToGA4);
  
  // Largest Contentful Paint
  onLCP(sendToGA4);
  
  // Time to First Byte
  onTTFB(sendToGA4);
}

/**
 * Track exception/error
 */
export function trackException(description: string, fatal: boolean = false): void {
  ReactGA.event('exception', {
    description,
    fatal,
  });

  console.log('[GA4] Exception tracked:', { description, fatal });
}

/**
 * Track timing (performance timing)
 */
export function trackTiming(
  category: string,
  variable: string,
  value: number,
  label?: string
): void {
  ReactGA.event('timing_complete', {
    name: variable,
    value: Math.round(value),
    event_category: category,
    event_label: label,
  });

  console.log('[GA4] Timing tracked:', { category, variable, value, label });
}

export default {
  initialize: initializeGA4,
  trackPageView,
  trackEvent,
  trackLogin,
  trackSignup,
  trackSearch,
  setUserId: setGA4UserId,
  setUserProperties: setGA4UserProperties,
  trackException,
  trackTiming,
  ProjectEvents,
  TaskEvents,
  PWAEvents,
};
