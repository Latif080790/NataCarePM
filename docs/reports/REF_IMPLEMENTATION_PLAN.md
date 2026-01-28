# NataCarePM Refactoring & Consolidation Plan

## Goal Description
To transform the current "Transitional Enterprise" state of NataCarePM into a truly robust, maintainable Enterprise system. This involves eliminating high technical debt caused by duplicate "Pro" components, split service layers (`api` vs `services`), and mock backend implementations. The goal is NOT a rewrite, but an aggressive consolidation and refactoring.

## Proposed Changes

### 1. Codebase Hygiene (Immediate Cleanup)
Remove noise to see the actual architecture clearly.
- **Delete**: Recursive `node_modules` in subfolders if not needed.
- **Delete**: `*.backup`, `*.old`, `*.orig` files throughout `src`.
- **Clean Root**: specific consolidation of the 100+ markdown report files into `docs/reports`.
- **Archive**: Move unused root files to `_archived` or delete.

### 2. Frontend Component Consolidation
**Problem**: Two sets of UI components exist (Standard & Pro).
**Solution**:
1.  **Analyze**: Compare `Component` vs `ComponentPro`.
2.  **Merge**:
    -   If `Pro` is effectively a superset: Rename `Component.tsx` to `Component.legacy.tsx` (temp), Rename `ComponentPro.tsx` to `Component.tsx`.
    -   Update all imports of `ComponentPro` to `Component`.
    -   Fix props interface in `Component` to support legacy usage if possible, or refactor usages.
3.  **Target Components**:
    -   `Button` / `ButtonPro`
    -   `Card` / `CardPro`
    -   `Table` / `TablePro`
    -   `Input` / `InputPro`
    -   `Badge` / `BadgePro`

### 3. View/Page Standardization
**Problem**: Logic Split between `View` and `ViewPro`.
**Solution**:
-   Adhere to a strict Single View Policy per route.
-   Refactor `App.tsx` routes to point to the consolidated views.
-   **Split Monoliths**: Extract sub-components from huge views like `EnterpriseRabDashboard.tsx` into `src/features/rab/components/`.

### 4. Service Layer Unification
**Problem**: Logic exists in both `src/api` (often raw axios/fetch calls) and `src/services` (business logic).
**Solution**:
-   **Pattern**: Repository/Service pattern.
-   **Consolidation**:
    -   Move everything to `src/services`.
    -   `authService` (frontend) should only handle token management and UI state.
    -   Actual API calls should be standardized.
-   **Action**:
    -   Audit `src/api/authService.ts` vs `src/services/authService.ts`. Merge into `src/services/auth.service.ts`.
    -   Remove `src/api` folder once empty.

### 5. Backend Implementation (Firebase Functions)
**Problem**: Mock logic in `functions/src/index.ts`.
**Solution**:
-   **OCR**: Implement `generateAiInsight` using actual Google Generative AI SDK (already in dependencies).
-   **Auth**: Ensure `changePassword` uses Admin SDK correctly and isn't relying on client-side constraints alone.

## Verification Plan

### Automated Tests
-   Run `npm run test` to capture regressions during component merging.
-   Run `npm run build` frequently to catch broken imports.

### Manual Verification
-   **Smoke Test**: Login -> Dashboard -> Project List -> Open Project.
-   **UI Check**: Verify that buttons, cards, and tables render correctly after "Pro" merge.
