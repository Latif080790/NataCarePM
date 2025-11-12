# Copilot Instructions for NataCarePM

## Project Overview

NataCarePM is an enterprise-grade construction project management system built with React + TypeScript, Firebase, and Vite. It features comprehensive dashboards, cost control (RAB/AHSP), resource management, real-time collaboration, document management, AI-powered insights, and advanced monitoring/analytics capabilities.

## Architecture & Data Flow

### Core Structure
```
src/
├── views/          # Page-level components (43+ views) - lazy-loaded via React.lazy()
├── components/     # Reusable UI components (~150+ components)
│   ├── *Pro.tsx    # Enterprise design system components (ButtonPro, CardPro, etc.)
│   └── safety/     # Safety-related components
├── contexts/       # Global state management (15+ contexts)
├── api/            # Service layer (~80+ services) - handles all Firestore/Firebase operations
├── hooks/          # Custom React hooks
├── utils/          # Utility functions (logger, rateLimiter, failoverManager, etc.)
├── types/          # TypeScript type definitions (types.ts - 2000+ lines)
├── schemas/        # Zod validation schemas
└── config/         # Configuration files (GA4, Sentry, etc.)

functions/          # Firebase Cloud Functions (Node.js 20)
├── src/
│   ├── aiInsightService.ts
│   ├── digitalSignatureService.ts
│   └── index.ts
```

### Data Flow Pattern
1. **Views** render UI and handle user interactions
2. **Contexts** provide global state (auth, project, toast, etc.)
3. **API Services** encapsulate all Firestore operations
4. **Hooks** consume contexts and provide computed state
5. **Components** are stateless and receive props

**Critical:** Always use `waitForAuth()` from `@/utils/authGuard` before Firestore queries to prevent "Missing or insufficient permissions" errors.

## Developer Workflows

### Development
```powershell
npm install              # Install dependencies
npm run dev              # Start Vite dev server (port 3001)
npm run build            # Production build with Terser minification
npm run preview          # Preview production build locally
```

### Testing
```powershell
npm run test             # Run Vitest unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run Playwright E2E tests
npm run test:security    # Run security tests
```

### Deployment
```powershell
.\deploy-nocache.ps1              # Deploy with cache-busting timestamps
.\deploy-functions.ps1            # Deploy Firebase Functions
npm run deploy:hosting            # Deploy to Firebase Hosting
npm run deploy:rules              # Deploy Firestore/Storage rules
```

**Important:** Use PowerShell scripts for deployment - they handle build, cache-busting, and Firebase deployment orchestration.

### Firebase Development
```powershell
npm run firebase:emulators        # Start local Firebase emulators
npm run firebase:login            # Authenticate with Firebase
```

## Critical Patterns & Conventions

### 1. Error Boundaries
**Every route** must be wrapped in `ViewErrorBoundary`:
```tsx
<Route path="/dashboard" element={
  <ViewErrorBoundary viewName="Dashboard">
    <DashboardView />
  </ViewErrorBoundary>
} />
```
See `ERROR_BOUNDARY_IMPLEMENTATION_COMPLETE.md` for 100% coverage implementation.

### 2. Form Validation (Zod + React Hook Form)
Use standardized validation schemas from `@/schemas/commonValidation`:
```tsx
import { emailSchema, strongPasswordSchema } from '@/schemas/commonValidation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```
See `FORM_VALIDATION_STANDARDIZATION_COMPLETE.md` for 40+ reusable schemas.

### 3. Enterprise Design System
Use `*Pro` components for consistent UI:
- `ButtonPro`, `CardPro`, `InputPro`, `TablePro`, `ModalPro`, `SpinnerPro`
- Follows enterprise color palette (see `DESIGN_SYSTEM_GUIDE.md`)
- All components support variants, sizes, and accessibility (WCAG AA)

Example:
```tsx
<ButtonPro variant="primary" size="md" onClick={handleSave}>
  Save Changes
</ButtonPro>
```

### 4. Context Usage
**Auth & Project contexts are required** for most views:
```tsx
const { currentUser } = useAuth();           // From AuthContext
const { currentProject } = useProject();     // From ProjectContext
const { addToast } = useToast();            // For notifications
```

