# Firestore Rules - Error Fix

**Date:** November 19, 2025  
**Issue:** "Missing or insufficient permissions" errors on login  
**Status:** ✅ FIXED

## Problem

Production rules (`firestore.rules.clean`) terlalu ketat dan memblokir operasi dasar seperti:
- User registration (create user document)
- User profile read (first login)
- Project member checks
- Notification access

## Solution

Created `firestore.rules.balanced` dengan security yang balanced:

### Key Changes:

**1. User Collection - Allow Registration**
```javascript
// BEFORE (too strict):
allow create: if isValidUserData() && hasRequiredFields(...) && isNotRateLimited();

// AFTER (balanced):
allow create: if isAuthenticated() && request.auth.uid == userId;
```

**2. User Profile - Allow Read Own Data**
```javascript
// BEFORE: Complex validation
// AFTER: Simple ownership check
allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
```

**3. User Updates - Allow Profile Fields**
```javascript
allow update: if isAuthenticated() && isOwner(userId) &&
                 request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['name', 'phone', 'photoURL', 'updatedAt']);
// Prevents changing roleId, email, or other sensitive fields
```

**4. Project Creation - Allow Authenticated Users**
```javascript
// BEFORE: Required extensive validation
// AFTER: Any authenticated user can create project
allow create: if isAuthenticated();
```

**5. Project Subcollections - Simplified Access**
```javascript
// All project subcollections:
allow read: if isProjectMember(projectId);
allow write: if isProjectMember(projectId) || isAdmin();
// Simple and consistent
```

## Security Features Maintained:

✅ **Authentication Required** - All operations require login  
✅ **Project Membership** - Users can only access their projects  
✅ **Audit Log Immutability** - auditLog is create-only  
✅ **Admin Privileges** - Admins have override access  
✅ **Field-Level Protection** - Users can't change roleId/email  
✅ **Deny-by-Default** - Unknown paths are blocked  

## Deployment

```powershell
Copy-Item firestore.rules.balanced firestore.rules
firebase deploy --only firestore:rules --project natacara-hns
```

**Result:**
```
✅ cloud.firestore: rules file compiled successfully
✅ firestore: released rules to cloud.firestore
✅ Deploy complete!
```

## Testing

1. Open: https://natacara-hns.web.app/login
2. Login with credentials
3. Should see dashboard without permission errors
4. Check browser console - no Firestore errors

## Rules File Comparison

| File | Security Level | Use Case |
|------|---------------|----------|
| `firestore.rules` (original) | ⚠️ DEBUG | Development only - TOO OPEN |
| `firestore.rules.clean` | 🔒 MAXIMUM | Enterprise - TOO STRICT for current app |
| `firestore.rules.balanced` | ✅ BALANCED | **Production - RECOMMENDED** |

## What Was Removed vs firestore.rules.clean:

- ❌ Rate limiting checks (isNotRateLimited)
- ❌ Complex field validation (isValidUserData)
- ❌ Extensive required fields checks
- ❌ Role-specific subcollection access (simplified to member check)

## What Was Added vs Original Debug Rules:

- ✅ Project membership validation
- ✅ Owner/admin checks
- ✅ Field-level update restrictions
- ✅ Immutable audit logs
- ✅ Deny-by-default policy

## Next Steps

Once app is stable with balanced rules:
1. Monitor Firestore usage/abuse patterns
2. Add rate limiting if needed (gradual implementation)
3. Add field validation for critical collections
4. Consider role-based access for sensitive operations

**Current Status: Production-ready with balanced security** ✅
