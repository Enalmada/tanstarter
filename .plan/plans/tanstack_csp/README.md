# TanStack Native CSP with Nonces

## What & Why

**Goal:** Implement strict Content Security Policy (CSP) with per-request nonces in TanStack Start using the `@enalmada/start-secure` package.

**Problem Solved:**
- Eliminated `'unsafe-inline'` for scripts (XSS protection)
- TanStack Start v1 native nonce support via `router.options.ssr.nonce`
- Production-ready nonce-based CSP using `@enalmada/start-secure` v1.0.0

**Security Model:**
- **Scripts:** Strict with nonces (main XSS vector)
- **Styles:** Relaxed with `'unsafe-inline'` (frameworks inject dynamic styles)

## Current Status

✅ **WORKING (with workaround):** Using `@enalmada/start-secure` v0.2 in development
- ✅ CSP middleware via `createCspMiddleware()` in `src/start.ts` - **WORKS**
- ⚠️ Nonce integration in `src/router.tsx` - **USING WORKAROUND**
- ✅ All tests passing, no CSP violations
- ✅ HMR works in development
- ❌ Package has critical bug - see below

### ⚠️ CRITICAL BUG DISCOVERED

**Issue:** `createNonceGetter()` from `@enalmada/start-secure` is broken

**Root Cause:** `createIsomorphicFn()` wrapper breaks AsyncLocalStorage context chain

**Workaround:** Direct context access in `src/router.tsx` (bypasses broken wrapper)

**Status:** Documented in [CRITICAL-BUG.md](./CRITICAL-BUG.md), fix planned for start-secure v0.2.1

**Impact:**
- ✅ TanStarter works (using workaround)
- ❌ start-secure package needs fix before public release
- ✅ Official TanStack pattern documented

## Documentation Structure

- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Implementation details, architecture, and workaround
- **[CRITICAL-BUG.md](./CRITICAL-BUG.md)** - Complete bug analysis and technical details
- **[EXTRACTION.md](./EXTRACTION.md)** - Plan for extracting to start-secure package
- **[PACKAGE_API_DESIGN.md](./PACKAGE_API_DESIGN.md)** - API design considerations
- **Package Docs:** https://github.com/Enalmada/start-secure (needs v0.2.1 update)
- See `src/start.ts` and `src/router.tsx` for extensive inline documentation

## Key Technical Decisions

1. **Middleware over handler wrapper** - Use TanStack Start's `createMiddleware()` for per-request nonces
2. **Isomorphic nonce retrieval** - Server gets from context, client from meta tag
3. **Pragmatic style handling** - Allow `'unsafe-inline'` for styles, strict for scripts
4. **Granular CSP directives** - Support CSP Level 3 (`-elem`, `-attr` directives)
5. **Rule merging** - Copy base directive sources to granular directives

## Quick Reference

**Key Files:**
```
src/start.ts           - Uses createCspMiddleware() from @enalmada/start-secure ✅
src/router.tsx         - Direct context access (workaround for broken createNonceGetter) ⚠️
src/config/cspRules.ts - Service-specific CSP rules (merged with base rules) ✅
```

**Current Implementation (Workaround):**
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
- ⚠️ **Isomorphic wrappers break AsyncLocalStorage** - Use direct context access instead
- Official TanStack pattern uses direct access, NOT helper functions

## Next Steps

### For TanStarter (This Project)
- ✅ Workaround implemented and working
- ✅ Bug documented in CRITICAL-BUG.md
- ✅ All commits completed
- ✅ Quality checks passing
- ⏳ Monitor start-secure for v0.2.1 release
- ⏳ Update to official fix once available

### For start-secure Package
- [ ] Implement v0.2.1 fix (see fix plan in start-secure repo)
- [ ] Remove or replace `createNonceGetter()`
- [ ] Update README with official TanStack pattern
- [ ] Add migration guide for v0.2 users
- [ ] Test in TanStarter integration
- [ ] Publish v0.2.1 to npm

**Fix Plan:** See `C:\Users\enalm\code\open\start-secure\docs\FIX-PLAN-v0.2.1.md`

**Estimated Effort:** ~8 hours (implementation, testing, documentation, release)

## References

- [@enalmada/start-secure](https://github.com/Enalmada/start-secure) - NPM package (v0.2 - needs v0.2.1 fix)
- [TanStack Router Discussion #3028](https://github.com/TanStack/router/discussions/3028) - Official implementation pattern
- [TanStack Start Middleware Docs](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)
- [AsyncLocalStorage Docs](https://nodejs.org/api/async_context.html#class-asynclocalstorage) - Server-side context (Node.js)
