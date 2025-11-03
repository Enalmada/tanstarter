# TanStack Native CSP with Nonces

## What & Why

**Goal:** Implement strict Content Security Policy (CSP) with per-request nonces in TanStack Start using the `@enalmada/start-secure` package.

**Problem Solved:**
- Eliminated `'unsafe-inline'` for scripts (XSS protection)
- TanStack Start native nonce support via `router.options.ssr.nonce`
- Production-ready nonce-based CSP using `@enalmada/start-secure`

**Security Model:**
- **Scripts:** Strict with nonces (main XSS vector)
- **Styles:** Relaxed with `'unsafe-inline'` (frameworks inject dynamic styles)

## Current Status

✅ **FULLY WORKING:** Production-ready CSP implementation
- ✅ CSP middleware via `createCspMiddleware()` in `src/start.ts`
- ✅ Direct context access in `src/router.tsx` (official TanStack pattern)
- ✅ All tests passing, zero CSP violations
- ✅ Zero console warnings
- ✅ HMR works in development
- ✅ Package bug fixed in v1.0.1

### ✅ ISSUE RESOLVED

**Previous Issue:** `createNonceGetter()` broke AsyncLocalStorage context chain

**Resolution:** Function removed from package, documentation updated with official pattern

**Current Pattern:** Direct context access using dynamic import (see [CRITICAL-BUG.md](./CRITICAL-BUG.md) for history)

**Result:**
- ✅ TanStarter fully operational with strict CSP
- ✅ start-secure package fixed and published (v1.0.1)
- ✅ Official TanStack pattern documented and working

## Documentation Structure

- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Implementation details and architecture
- **[CRITICAL-BUG.md](./CRITICAL-BUG.md)** - Historical bug analysis (RESOLVED)
- **[EXTRACTION.md](./EXTRACTION.md)** - Package extraction planning (completed)
- **[PACKAGE_API_DESIGN.md](./PACKAGE_API_DESIGN.md)** - API design considerations
- **Package Docs:** https://github.com/Enalmada/start-secure
- See `src/start.ts` and `src/router.tsx` for extensive inline documentation

## Key Technical Decisions

1. **Middleware over handler wrapper** - Use TanStack Start's `createMiddleware()` for per-request nonces
2. **Direct context access** - Server gets nonce from context via dynamic import, client uses meta tag
3. **Pragmatic style handling** - Allow `'unsafe-inline'` for styles, strict for scripts
4. **Granular CSP directives** - Support CSP Level 3 (`-elem`, `-attr` directives)
5. **Rule merging** - Copy base directive sources to granular directives (excluding 'unsafe-eval')

## Quick Reference

**Key Files:**
```
src/start.ts           - CSP middleware via createCspMiddleware() ✅
src/router.tsx         - Direct context access (official TanStack pattern) ✅
src/config/cspRules.ts - Service-specific CSP rules ✅
```

**Current Implementation (Official Pattern):**
```typescript
// src/router.tsx
export async function getRouter() {
  let nonce: string | undefined;
  if (typeof window === 'undefined') {
    const { getStartContext } = await import('@tanstack/start-storage-context');
    nonce = getStartContext().contextAfterGlobalMiddlewares?.nonce;
  }
  return createRouter({ ...(nonce ? { ssr: { nonce } } : {}) });
}
```

**Key Learnings:**
- CSP Level 3 browsers check granular directives (`-elem`, `-attr`) first
- When nonce present, `'unsafe-inline'` is ignored (by design)
- Dynamic framework styles can't have nonces (Vite HMR, React hydration)
- `'strict-dynamic'` allows nonce-verified scripts to load other scripts
- URL whitelists in `script-src` are ignored with `'strict-dynamic'`
- `'unsafe-eval'` should NOT be copied to `script-src-elem` (browser warning)
- **Direct context access is the official TanStack pattern** - NOT helper functions

## Completion Status

### TanStarter (This Project)
- ✅ CSP implementation working with zero violations
- ✅ Direct context access pattern implemented
- ✅ Bug analysis documented in CRITICAL-BUG.md
- ✅ All commits completed
- ✅ Quality checks passing
- ✅ Zero console warnings
- ✅ Production-ready

### start-secure Package
- ✅ v1.0.1 fix implemented and published
- ✅ Removed broken `createNonceGetter()`
- ✅ Updated README with official TanStack pattern
- ✅ Added migration guide (docs/MIGRATION-1.0-to-1.0.1.md)
- ✅ Tested in TanStarter integration
- ✅ Ready for npm publish

**Status:** All work completed. CSP implementation is production-ready.

## References

- [@enalmada/start-secure](https://github.com/Enalmada/start-secure) - NPM package
- [TanStack Router Discussion #3028](https://github.com/TanStack/router/discussions/3028) - Official implementation pattern
- [TanStack Start Middleware Docs](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)
- [AsyncLocalStorage Docs](https://nodejs.org/api/async_context.html#class-asynclocalstorage) - Server-side context (Node.js)
