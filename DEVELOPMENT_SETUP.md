# Development Setup Guide - NataCarePM

## Prerequisites

### Required Software Installation

1. **Node.js** (v18.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`
   - Includes npm package manager

2. **Git** (for version control)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **VS Code** (recommended IDE)
   - Download from: https://code.visualstudio.com/
   - Install recommended extensions (see below)

## Project Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/NataCarePM.git
cd NataCarePM

# Install dependencies
npm install

# Install additional type definitions
npm install --save-dev @types/react @types/react-dom
```

### 2. Environment Configuration

Create `.env.local` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# AI Assistant Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Storage
5. Copy configuration to `.env.local`

### 4. Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

## VS Code Extensions (Recommended)

Install these extensions for optimal development experience:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

## Troubleshooting

### TypeScript Issues

If you encounter TypeScript compilation errors:

1. **Missing React types**: Install type definitions
   ```bash
   npm install --save-dev @types/react @types/react-dom
   ```

2. **Module resolution errors**: Ensure proper imports
   ```typescript
   // Correct import syntax
   import * as React from 'react';
   import { useState, useEffect } from 'react';
   ```

3. **Build errors**: Check tsconfig.json configuration
   - Ensure `skipLibCheck: true`
   - Verify `jsx: "react-jsx"`
   - Check include/exclude paths

### Development Server Issues

1. **Port conflicts**: Change port in vite.config.ts
   ```typescript
   server: {
     port: 3001
   }
   ```

2. **Hot reload not working**: Restart development server
   ```bash
   npm run dev
   ```

### Firebase Connection Issues

1. **Authentication errors**: Verify Firebase config
2. **Firestore permissions**: Check security rules
3. **API key issues**: Regenerate keys in Firebase console

## Project Structure

```
NataCarePM/
├── src/
│   ├── api/              # API service functions
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── views/           # Main application views
├── public/              # Static assets
├── .env.local          # Environment variables
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite build configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Getting Help

1. Check this guide for common issues
2. Review error messages in VS Code terminal
3. Consult the main README.md for feature documentation
4. Check Firebase console for backend issues

## Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all API keys
- Review Firebase security rules regularly
- Keep dependencies updated for security patches

---

Last updated: January 2025
```