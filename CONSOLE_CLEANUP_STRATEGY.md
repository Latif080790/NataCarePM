# Console.log Cleanup Strategy

## Overview

Replace ~400 console.log statements with proper logging utility that respects environment.

## Implementation Steps

### Phase 1: Import Logger (Manual - High Priority Files)

Replace in critical files:

```typescript
// Before:
console.log('Debug info', data);
console.error('Error occurred', error);

// After:
import { logger } from '../utils/logger';
logger.debug('Debug info', data);
logger.error('Error occurred', error);
```

### Phase 2: Automated Replacement (Bulk)

Can use find/replace with regex:

```bash
# Find: console\.log\(
# Replace: logger.debug(

# Find: console\.error\(
# Replace: logger.error(

# Find: console\.warn\(
# Replace: logger.warn(

# Find: console\.info\(
# Replace: logger.info(
```

### Phase 3: Add Import Statement

After replacement, add import to each file:

```typescript
import { logger } from './utils/logger';
// or relative path based on file location
```

## Priority Files for Manual Review

### High Priority (User-Facing):

1. `App.tsx` - Main app errors
2. `contexts/AuthContext.tsx` - Authentication
3. `contexts/ProjectContext.tsx` - Project state
4. `api/intelligentDocumentService.ts` - Document operations
5. `api/projectService.ts` - Project operations

### Medium Priority (Components):

6. `components/DocumentViewer.tsx`
7. `components/TemplateManager.tsx`
8. `components/SignatureWorkflowManager.tsx`
9. `components/TaskDetailModal.tsx`
10. `components/CreateTaskModal.tsx`

### Low Priority (Views):

11. Various view files
12. Utility files
13. Test files (can keep console.log for tests)

## Logging Level Guidelines

### debug()

- Development debugging
- Verbose operation logs
- Data inspection
- Performance metrics

### info()

- Operation success messages
- State transitions
- Important milestones

### warn()

- Deprecation notices
- Non-critical issues
- Fallback scenarios
- Missing optional data

### error()

- Exception handling
- API failures
- Critical operation failures
- User-facing errors

## Example Replacements

### Authentication

```typescript
// Before:
console.log('Login successful:', user);
console.error('Login failed:', error);

// After:
logger.info('Login successful', { userId: user.id });
logger.error('Login failed', { error: error.message });
```

### API Calls

```typescript
// Before:
console.log('Fetching documents...');
console.log('Documents fetched:', docs.length);
console.error('Failed to fetch documents:', error);

// After:
logger.debug('Fetching documents...');
logger.info('Documents fetched', { count: docs.length });
logger.error('Failed to fetch documents', { error });
```

### Component Lifecycle

```typescript
// Before:
console.log('Component mounted');
console.log('Data:', data);

// After:
logger.debug('Component mounted', { componentName: 'Dashboard' });
logger.debug('Component data', { data });
```

## Files to Keep console.log

These files can keep console.log as they are:

- `scripts/*.js` - Build scripts
- `__tests__/*.ts` - Test files
- `setup*.js` - Setup scripts

## ESLint Configuration

After cleanup, update `.eslintrc` to allow logger:

```json
{
  "rules": {
    "no-console": [
      "warn",
      {
        "allow": ["error", "warn"]
      }
    ]
  }
}
```

Or completely disable for logger usage:

```json
{
  "rules": {
    "no-console": "off"
  }
}
```

## Benefits

1. **Environment-Aware**: Automatic disable in production
2. **Structured**: Consistent logging format
3. **Extensible**: Easy to add error tracking (Sentry, etc.)
4. **Performance**: No console.log overhead in production
5. **Debugging**: Better log organization with groups/tables

## Estimated Impact

- **Console warnings**: ~400 → ~50 (scripts/tests only)
- **Code quality**: Significant improvement
- **Production performance**: Reduced console overhead
- **Debugging**: Better organized logs

## Next Steps

1. ✅ Create logger utility
2. ⏳ Replace high-priority files manually
3. ⏳ Bulk replace remaining files
4. ⏳ Add logger imports
5. ⏳ Test in development and production
6. ⏳ Update ESLint config

---

_Note: This is a systematic approach. Can be done incrementally without breaking existing functionality._
