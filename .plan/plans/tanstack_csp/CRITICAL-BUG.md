# ✅ RESOLVED: createIsomorphicFn() Broke AsyncLocalStorage Context

> **Status:** This bug has been RESOLVED in `@enalmada/start-secure` v1.0.1
>
> **Resolution Date:** January 2025
>
> **Fix:** Removed broken `createNonceGetter()` function, documented official TanStack pattern using direct context access
>
> **Migration Guide:** See `C:\Users\enalm\code\open\start-secure\docs\MIGRATION-1.0-to-1.0.1.md`
>
> **This document is kept for historical reference and technical documentation.**

---

## Summary

The `createIsomorphicFn()` wrapper in `@enalmada/start-secure` broke Node.js AsyncLocalStorage continuation chain, preventing access to TanStack Start middleware context. This rendered the `createNonceGetter()` function unusable in its current form.

## Discovery Timeline

### Initial Implementation

Following the official TanStack Router nonce support pattern from [Discussion #3028](https://github.com/TanStack/router/discussions/3028), we implemented:

```typescript
// src/nonce.ts in @enalmada/start-secure
export function createNonceGetter() {
  return createIsomorphicFn()
    .server(() => {
      const context = getStartContext();
      return context.contextAfterGlobalMiddlewares?.nonce;
    })
    .client(() => {
      const meta = document.querySelector("meta[property='csp-nonce']");
      return meta?.getAttribute("content") ?? undefined;
    });
}
```

```typescript
// src/router.tsx in tanstarter
const getNonce = createNonceGetter();

export function getRouter() {
  const router = createRouter({
    ssr: { nonce: getNonce() }
  });
  return router;
}
```

### Symptom Observed

Scripts were blocked by CSP with the following error:

```
Content-Security-Policy: The page's settings blocked an inline script (script-src-elem)
from being executed because it violates the following directive: "script-src 'nonce-XXX' 'strict-dynamic'"
```

Inspection of HTML revealed:
- CSP header contained valid nonce: `'nonce-ABC123XYZ'`
- `<meta property="csp-nonce" content="ABC123XYZ">` was present
- **All `<script>` tags were missing `nonce` attributes**

### Debug Process

Added logging to trace nonce flow:

```
[start-secure] Middleware generated nonce: Y2QxMjM0NTY3ODkwMT... ✅
[router] getRouter() called ✅
[start-secure] getNonce() called outside context (expected on first call) ❌
```

**Key Finding:** Even though `getRouter()` was being called during request handling (after middleware), `getNonce()` couldn't access the context.

## Root Cause

### AsyncLocalStorage Context Chain

TanStack Start uses Node.js AsyncLocalStorage to provide per-request context:

```typescript
// Simplified TanStack Start internals
const requestContext = new AsyncLocalStorage();

function handleRequest(req) {
  const context = { nonce: generateNonce() };

  return requestContext.run(context, async () => {
    // All code here can access context via getStartContext()
    const router = await getRouter();
    return renderApp(router);
  });
}
```

### The Problem with createIsomorphicFn()

The `createIsomorphicFn()` wrapper breaks the AsyncLocalStorage continuation:

```typescript
// This creates a NEW function scope that loses AsyncLocalStorage context
const getNonce = createIsomorphicFn()
  .server(() => {
    // ❌ Called OUTSIDE AsyncLocalStorage scope
    const context = getStartContext(); // Throws: "No Start context found"
    return context.contextAfterGlobalMiddlewares?.nonce;
  });
```

**Why it breaks:**
1. `createIsomorphicFn()` returns a new wrapper function
2. When this wrapper is called, it's in a different execution context
3. AsyncLocalStorage context is NOT inherited by the wrapper
4. `getStartContext()` fails because it can't find AsyncLocalStorage context

### Timing Analysis

The issue is NOT about when `getRouter()` is called (it's called at the correct time):

```
Request arrives
  ↓
Middleware runs (AsyncLocalStorage.run() starts)
  ↓ [CONTEXT AVAILABLE]
getRouter() called ✅ (Inside AsyncLocalStorage)
  ↓
router = createRouter({ ssr: { nonce: getNonce() } })
  ↓
getNonce() wrapper called ❌ (Wrapper breaks context chain)
  ↓
getStartContext() fails ❌ (AsyncLocalStorage context lost)
```

## Failed Fix Attempts

### Attempt 1: Try-Catch Wrapper

```typescript
export function createNonceGetter() {
  return createIsomorphicFn()
    .server(() => {
      try {
        const context = getStartContext();
        return context.contextAfterGlobalMiddlewares?.nonce;
      } catch {
        return undefined; // ❌ Hides the error, scripts still have no nonce
      }
    });
}
```

**Result:** Scripts still blocked - returned `undefined` instead of throwing.

### Attempt 2: Pass Function Reference

```typescript
export async function getRouter() {
  const router = createRouter({
    ssr: { nonce: getNonce } // Pass function instead of calling it
  });
}
```

**Result:** TanStack Start stringified the function in HTML:
```html
<script nonce="() => { const context = getStartContext()... }">
```

### Attempt 3: Use require() for Dynamic Import

```typescript
export function getRouter() {
  let nonce: string | undefined;
  if (typeof window === "undefined") {
    const { getStartContext } = require("@tanstack/start-storage-context");
    nonce = getStartContext().contextAfterGlobalMiddlewares?.nonce;
  }
  // ...
}
```

**Result:** `Error: require is not defined` (ESM module)

## Working Solution

### Implementation

Bypass the broken isomorphic wrapper entirely and access context directly:

```typescript
// src/router.tsx
export async function getRouter() {
  console.log("[router] getRouter() called");

  // Get nonce on server (client doesn't need it, uses meta tag)
  let nonce: string | undefined;
  if (typeof window === "undefined") {
    try {
      // Dynamic import for server-only code
      const { getStartContext } = await import("@tanstack/start-storage-context");
      console.log("[router] Accessing context DIRECTLY (server)");
      const context = getStartContext();
      nonce = context.contextAfterGlobalMiddlewares?.nonce;
      console.log("[router] Direct access SUCCESS, nonce:", nonce ? `${nonce.substring(0, 20)}...` : "undefined");
    } catch (error) {
      console.log("[router] Direct access FAILED:", error instanceof Error ? error.message : "unknown");
      nonce = undefined;
    }
  }

  const queryClient = new QueryClient({ /* ... */ });

  const router = createRouter({
    routeTree,
    context: { queryClient, user: undefined } as RouterContext,
    // ... other options
    ssr: {
      // Nonce retrieved at top of function (server-only)
      // Client uses meta tag automatically via TanStack Start
      nonce,
    },
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}
```

### Why This Works

1. ✅ **Direct context access** - No wrapper to break AsyncLocalStorage
2. ✅ **Async function** - Allows dynamic `import()` for server-only code
3. ✅ **Dynamic import** - Prevents Node.js code in browser bundle
4. ✅ **Server-only execution** - Client uses `<meta property="csp-nonce">` automatically
5. ✅ **Proper error handling** - Gracefully handles context access failures

### Verification

After implementing this fix:

```
[start-secure] Middleware generated nonce: Y2QxMjM0NTY3ODkwMT... ✅
[router] getRouter() called ✅
[router] Accessing context DIRECTLY (server) ✅
[router] Direct access SUCCESS, nonce: Y2QxMjM0NTY3ODkwMT... ✅
```

Browser inspection:
```html
<head>
  <meta property="csp-nonce" content="Y2QxMjM0NTY3ODkwMTIzNDU2Nzg=">
  <script nonce="Y2QxMjM0NTY3ODkwMTIzNDU2Nzg=">...</script>
  <script nonce="Y2QxMjM0NTY3ODkwMTIzNDU2Nzg=">...</script>
</head>
```

CSP violations: **0** (down from 13+ errors)

## Impact on @enalmada/start-secure

### Current State

The package exports `createNonceGetter()` that doesn't work:

```typescript
// ❌ BROKEN - Do not use
import { createNonceGetter } from '@enalmada/start-secure';

const getNonce = createNonceGetter();
const router = createRouter({
  ssr: { nonce: getNonce() } // Returns undefined
});
```

### Required Fixes

#### Option 1: Remove Isomorphic Wrapper (Recommended)

Remove `createNonceGetter()` entirely and document direct context access:

```typescript
// src/nonce.ts - Remove createNonceGetter()
// Only export generateNonce() for middleware

export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
```

**Documentation:**
```typescript
// README.md - Show users how to access nonce
import { getStartContext } from '@tanstack/start-storage-context';

export async function getRouter() {
  let nonce: string | undefined;
  if (typeof window === "undefined") {
    const { getStartContext } = await import("@tanstack/start-storage-context");
    nonce = getStartContext().contextAfterGlobalMiddlewares?.nonce;
  }

  return createRouter({
    ssr: { nonce }
  });
}
```

#### Option 2: Fix Isomorphic Wrapper

Investigate if `createIsomorphicFn()` can preserve AsyncLocalStorage context, or provide an alternative implementation that doesn't break the context chain.

**Challenges:**
- May not be possible due to how isomorphic functions work
- Would require deep understanding of TanStack Start internals
- May need upstream fix in TanStack Start itself

#### Option 3: Provide Helper Function

Instead of isomorphic wrapper, provide a simple helper:

```typescript
// src/nonce.ts
export async function getNonceFromContext(): Promise<string | undefined> {
  if (typeof window === "undefined") {
    try {
      const { getStartContext } = await import("@tanstack/start-storage-context");
      return getStartContext().contextAfterGlobalMiddlewares?.nonce;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
```

**Usage:**
```typescript
export async function getRouter() {
  const nonce = await getNonceFromContext();

  return createRouter({
    ssr: { nonce }
  });
}
```

## Recommendations

### For @enalmada/start-secure Package

1. **Remove `createNonceGetter()`** - It doesn't work and misleads users
2. **Update documentation** - Show direct context access pattern
3. **Add migration guide** - Help existing users migrate to working pattern
4. **Keep middleware** - `createCspMiddleware()` works correctly
5. **Consider helper function** - If you want to provide a utility, use Option 3 above

### For TanStarter

1. **Keep current workaround** - Direct context access is the only working solution
2. **Document the issue** - Help future users understand why we don't use the package's `createNonceGetter()`
3. **Monitor upstream** - Watch for TanStack Start updates that might fix AsyncLocalStorage with isomorphic functions

## References

- TanStack Router Discussion: https://github.com/TanStack/router/discussions/3028
- TanStack Start SSR Nonce Docs: https://tanstack.com/router/latest/docs/framework/react/start/ssr#nonce
- Node.js AsyncLocalStorage: https://nodejs.org/api/async_context.html#class-asynclocalstorage
- CSP Level 3: https://www.w3.org/TR/CSP3/

## Files Affected

### TanStarter
- `src/router.tsx` - Workaround implementation (src/router.tsx:169-187)
- `.plan/plans/tanstack_csp/IMPLEMENTATION.md` - Updated with bug documentation
- `.plan/plans/tanstack_csp/CRITICAL-BUG.md` - This file

### @enalmada/start-secure
- `src/nonce.ts` - Contains broken `createNonceGetter()` (needs fix)
- `src/middleware.ts` - Works correctly (no changes needed)
- `README.md` - Needs updated documentation
- `docs/sessions/v0.2-middleware-nonce.md` - Needs bug documentation
