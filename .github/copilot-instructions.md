# Copilot Instructions for NataCarePM

## Project Overview
NataCarePM is a React + TypeScript application for project management, featuring dashboards, reporting, document uploads, and AI-powered chat. The architecture is modular, with clear separation between views, components, contexts, hooks, and API services.

## Key Structure
- **Entry Points:** `index.tsx`, `App.tsx`
- **Views:** All main pages are in `views/` (e.g., `DashboardView.tsx`, `ReportView.tsx`).
- **Components:** Reusable UI elements in `components/` (e.g., `Card.tsx`, `Modal.tsx`, `Sidebar.tsx`).
- **Contexts:** Global state via React Context in `contexts/` (e.g., `AuthContext.tsx`, `ProjectContext.tsx`).
- **API:** Service functions for backend/data in `api/` (e.g., `projectService.ts`).
- **Hooks:** Custom React hooks in `hooks/` (e.g., `useProjectData.ts`).
- **Config:** Firebase config in `firebaseConfig.ts`.

## Developer Workflow
- **Install:** `npm install`
- **Run:** `npm run dev` (Vite dev server)
- **Environment:** Set `GEMINI_API_KEY` in `.env.local` for AI features
- **No formal test suite** detected; manual testing via UI is typical

## Patterns & Conventions
- **TypeScript:** All logic and components use strict typing (`types.ts` for shared types)
- **Context Usage:** Use React Context for auth, toast, and project state
- **Component Props:** Pass props explicitly, avoid implicit state
- **Data Flow:** API services fetch/update data, contexts manage state, views render UI
- **AI Integration:** `AiAssistantChat.tsx` uses Gemini API (see `firebaseConfig.ts` and `.env.local`)
- **Charts:** Chart components (e.g., `GaugeChart.tsx`, `LineChart.tsx`) visualize project metrics
- **Modals:** Modal components for forms and details (e.g., `CreatePOModal.tsx`, `PODetailsModal.tsx`)

## Integration Points
- **Firebase:** Used for backend data and authentication
- **Gemini API:** For AI assistant features
- **Vite:** Build and serve the app

## Examples
- To add a new view, create a file in `views/`, import components as needed, and update routing in `App.tsx`
- To add a new API service, add to `api/`, type responses in `types.ts`, and use in contexts/hooks
- To extend global state, add a new context in `contexts/` and wrap `App.tsx`

## References
- `README.md` for setup
- `firebaseConfig.ts` for backend config
- `.env.local` for secrets

---
Update this file as new conventions or workflows emerge. For questions, review the referenced files and follow existing patterns.
