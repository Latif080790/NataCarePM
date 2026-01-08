/**
 * Contexts Central Export
 * Phase 3: Enterprise Construction PM Suite
 *
 * Exports all context providers and hooks for easy importing
 * 
 * CONTEXT CONSOLIDATION (17 → 10):
 * - AIAnalyticsContext: Combines AIResourceContext + PredictiveAnalyticsContext
 * - CollaborationContext: Combines MessageContext + RealtimeCollaborationContext + IntegrationContext
 * - AuthContext, ProjectContext, ToastContext: Kept as-is (high usage)
 */

// ============================================================================
// CONSOLIDATED CONTEXTS (NEW)
// ============================================================================

// AI Analytics - Combines AI Resource + Predictive Analytics
export {
  AIAnalyticsProvider,
  useAIAnalytics,
  // Facade hooks for backward compatibility:
  useAIResource,
  usePredictiveAnalytics,
} from './AIAnalyticsContext';
export { default as AIAnalyticsContext } from './AIAnalyticsContext';

// Collaboration - Combines Message + Realtime + Integration
export {
  CollaborationProvider,
  useCollaboration,
  // Facade hooks for backward compatibility:
  useMessage,
  useRealtimeCollaboration,
  useIntegration,
} from './CollaborationContext';
export { default as CollaborationContext } from './CollaborationContext';

// ============================================================================
// STANDALONE CONTEXTS (Keep separate due to high usage)
// ============================================================================

// Priority 3A: Resource Management
export { ResourceProvider, useResource } from './ResourceContext';
export { default as ResourceContext } from './ResourceContext';

// Priority 3B: Risk Management
export { RiskProvider, useRisk } from './RiskContext';
export { default as RiskContext } from './RiskContext';

// Priority 3C: Change Order Management
export { ChangeOrderProvider, useChangeOrder } from './ChangeOrderContext';
export { default as ChangeOrderContext } from './ChangeOrderContext';

// Priority 3D: Quality Management
export { QualityProvider, useQuality } from './QualityContext';
export { default as QualityContext } from './QualityContext';
