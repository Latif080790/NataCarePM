# 🚀 Setup Guide - NataCarePM

**Version:** 2.0  
**Last Updated:** October 16, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Firebase Setup](#firebase-setup)
5. [Development Commands](#development-commands)
6. [VS Code Configuration](#vs-code-configuration)
7. [Troubleshooting](#troubleshooting)
8. [Data Migration](#data-migration)

---

## 🎯 Prerequisites

### **Required Software**

#### 1. **Node.js** (v18.0.0 or higher)

```bash
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 8.0.0 or higher
```

**Recommended:** Use Node Version Manager (nvm)

```bash
# Install nvm (Linux/Mac)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install nvm (Windows)
# Download from: https://github.com/coreybutler/nvm-windows

# Install and use Node 18
nvm install 18
nvm use 18
```

#### 2. **Git** (for version control)

```bash
# Download from: https://git-scm.com/

# Verify installation
git --version  # Should show 2.30.0 or higher
```

#### 3. **Code Editor - VS Code** (recommended)

```bash
# Download from: https://code.visualstudio.com/
```

### **Optional Tools**

- **Firebase CLI** (for deployment)

  ```bash
  npm install -g firebase-tools
  firebase --version
  ```

- **Postman** (for API testing)
  - Download from: https://www.postman.com/

---

## 📦 Installation

### **Step 1: Clone Repository**

```bash
# HTTPS
git clone https://github.com/your-org/NataCarePM.git

# SSH (recommended)
git clone git@github.com:your-org/NataCarePM.git

# Navigate to project
cd NataCarePM
```

### **Step 2: Install Dependencies**

```bash
# Install all dependencies
npm install

# Or using yarn
yarn install

# Or using pnpm
pnpm install
```

**Expected output:**

```
added 1247 packages, and audited 1248 packages in 45s

236 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### **Step 3: Verify Installation**

```bash
# Check for node_modules folder
ls -la node_modules  # Linux/Mac
dir node_modules     # Windows

# Verify key packages
npm list react react-dom typescript vite
```

---

## ⚙️ Environment Configuration

### **Step 1: Create Environment File**

```bash
# Create .env.local file in project root
touch .env.local     # Linux/Mac
type nul > .env.local  # Windows PowerShell
```

### **Step 2: Configure Environment Variables**

Edit `.env.local` with your configuration:

```env
# ============================================
# FIREBASE CONFIGURATION
# ============================================
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================
# AI ASSISTANT CONFIGURATION
# ============================================
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX

# ============================================
# APPLICATION CONFIGURATION
# ============================================
VITE_APP_NAME=NataCarePM
VITE_APP_VERSION=2.0.0
VITE_APP_ENV=development

# ============================================
# OPTIONAL: ANALYTICS & MONITORING
# ============================================
# VITE_ANALYTICS_ID=your-analytics-id
# VITE_SENTRY_DSN=your-sentry-dsn
```

### **Step 3: Environment Variable Reference**

| Variable                            | Required    | Description                  |
| ----------------------------------- | ----------- | ---------------------------- |
| `VITE_FIREBASE_API_KEY`             | ✅ Yes      | Firebase API key             |
| `VITE_FIREBASE_AUTH_DOMAIN`         | ✅ Yes      | Firebase auth domain         |
| `VITE_FIREBASE_PROJECT_ID`          | ✅ Yes      | Firebase project ID          |
| `VITE_FIREBASE_STORAGE_BUCKET`      | ✅ Yes      | Firebase storage bucket      |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ Yes      | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID`              | ✅ Yes      | Firebase app ID              |
| `VITE_GEMINI_API_KEY`               | ✅ Yes      | Google Gemini AI API key     |
| `VITE_FIREBASE_MEASUREMENT_ID`      | ⚠️ Optional | Google Analytics ID          |

**Important:** Never commit `.env.local` to version control!

---

## 🔥 Firebase Setup

### **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `natacare-pm` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create Project"

### **Step 2: Register Web App**

1. In Firebase Console, click "Add app" → Web icon (</>)
2. Enter app nickname: "NataCarePM Web"
3. Check "Also set up Firebase Hosting"
4. Click "Register app"
5. Copy configuration values to `.env.local`

### **Step 3: Enable Authentication**

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. (Optional) Enable Google, Microsoft, etc.
4. Click "Save"

### **Step 4: Create Firestore Database**

1. Go to **Firestore Database** → **Create database**
2. Select **Start in test mode** (for development)
3. Choose location (closest to users)
4. Click "Enable"

### **Step 5: Configure Firestore Security Rules**

```bash
# Deploy security rules from project
firebase deploy --only firestore:rules

# Or manually copy from firestore.rules file
```

**Production-ready rules are in:** `firestore.rules`

### **Step 6: Enable Storage**

1. Go to **Storage** → **Get started**
2. Start in **test mode**
3. Choose location (same as Firestore)
4. Click "Done"

### **Step 7: Deploy Storage Rules**

```bash
# Deploy storage rules
firebase deploy --only storage

# Or manually copy from storage.rules file
```

**Production-ready rules are in:** `storage.rules`

### **Step 8: Get Gemini API Key**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy key to `.env.local` → `VITE_GEMINI_API_KEY`

---

## 🚀 Development Commands

### **Start Development Server**

```bash
# Start dev server (default port: 5173)
npm run dev

# Start on specific port
npm run dev -- --port 3000

# Start with host exposed (for network access)
npm run dev -- --host
```

**Output:**

```
  VITE v5.0.0  ready in 823 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
  ➜  press h to show help
```

Open browser to: `http://localhost:5173`

### **Build for Production**

```bash
# Create production build
npm run build

# Output will be in dist/ folder
ls -la dist/
```

**Expected output:**

```
dist/index.html                 0.45 kB
dist/assets/index-a1b2c3d4.css  124.3 kB
dist/assets/index-e5f6g7h8.js   842.1 kB
```

### **Preview Production Build**

```bash
# Preview production build locally
npm run preview

# Opens at http://localhost:4173
```

### **Type Checking**

```bash
# Run TypeScript type checker
npm run type-check

# Should show: "Found 0 errors"
```

### **Code Quality**

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Format code with Prettier
npm run format
```

### **Testing**

```bash
# Run test suite
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## 💻 VS Code Configuration

### **Recommended Extensions**

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "usernamehw.errorlens",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

### **Workspace Settings**

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### **Launch Configuration** (Debugging)

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

---

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Port Already in Use**

```bash
# Error: Port 5173 is already in use

# Solution 1: Kill process using port
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9

# Solution 2: Use different port
npm run dev -- --port 3000
```

#### **2. Module Not Found Errors**

```bash
# Error: Cannot find module 'react'

# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **3. TypeScript Compilation Errors**

```bash
# Error: Cannot find name 'React'

# Solution: Install type definitions
npm install --save-dev @types/react @types/react-dom
```

#### **4. Firebase Connection Issues**

```bash
# Error: Firebase: Error (auth/invalid-api-key)

# Solution: Verify .env.local configuration
# - Check all VITE_FIREBASE_* variables
# - Ensure no trailing spaces
# - Restart dev server after changing .env.local
```

#### **5. Vite Build Errors**

```bash
# Error: Build failed with errors

# Solution: Clean and rebuild
npm run clean  # If clean script exists
rm -rf dist
npm run build
```

#### **6. Hot Reload Not Working**

```bash
# Solution: Restart dev server
# Press Ctrl+C to stop
npm run dev
```

---

## 📊 Data Migration

### **Initial Setup with Real Data**

If you need to migrate existing project data:

#### **Step 1: Prepare Data**

Create `data-migration/projects.json`:

```json
{
  "projects": [
    {
      "name": "Project Alpha",
      "code": "PRJ-001",
      "status": "active",
      "budget": 1000000
    }
  ]
}
```

#### **Step 2: Run Migration Script**

```bash
# Run data migration
node scripts/setup-real-data.js

# Or if using npm script
npm run migrate:data
```

#### **Step 3: Verify Data**

1. Login to application
2. Check Projects page
3. Verify data integrity

### **Backup Existing Data**

```bash
# Backup Firestore data
firebase firestore:export gs://your-bucket/backups/$(date +%Y%m%d)

# Restore from backup
firebase firestore:import gs://your-bucket/backups/20251016
```

---

## ✅ Verification Checklist

Before starting development, verify:

- [ ] Node.js v18+ installed
- [ ] Git installed
- [ ] VS Code installed with extensions
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created and configured
- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Firebase Authentication enabled
- [ ] Storage enabled
- [ ] Gemini API key configured
- [ ] Dev server starts successfully
- [ ] Can login to application
- [ ] No TypeScript errors
- [ ] Build completes successfully

---

## 🎓 Next Steps

After successful setup:

1. **Understand Architecture** → Read [Architecture Guide](ARCHITECTURE.md)
2. **Learn Deployment** → Read [Deployment Guide](DEPLOYMENT.md)
3. **Review Security** → Read [Security Guide](SECURITY.md)
4. **Start Development** → Create feature branch and start coding!

---

## 📞 Getting Help

If you encounter issues:

1. Check this troubleshooting section
2. Review error messages carefully
3. Search [GitHub Issues](https://github.com/your-org/NataCarePM/issues)
4. Check Firebase Console for backend errors
5. Create new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Setup Guide Version:** 2.0  
**Last Updated:** October 16, 2025  
**Next Review:** January 2026

**Status:** ✅ Ready for use