**Routing Pattern:** `App.tsx` wraps authenticated routes with `ProjectProvider` only after login is confirmed.

### 5. Lazy Loading Views
All views are lazy-loaded to optimize bundle size:
```tsx
const DashboardView = lazy(() => import('@/views/DashboardWrapper'));
```
Vite automatically code-splits views into separate chunks (see `vite.config.ts` manualChunks).

### 6. TypeScript Strictness
- `strict: true` in `tsconfig.json`
- No implicit `any`
- All component props must be explicitly typed
- Use types from `@/types` (User, Project, RabItem, etc.)

### 7. Logging & Monitoring
Use structured logger instead of `console.log`:
```tsx
import { logger } from '@/utils/logger.enhanced';

logger.info('User logged in', { userId: user.id });
logger.error('Failed to load project', error, { projectId });
```

**Monitoring Stack:**
- Sentry for error tracking (see `@/config/sentry.config`)
- Google Analytics 4 for user analytics (see `@/config/ga4.config`)
- Custom monitoring service (`@/api/monitoringService.ts`)

### 8. Firebase Configuration
- **Environment Variables:** All Firebase credentials in `.env.local` (never commit!)
- **Firestore Settings:** `ignoreUndefinedProperties: true` prevents undefined field errors
- **Persistence:** Temporarily disabled (enable via `firebaseConfig.ts` after cache clear)
- **Security:** Firestore rules in `firestore.rules` (relaxed for debugging - tighten for production)

### 9. Security Patterns
- **Rate Limiting:** Use `rateLimiter` from `@/utils/rateLimiter` for sensitive operations
- **JWT Tokens:** `jwtUtils` from `@/utils/jwtUtils` for token management
- **2FA Support:** Components in `components/TwoFactor*.tsx`
- **Sensitive Operations:** Move to Firebase Functions (see `functions/src/`)

### 10. Path Aliases
Use `@/` for absolute imports (configured in `tsconfig.json` and `vite.config.ts`):
```tsx
import { Button } from '@/components/Button';
import { projectService } from '@/api/projectService';
```

## Common Tasks

### Adding a New View
1. Create `views/MyNewView.tsx` with lazy loading in `App.tsx`
2. Wrap route in `ViewErrorBoundary`
3. Use contexts: `useAuth()`, `useProject()`, `useToast()`
4. Import from design system: `ButtonPro`, `CardPro`, etc.

### Adding a New API Service
1. Create `api/myService.ts`
2. Define types in `types.ts`
3. Use in contexts or hooks
4. Add error handling with `logger.error()`

### Adding Form Validation
1. Import schemas from `@/schemas/commonValidation`
2. Use `react-hook-form` + `zodResolver`
3. Display errors with `FormFields` components

### Extending Global State
1. Create context in `contexts/MyContext.tsx`
2. Export custom hook: `export const useMyContext = () => useContext(MyContext)`
3. Wrap in `App.tsx` or `Root.tsx`

## Domain-Specific Logic: RAB/AHSP (Construction Cost Analysis)

### Overview
**RAB** (Rencana Anggaran Biaya) = Budget Cost Plan  
**AHSP** (Analisa Harga Satuan Pekerjaan) = Unit Price Analysis

This is the core construction cost management system with sophisticated variance analysis, price escalation tracking, and risk assessment.

### Data Model Hierarchy

```typescript
// Base RAB Item (Budget line item)
RabItem {
  id: number                    // Unique identifier
  no: string                    // Item number (e.g., "1.1.1")
  uraian: string                // Description of work
  volume: number                // Quantity
  satuan: string                // Unit (m³, m², kg, etc.)
  hargaSatuan: number           // Unit price
  kategori: string              // Category (material, labor, equipment)
  ahspId: string                // Links to AHSP master data
  wbsElementId?: string         // Links to Work Breakdown Structure
}

// Enhanced RAB with analytics (EnhancedRabItem extends RabItem)
EnhancedRabItem {
  costBreakdown: CostBreakdown          // Labor/Material/Equipment split
  priceHistory: PriceHistory[]          // Historical pricing data
  escalationRate: number                // Annual price increase %
  budgetVariance: VarianceAnalysis      // Budget vs Actual analysis
  sensitivityFactors: SensitivityFactor[] // Risk factors
  regionalFactors: RegionalPriceFactor[]  // Location-based adjustments
}
```

