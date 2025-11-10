/**
 * Google Analytics 4 (GA4) Integration
 * Tracks user behavior, page views, events, and conversions
 */

/// <reference types="vite/client" />

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      targetId: string | Record<string, any>,
      params?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

/**
 * Initialize Google Analytics 4
 * Only loads in production unless explicitly enabled
 */
export const initGA4 = (): void => {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  const isProduction = import.meta.env.PROD;
  const debugMode = import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

  // Skip if no measurement ID or not in production (unless debug)
  if (!measurementId || (!isProduction && !debugMode)) {
    console.log('[GA4] Skipped (development mode or not configured)');
    return;
  }

  try {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // gtag function
    window.gtag = function gtag() {
      window.dataLayer!.push(arguments);
    };

    // Set default configuration - using 'config' command instead of 'js'
    window.gtag('config', measurementId, {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure',
      // Privacy settings
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    console.log('[GA4] ✅ Initialized:', measurementId);
  } catch (error) {
    console.warn('[GA4] ❌ Failed to initialize:', error);
  }
};

/**
 * Track page view
 * Automatically called on route changes
 */
export const trackPageView = (path: string, title?: string): void => {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
    });
  }
};

/**
 * Track custom event
 * @param eventName - Name of the event
 * @param params - Event parameters
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
): void => {
  if (window.gtag) {
    window.gtag('event', eventName, {
      ...params,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Track user login
 */
export const trackLogin = (method: 'email' | 'google' | 'phone' = 'email'): void => {
  trackEvent('login', {
    method,
  });
};

/**
 * Track user registration
 */
export const trackSignUp = (method: 'email' | 'google' = 'email'): void => {
  trackEvent('sign_up', {
    method,
  });
};

/**
 * Track project creation
 */
export const trackProjectCreated = (projectData: {
  projectId: string;
  projectType?: string;
  budget?: number;
}): void => {
  trackEvent('project_created', {
    project_id: projectData.projectId,
    project_type: projectData.projectType,
    value: projectData.budget,
    currency: 'IDR',
  });
};

/**
 * Track transaction creation
 */
export const trackTransactionCreated = (transactionData: {
  transactionId: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
}): void => {
  trackEvent('transaction_created', {
    transaction_id: transactionData.transactionId,
    value: transactionData.amount,
    currency: 'IDR',
    transaction_type: transactionData.type,
    category: transactionData.category,
  });
};

/**
 * Track purchase order creation
 */
export const trackPOCreated = (poData: {
  poId: string;
  amount: number;
  vendor?: string;
}): void => {
  trackEvent('purchase_order_created', {
    po_id: poData.poId,
    value: poData.amount,
    currency: 'IDR',
    vendor: poData.vendor,
  });
};

/**
 * Track document upload
 */
export const trackDocumentUpload = (documentData: {
  documentId: string;
  fileType: string;
  fileSize: number;
  category?: string;
}): void => {
  trackEvent('document_uploaded', {
    document_id: documentData.documentId,
    file_type: documentData.fileType,
    file_size: documentData.fileSize,
    category: documentData.category,
  });
};

/**
 * Track report generation
 */
export const trackReportGenerated = (reportData: {
  reportType: string;
  format: 'pdf' | 'excel' | 'csv';
  dateRange?: string;
}): void => {
  trackEvent('report_generated', {
    report_type: reportData.reportType,
    format: reportData.format,
    date_range: reportData.dateRange,
  });
};

/**
 * Track AI assistant usage
 */
export const trackAIQuery = (queryData: {
  queryType: string;
  responseTime?: number;
  successful: boolean;
}): void => {
  trackEvent('ai_query', {
    query_type: queryData.queryType,
    response_time: queryData.responseTime,
    successful: queryData.successful,
  });
};

/**
 * Track search usage
 */
export const trackSearch = (searchData: {
  searchTerm: string;
  resultsCount: number;
  category?: string;
}): void => {
  trackEvent('search', {
    search_term: searchData.searchTerm,
    results_count: searchData.resultsCount,
    category: searchData.category,
  });
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = (featureName: string, action: string): void => {
  trackEvent('feature_used', {
    feature_name: featureName,
    action,
  });
};

/**
 * Track error occurrence
 */
export const trackError = (errorData: {
  errorType: string;
  errorMessage: string;
  fatal: boolean;
}): void => {
  trackEvent('exception', {
    description: errorData.errorMessage,
    error_type: errorData.errorType,
    fatal: errorData.fatal,
  });
};

/**
 * Track conversion (premium feature usage, etc.)
 */
export const trackConversion = (conversionData: {
  conversionType: string;
  value?: number;
  currency?: string;
}): void => {
  trackEvent('conversion', {
    conversion_type: conversionData.conversionType,
    value: conversionData.value,
    currency: conversionData.currency || 'IDR',
  });
};

/**
 * Track user engagement time
 */
export const trackEngagement = (engagementData: {
  duration: number;
  pageType: string;
}): void => {
  trackEvent('user_engagement', {
    engagement_time_msec: engagementData.duration,
    page_type: engagementData.pageType,
  });
};

/**
 * Set user properties
 * Call after successful login
 */
export const setUserProperties = (userProps: {
  userId: string;
  userRole?: string;
  companySize?: string;
  industry?: string;
}): void => {
  if (window.gtag) {
    window.gtag('set', 'user_properties', {
      user_role: userProps.userRole,
      company_size: userProps.companySize,
      industry: userProps.industry,
    });

    window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID!, {
      user_id: userProps.userId,
    });
  }
};

/**
 * Clear user properties
 * Call on logout
 */
export const clearUserProperties = (): void => {
  if (window.gtag) {
    window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID!, {
      user_id: undefined,
    });
  }
};

/**
 * Track e-commerce purchase (for premium features)
 */
export const trackPurchase = (purchaseData: {
  transactionId: string;
  value: number;
  currency: string;
  items: Array<{
    itemId: string;
    itemName: string;
    price: number;
    quantity: number;
  }>;
}): void => {
  trackEvent('purchase', {
    transaction_id: purchaseData.transactionId,
    value: purchaseData.value,
    currency: purchaseData.currency,
    items: purchaseData.items,
  });
};

/**
 * Enable GA4 debug mode
 * Shows events in real-time in GA4 DebugView
 */
export const enableDebugMode = (): void => {
  if (window.gtag) {
    window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID!, {
      debug_mode: true,
    });
    console.log('[GA4] Debug mode enabled - check GA4 DebugView');
  }
};

/**
 * Disable GA4 tracking (GDPR compliance)
 */
export const disableTracking = (): void => {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  if (measurementId) {
    // @ts-ignore
    window[`ga-disable-${measurementId}`] = true;
    console.log('[GA4] Tracking disabled');
  }
};

/**
 * Enable GA4 tracking
 */
export const enableTracking = (): void => {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  if (measurementId) {
    // @ts-ignore
    window[`ga-disable-${measurementId}`] = false;
    console.log('[GA4] Tracking enabled');
  }
};
