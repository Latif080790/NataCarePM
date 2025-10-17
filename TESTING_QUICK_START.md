# 🚀 QUICK START GUIDE - NataCarePM Testing

## ⚡ Quick Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- __tests__/unit

# Run with coverage
npm run test:coverage

# Watch mode (TDD)
npm run test:watch

# Type check
npm run type-check

# Lint
npm run lint:check

# Generate coverage report
.\scripts\generate-coverage.ps1  # Windows
./scripts/generate-coverage.sh   # Unix/Linux/Mac
```

## 📝 Writing Tests - Quick Examples

### Using Mock Factories
```typescript
import { createMockUser, createMockProject } from '__mocks__/testDataFactory';

// Simple
const user = createMockUser();
const project = createMockProject();

// With overrides
const admin = createMockUser({ 
  name: 'Admin', 
  roleId: 'super-admin' 
});

// Batch
const users = createMockUsers(10);
const docs = createMockDocuments(20, 'project-id');
```

### Using MSW
```typescript
import { setupMSW } from '__mocks__/server';

describe('My Tests', () => {
  setupMSW();

  test('API call', async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    expect(data).toHaveLength(3);
  });
});
```

### Complete Test Example
```typescript
import { createMockDocument } from '__mocks__/testDataFactory';

describe('DocumentService', () => {
  it('should create document with encryption', () => {
    const doc = createMockDocument({
      title: 'Secure Doc',
      encryptionStatus: {
        isEncrypted: true,
        encryptionLevel: 'end-to-end',
        algorithm: 'AES-256',
        keyId: 'key-123'
      }
    });

    expect(doc.encryptionStatus.isEncrypted).toBe(true);
  });
});
```

## 🎯 Available Mock Factories

```typescript
// User
createMockUser(overrides?)
createMockUsers(count)

// Project
createMockProject(overrides?)
createMockProjects(count)

// Task
createMockTask(overrides?)
createMockTasks(count, projectId?)

// Document
createMockDocument(overrides?)
createMockDocuments(count, projectId?)

// Purchase Order
createMockPurchaseOrder(overrides?)

// File
createMockFile(name, type, size)
```

## 📊 Coverage Thresholds

**Current**: 60% minimum for:
- Lines
- Statements
- Functions
- Branches

**Location**: `jest.config.js`

## 🔧 CI/CD Workflows

### On Pull Request
- TypeScript check
- Lint check
- Tests with coverage
- Coverage threshold (60%)
- PR comment with report
- Block merge if fails

### On Push to `develop`
- All tests
- Build
- Deploy to staging

### On Push to `main`
- All tests
- Build
- Deploy to production
- Create release

## 📁 File Structure

```
__mocks__/
  ├── firebase.ts           # Firebase mocks
  ├── testDataFactory.ts    # Mock factories
  ├── server.ts             # MSW server setup
  └── handlers/
      └── index.ts          # API handlers

__fixtures__/
  ├── users.json            # User fixtures
  ├── projects.json         # Project fixtures
  └── documents.json        # Document fixtures

__tests__/
  └── unit/
      ├── projectService.test.ts
      ├── taskService.test.ts
      ├── documentService.test.ts
      ├── userService.test.ts
      └── purchaseOrderService.test.ts
```

## ✅ Current Status

- ✅ TypeScript: 0 errors
- ✅ Unit Tests: 51 passing
- ✅ Test Suites: 5 passing
- ✅ CI/CD: Configured
- ✅ Coverage: 60% threshold set

## 🎓 Best Practices

1. **Always use mock factories** - Don't create raw objects
2. **Use setupMSW()** - For API testing
3. **Test one thing** - Keep tests focused
4. **Use descriptive names** - Clear test intentions
5. **Check coverage** - Run with --coverage flag
6. **Follow AAA pattern** - Arrange, Act, Assert

## 🆘 Troubleshooting

### Tests fail to run
```bash
npm ci  # Clean install
npm test
```

### Coverage fails
```bash
# Check threshold in jest.config.js
npm run test:coverage
```

### MSW not working
```typescript
// Add setupMSW() in test file
import { setupMSW } from '__mocks__/server';

describe('Tests', () => {
  setupMSW();
  // ... tests
});
```

## 📚 Documentation

- **Full Report**: `PHASE_1_COMPLETION_REPORT.md`
- **Jest Config**: `jest.config.js`
- **CI Workflow**: `.github/workflows/ci.yml`
- **PR Checks**: `.github/workflows/pr-checks.yml`

## 🎯 Next Steps

1. Write integration tests
2. Write component tests
3. Write hook tests
4. Increase coverage to 60%+
5. Add E2E tests

---

**Need Help?** Check `PHASE_1_COMPLETION_REPORT.md` for comprehensive documentation.