### Key Services

#### 1. **RabAhspService** (`@/api/rabAhspService.ts`)
Main CRUD operations for RAB items:
```typescript
import { rabAhspService } from '@/api/rabAhspService';

// Create RAB item
await rabAhspService.createRabItem(projectId, {
  no: '1.1.1',
  uraian: 'Excavation work',
  volume: 100,
  satuan: 'm³',
  hargaSatuan: 150000,
  kategori: 'earthwork',
  ahspId: 'AHSP_001'
});

// Get RAB item with validation
const result = await rabAhspService.getRabItemById(projectId, rabItemId);
```

**Validation Rules:**
- `volume` must be positive number
- `hargaSatuan` must be positive number
- `ahspId` must be valid (alphanumeric + underscore only)
- All IDs validated via `validators.isValidId()`

#### 2. **EnhancedRabService** (`@/api/enhancedRabService.ts`)
Advanced analytics and calculations (static methods):

```typescript
import { EnhancedRabService } from '@/api/enhancedRabService';

// Calculate cost breakdown (35% labor, 45% material, 15% equipment, 5% overhead/profit)
const breakdown = EnhancedRabService.calculateCostBreakdown(
  basePrice,
  35, // laborPercentage
  45, // materialPercentage
  15, // equipmentPercentage
  3,  // overheadPercentage
  2   // profitPercentage
);

// Variance analysis (budget vs actual)
const variance = EnhancedRabService.calculateVarianceAnalysis(
  budgetedCost,
  actualCost,
  plannedDuration,
  actualDuration
);
// Returns: costVariance, timeVariance, performanceIndex, trend, riskLevel

// Price escalation projection
const projectedPrice = EnhancedRabService.calculatePriceEscalation(
  basePrice,
  escalationRate, // annual %
  months,
  marketFactors   // external factors
);
```

### Cost Breakdown Logic

Default percentages (industry standard for construction):
- **Labor:** 35% - Worker wages and benefits
- **Material:** 45% - Raw materials and supplies
- **Equipment:** 15% - Machinery rental/depreciation
- **Overhead:** 3% - Administrative costs
- **Profit:** 2% - Contractor margin

Total: 100% of unit price (`hargaSatuan`)

### Variance Analysis Thresholds

```typescript
// Risk levels based on cost variance %
costVariancePercentage > 15%  → riskLevel: 'critical'
costVariancePercentage > 10%  → riskLevel: 'high'
costVariancePercentage > 5%   → riskLevel: 'medium'
costVariancePercentage <= 5%  → riskLevel: 'low'

// Trend detection
costVariancePercentage < -5%  → trend: 'improving'
costVariancePercentage > 5%   → trend: 'deteriorating'
else                          → trend: 'stable'
```

### Price History & Escalation

**Price History** tracks market data sources:
- `supplier_quote` - Direct supplier quotations
- `market_survey` - Market research data
- `historical_data` - Past project data
- `competitor_analysis` - Competitor pricing

**Market Conditions:**
- `stable` - Prices unchanged
- `rising` - Upward trend
- `falling` - Downward trend
- `volatile` - Unpredictable fluctuations

### Regional Price Adjustments

Apply location-based multipliers:
```typescript
RegionalPriceFactor {
  region: 'Remote Area'
  adjustmentFactor: 1.25  // 25% increase
  category: 'labor'       // Affects labor costs only
  reason: 'Remote location premium'
}
```

### Integration with Other Systems

- **WBS (Work Breakdown Structure):** `rabItem.wbsElementId` links to project schedule
- **Purchase Orders:** Created from RAB items for procurement
- **Progress Tracking:** `WorkProgress.rabItemId` tracks completion against budget
- **EVM (Earned Value Management):** Uses RAB data for cost performance indices

### Common Patterns

**1. Creating Enhanced RAB Item:**
```typescript
const rabItem = await rabAhspService.getRabItemById(projectId, rabItemId);
const enhanced = EnhancedRabService.createEnhancedRabItem(rabItem.data);
```

**2. Updating RAB with Variance:**
```typescript
const variance = EnhancedRabService.calculateVarianceAnalysis(
  rabItem.volume * rabItem.hargaSatuan, // budgeted
  actualSpent,
  plannedDays,
  actualDays
);
// Store in rabItem.budgetVariance
```

