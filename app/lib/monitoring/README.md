# Error Monitoring

This project uses Rollbar for error monitoring, with an abstracted interface that could support other providers in the future.

## Setup

1. Get a Rollbar access token from [Rollbar](https://rollbar.com)
2. Add the token to your `.env` file:

```env
ROLLBAR_ACCESS_TOKEN=your_token_here
```

## Enabling/Disabling

- To enable monitoring: Add the `ROLLBAR_ACCESS_TOKEN` to your `.env`
- To disable monitoring: Comment out or remove the `ROLLBAR_ACCESS_TOKEN` from your `.env`

## Testing

Visit `/debug/monitoring` to test various monitoring features:

1. Error Boundary Testing

   - Click "Trigger Error Boundary" to test React error boundaries
   - The error will be caught and displayed with a fallback UI

2. Direct Error Testing

   - "Trigger Uncaught Error" - Throws an uncaught error
   - "Trigger Async Error" - Tests async error handling
   - "Trigger API Error" - Tests API error handling

3. Message Testing

   - "Send Error Message" - Sends a test error
   - "Send Warning Message" - Sends a test warning
   - "Send Info Message" - Sends a test info message

4. User Context Testing

   - "Set Regular User" - Sets a test user context
   - "Set Admin User" - Sets an admin test user context
   - "Clear User" - Removes user context

5. Breadcrumb Testing
   - "Add Breadcrumb" - Adds a test breadcrumb to track user actions

## Usage in Code

### Error Boundaries

```tsx
import { ErrorBoundary } from "~/lib/monitoring";

function MyComponent() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}
```

### Manual Error Logging

```tsx
import { useMonitor } from "~/lib/monitoring";

function MyComponent() {
  const monitor = useMonitor();

  try {
    // Some risky operation
  } catch (error) {
    monitor.error("Operation failed", error);
  }
}
```

### User Context

```tsx
import { useMonitor } from "~/lib/monitoring";

function MyComponent() {
  const monitor = useMonitor();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      monitor.setUser({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    }
  }, [user]);
}
```

### Breadcrumbs

```tsx
import { useMonitor } from "~/lib/monitoring";

function MyComponent() {
  const monitor = useMonitor();

  const handleImportantAction = () => {
    monitor.breadcrumb("User started important action", {
      timestamp: new Date().toISOString(),
      metadata: {
        /* additional context */
      },
    });
    // ... rest of the action
  };
}
```

## Architecture

The monitoring setup is designed to be provider-agnostic:

1. `types.ts` - Defines the monitoring interface
2. `hooks.ts` - Provides React hooks for monitoring
3. `rollbar.ts` - Implements the interface using Rollbar
4. `MonitoringProvider.tsx` - Provides monitoring context
5. `index.ts` - Exports the public API

This abstraction allows for:

- Easy testing with the debug page
- Potential future provider swapping
- Consistent monitoring API across the application
- Safe SSR handling
- Environment-aware configuration
