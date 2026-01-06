# Logger Usage Guide

## Overview

This project has a centralized logging utility to control what gets logged in development vs production.

**Location:** `frontend/web-app/client/src/lib/logger.ts`

## Available Functions

### Development-only Logging (recommended for most cases)

```typescript
import { devLog, devWarn, devError } from '@/lib/logger';

// Logs only in development
devLog('Debug info:', data);
devWarn('Something might be wrong:', warning);
devError('Error occurred:', error);
```

### Production Logging (use sparingly)

```typescript
import { prodError, prodWarn } from '@/lib/logger';

// Logs in both dev and production
prodError('Critical error that needs monitoring:', error);
prodWarn('Non-critical issue to monitor:', warning);
```

## When to Use Each

### ✅ Use `devError()` for:
- Caught exceptions in try-catch blocks (API errors, parsing errors, etc.)
- Development debugging
- Non-critical errors that don't need production monitoring
- **Most error logging should use this**

### ✅ Use `prodError()` for:
- Critical application failures that need monitoring
- Security-related errors
- Data corruption issues
- Errors that require immediate attention

### ✅ Use `devWarn()` for:
- Deprecation warnings
- Non-breaking issues during development
- Missing optional features

### ✅ Use `prodWarn()` for:
- Non-critical issues that should be monitored in production
- Feature degradation warnings
- Performance warnings

### ✅ Use `devLog()` for:
- General debugging information
- State changes during development
- Flow tracking

## Migration Guide

### ❌ Before (avoid this):

```typescript
// Direct console.* calls
console.error('Failed to load:', error);
console.log('Debug:', data);

// Manual if checks (verbose)
if (import.meta.env.DEV) {
  console.error('Error:', error);
}
```

### ✅ After (recommended):

```typescript
import { devError, devLog } from '@/lib/logger';

// Clean, one-line calls
devError('Failed to load:', error);
devLog('Debug:', data);
```

## Examples

### API Error Handling
```typescript
try {
  const response = await api.fetchData();
  return response;
} catch (error) {
  devError('Failed to fetch data:', error); // Dev only
  toast.error('Failed to load data'); // User-facing
  throw error;
}
```

### LocalStorage Parsing
```typescript
try {
  return JSON.parse(stored);
} catch (error) {
  devError('Failed to parse localStorage:', error);
  localStorage.removeItem(key); // Clean up
  return defaultValue;
}
```

### Critical Production Errors
```typescript
try {
  await saveUserData(data);
} catch (error) {
  prodError('CRITICAL: Failed to save user data:', error); // Needs monitoring
  toast.error('Failed to save. Please try again.');
}
```

## TODO: Places to Update

The following files still use direct `console.*` calls and should be migrated:

### High Priority (user-facing errors)
- `src/contexts/AuthContext.tsx` - Token refresh errors
- `src/api/client.ts` - API interceptor errors (if any)

### Medium Priority (feature errors)
- `src/pages/TaskDetail.tsx`
- `src/pages/TasksProgress.tsx`
- `src/pages/Projects.tsx`
- `src/components/tasks/TaskDetailDialog.tsx`
- `src/components/tasks/AttachmentUpload.tsx`

### Low Priority (admin/debug)
- `src/pages/ResetPassword.tsx` (has debug console.log calls)
- `src/pages/SystemAdmin.tsx`
- `src/pages/admin/OrganizationsList.tsx`

## Benefits

✅ **Cleaner Code** - No more `if (import.meta.env.DEV)` checks everywhere
✅ **Centralized Control** - Easy to change logging behavior globally
✅ **Production-Ready** - Clean console in production by default
✅ **Better DX** - Clear semantic names (`devError` vs `prodError`)
✅ **Maintainable** - Easy to add features like remote logging later

## Future Enhancements

The logger can be extended to support:
- Remote error tracking (Sentry, LogRocket, etc.)
- Log levels (DEBUG, INFO, WARN, ERROR)
- Structured logging
- Performance tracking
- User session context

Example:
```typescript
// Future: Add remote tracking
export const prodError = (...args: any[]) => {
  console.error(...args);
  // Send to error tracking service
  Sentry.captureException(args[0]);
};
```