**3. Price Escalation Forecasting:**
```typescript
const futurePrice = EnhancedRabService.calculatePriceEscalation(
  rabItem.hargaSatuan,
  8.5, // 8.5% annual escalation
  12,  // 12 months ahead
  marketFactors
);
```

### Views Using RAB/AHSP

- `EnhancedRabAhspView.tsx` - Main RAB management interface
- `RabApprovalWorkflowView.tsx` - RAB approval process
- `CostControlDashboardView.tsx` - Cost analytics dashboard
- `StrategicCostView.tsx` - Strategic cost planning

### Permissions

```typescript
'view_rab'    // Read-only access
'edit_rab'    // Create/update RAB items
'approve_rab' // Approve RAB changes (restricted)
```

## Integration Points

- **Firebase:** Authentication, Firestore database, Cloud Storage, Cloud Functions
- **Gemini AI:** AI assistant chat (`AiAssistantChat.tsx`) - requires `GEMINI_API_KEY` in `.env.local`
- **Sentry:** Error tracking and performance monitoring
- **Google Analytics 4:** User analytics and event tracking
- **Vite PWA:** Progressive Web App support (temporarily disabled)

## Monitoring & Analytics Patterns

### Sentry Error Tracking (`@/config/sentry.config.ts`)

**Initialization:**
```typescript
import { initializeSentry, setSentryUser } from '@/config/sentry.config';

// In App.tsx useEffect
initializeSentry(); // Auto-configured from env vars

// Set user context on login
setSentryUser({
  id: currentUser.id,
  email: currentUser.email,
  username: currentUser.name,
  role: currentUser.roleId,
});
```

**Manual Error Capture:**
```typescript
import { captureSentryException, captureSentryMessage, addSentryBreadcrumb } from '@/config/sentry.config';

// Capture exception with context
captureSentryException(error, { projectId, action: 'createRAB' });

// Add breadcrumb for debugging
addSentryBreadcrumb('user_action', 'User clicked save button', 'info', { formData });

// Capture message
captureSentryMessage('Unusual API response received', 'warning', { responseCode: 429 });
```

**Environment Variables:**
- `VITE_SENTRY_DSN` - Sentry project DSN (required for production)
- `VITE_SENTRY_ENABLED=true` - Force enable in development

**Key Features:**
- **Session Replay:** 10% of normal sessions, 100% of error sessions
- **Performance Monitoring:** 20% sampling in production
- **Privacy:** `maskAllText: true`, `blockAllMedia: true`
- **Error Filtering:** Ignores browser extensions, network errors, ResizeObserver

### Google Analytics 4 (`@/config/ga4.config.ts`)

**Initialization:**
```typescript
import { initializeGA4, trackPageView, setGA4UserId } from '@/config/ga4.config';

// In App.tsx useEffect
initializeGA4();

// Set user ID on login
setGA4UserId(currentUser.id);

// Track page views
trackPageView(window.location.pathname, 'Dashboard');
```

**Event Tracking:**
```typescript
import { trackEvent, ProjectEvents, TaskEvents } from '@/config/ga4.config';

// Generic event
trackEvent('RAB', 'Created', 'Earthwork', 150000);

// Predefined project events
ProjectEvents.created(projectId, 'construction');
ProjectEvents.viewed(projectId, 'construction');
ProjectEvents.updated(projectId, 'budget');

// Predefined task events
TaskEvents.created(taskId, projectId);
TaskEvents.completed(taskId, projectId);
```

**Web Vitals Tracking:**
Automatically tracks Core Web Vitals:
- **CLS** (Cumulative Layout Shift)
- **FID** (First Input Delay)
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **TTFB** (Time to First Byte)

**Environment Variables:**
- `VITE_GA4_MEASUREMENT_ID` - GA4 Measurement ID (G-XXXXXXXXXX)
- `VITE_GA4_ENABLED=true` - Force enable in development

### Monitoring Integration Pattern

