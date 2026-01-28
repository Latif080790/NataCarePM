# NataCarePM Consolidation & Refactoring Roadmap

- [x] **Phase 1: Codebase Hygiene & Cleanup**
    - [x] Audit and remove backup files (`.backup`, `.old`, `.orig`)
    - [x] Remove unused/duplicate configuration files (`.env.template` vs example)
    - [x] Clean up root directory (move old reports to `docs/reports`)
    - [x] Standardize project root structure
    - [x] Organize test files into dedicated `__tests__` directories

- [ ] **Phase 2: UI/UX Component Unification (The "Pro" Merge)**
    - [ ] Inventory all "Pro" vs Standard component pairs (e.g., `Button.tsx` vs `ButtonPro.tsx`)
    - [ ] **Merge Strategy**: Promote "Pro" versions to be the new Standard
        - [ ] `ButtonPro` -> `Button`
        - [ ] `CardPro` -> `Card`
        - [ ] `TablePro` -> `Table`
    - [ ] Refactor all import references to point to the new unified components
    - [ ] Verify Mobile Layout compatibility after merge

- [ ] **Phase 3: View/Page Consolidation**
    - [ ] Audit View duplications (e.g., `AttendanceView` vs `AttendanceViewPro`)
    - [ ] Select best version (usually Pro) and consolidate into single View file
    - [ ] Break down Monolithic Views (e.g., `EnterpriseRabDashboard.tsx`) into smaller sub-components
    - [ ] Update `App.tsx` routes to use unified Views

- [ ] **Phase 4: Architecture & Service Layer Consolidation**
    - [ ] **Audit `src/api` vs `src/services`**
        - [ ] Identify overlapping services (e.g., `authService`)
        - [ ] Create unified Service Layer in `src/services` (Single Source of Truth)
    - [ ] Refactor Frontend to consume ONLY from unified `src/services`
    - [ ] Remove legacy `src/api` folder after migration
    - [ ] Standardize Error Handling across services

- [ ] **Phase 5: Backend Hardening (Firebase Functions)**
    - [ ] **Replace Mock Implementations**
        - [ ] Implement real OCR logic (Google Cloud Vision / Tesseract Backend)
    - [ ] **Security Upgrades**
        - [ ] Migrate sensitive client-side validation logic to Backend
        - [ ] Implement robust Authorization checks (RBAC) in Functions
    - [ ] **Performance**
        - [ ] Optimize cold starts

- [ ] **Phase 6: Final Verification & QA**
    - [ ] Run full Test Suite (`npm run test`)
    - [ ] Monitor build size and chunking
    - [ ] End-to-End Testing of critical User Flows (Login -> Dashboard -> Project)
