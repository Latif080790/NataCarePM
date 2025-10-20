/**
 * API Services Central Export
 * Phase 3: Enterprise Construction PM Suite
 * 
 * Exports all API service modules for easy importing
 */

// Priority 3A: Resource Management
export { resourceService } from './resourceService';
export { default as ResourceService } from './resourceService';

// Priority 3B: Risk Management
export { riskService } from './riskService';
export { default as RiskService } from './riskService';

// Priority 3C: Change Order Management
export { changeOrderService } from './changeOrderService';
export { default as ChangeOrderService } from './changeOrderService';

// Priority 3D: Quality Management
export { qualityService } from './qualityService';
export { default as QualityService } from './qualityService';

// Priority 3E: Email Integration
export { emailService } from './emailService';
export { default as EmailService } from './emailService';

// Priority 3F: Advanced Search
export { searchService } from './searchService';
export { default as SearchService } from './searchService';