**In App.tsx:**
```typescript
useEffect(() => {
  // Initialize monitoring
  initializeSentry();
  initializeGA4();

  // Set user context for both
  if (currentUser) {
    setSentryUser({ id: currentUser.id, email: currentUser.email });
    setGA4UserId(currentUser.id);
  }

  return () => {
    clearSentryUser(); // Clear on logout
  };
}, [currentUser]);

// Track page views
useEffect(() => {
  trackPageView(window.location.pathname);
}, [location.pathname]);
```

## Firebase Cloud Functions Patterns

### Function Structure (`functions/src/index.ts`)

All sensitive operations moved to Cloud Functions for security:
- Password management (change, history)
- AI insight generation (Gemini API calls)
- OCR processing
- Digital signatures

**Callable Function Pattern:**
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const myFunction = functions.https.onCall(async (data, context) => {
  // 1. Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { param1, param2 } = data;

  // 2. Input validation
  if (!param1) {
    throw new functions.https.HttpsError('invalid-argument', 'param1 is required');
  }

  // 3. Permission check
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  // 4. Business logic
  try {
    const result = await performOperation(param1, param2);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error:', error);
    throw new functions.https.HttpsError('internal', 'Operation failed');
  }
});
```

### Available Cloud Functions

**1. Password Management:**
```typescript
// changePassword(currentPassword, newPassword)
// - Validates password strength (8+ chars, uppercase, lowercase, number, special)
// - Checks password history (last 5 passwords)
// - Updates Firebase Auth and Firestore

// getPasswordHistory(userId)
// - Returns sanitized password change history
// - Admin-only or owner access
```

**2. AI Insight Generation:**
```typescript
// generateAiInsight(projectId, geminiApiKey)
// - Analyzes project data (RAB, expenses, reports, inventory)
// - Calls Gemini API with project context
// - Stores AI insight in project document
```

**3. Digital Signatures:**
```typescript
// createDigitalSignature(documentId, documentVersionId, signerInfo, signatureType)
// - Creates cryptographic signature for document
// - Stores signature metadata in Firestore

// verifyDigitalSignature(signatureData, certificate)
// - Verifies signature authenticity
// - Returns validation result
```

**4. OCR Processing:**
```typescript
// processOCR(imageData, mimeType)
// - Extracts text from images
// - Logs OCR operations
// - Returns extracted text with confidence score
```

### Calling Functions from Client

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Call changePassword function
const changePassword = httpsCallable(functions, 'changePassword');
const result = await changePassword({ 
  currentPassword: 'old123', 
  newPassword: 'New@Pass123' 
});

// Call generateAiInsight
const generateAiInsight = httpsCallable(functions, 'generateAiInsight');
const insight = await generateAiInsight({ 
  projectId: 'proj123', 
  geminiApiKey: apiKey 
});
```

### Deployment

```powershell
.\deploy-functions.ps1  # Builds TypeScript and deploys all functions
```

**Environment:** Node.js 20  
**Dependencies:** firebase-admin, firebase-functions, bcryptjs, @google/generative-ai

## Key Documentation

- `DESIGN_SYSTEM_GUIDE.md` - Component library and design tokens
- `FORM_VALIDATION_STANDARDIZATION_COMPLETE.md` - Validation patterns
- `ERROR_BOUNDARY_IMPLEMENTATION_COMPLETE.md` - Error handling
- `ENTERPRISE_DESIGN_SYSTEM_COMPLETE.md` - Component inventory
- `SECURITY_IMPLEMENTATION_README.md` - Security best practices
- `firebaseConfig.ts` - Firebase setup and configuration

## Troubleshooting

**"Missing or insufficient permissions"** → Use `waitForAuth()` before Firestore queries  
**400 Bad Request errors** → Clear IndexedDB cache, disable persistence temporarily  
**Build errors** → Run `npm run type-check` and `npm run lint:fix`  
**Deployment issues** → Use PowerShell scripts (`deploy-*.ps1`) instead of manual commands  
**Sentry not capturing errors** → Check `VITE_SENTRY_DSN` in `.env.local`  
**GA4 not tracking** → Check `VITE_GA4_MEASUREMENT_ID` in `.env.local`  
**Cloud Functions errors** → Check logs with `firebase functions:log`

---

**Last Updated:** November 12, 2025  
**Maintained by:** Development Team  
Update this file as architecture evolves. See referenced docs for detailed patterns.
