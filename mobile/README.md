# NataCarePM Mobile App

Enhanced mobile experience for construction project management.

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry point
├── package.json            # Mobile app dependencies
├── tsconfig.json           # TypeScript configuration
├── babel.config.js         # Babel configuration
├── src/
│   ├── screens/            # Screen components
│   │   ├── index.ts        # Screens export
│   │   ├── LoginScreen.tsx # Authentication screen
│   │   ├── DashboardScreen.tsx # Main dashboard
│   │   ├── ProjectsScreen.tsx # Projects overview
│   │   └── ...             # Additional screens
│   ├── components/         # Reusable UI components
│   ├── navigation/         # Navigation configuration
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   └── assets/             # Images, icons, etc.
```

## Getting Started

1. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on specific platforms:
   ```bash
   npm run android
   npm run ios
   npm run web
   ```

## Features

- Cross-platform mobile experience (iOS, Android, Web)
- Native performance with React Native
- Intuitive navigation and user interface
- Offline capabilities with local data storage
- Real-time synchronization with backend services
- Push notifications for project updates
- Biometric authentication support
- Camera integration for document capture
- GPS location tracking for field reports

## Architecture

The mobile app follows a modular architecture with clear separation of concerns:

- **Screens**: Top-level views that represent different sections of the app
- **Components**: Reusable UI elements
- **Navigation**: Routing and navigation logic
- **Hooks**: Custom React hooks for business logic
- **Utils**: Helper functions and utilities
- **Assets**: Static resources like images and icons

## Dependencies

Key technologies used in the mobile app:

- React Native
- Expo
- React Navigation
- React Native Paper (UI components)
- Firebase (Authentication, Firestore, Storage)
- TensorFlow.js (On-device ML)
- Tesseract.js (OCR)
- Redux Toolkit (State management)

## Development Workflow

1. Create feature branches from `develop`
2. Follow TypeScript best practices
3. Write unit tests for new functionality
4. Use ESLint and Prettier for code formatting
5. Submit pull requests for code review
6. Ensure all tests pass before merging

## Deployment

The mobile app can be deployed to:

- Apple App Store
- Google Play Store
- Web (Progressive Web App)