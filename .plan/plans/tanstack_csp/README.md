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

✅ **COMPLETE:** Using `@enalmada/start-secure` v1.0.0 in production
- CSP middleware via `createCspMiddleware()` in `src/start.ts`
- Nonce integration via `createNonceGetter()` in `src/router.tsx`
- All tests passing, no CSP violations
- HMR works in development
- Package published and integrated

## Documentation Structure

- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Implementation details and architecture
- **Package Docs:** https://github.com/Enalmada/start-secure
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
src/start.ts          - Uses createCspMiddleware() from @enalmada/start-secure
src/router.tsx        - Uses createNonceGetter() for isomorphic nonce access
src/config/cspRules.ts - Service-specific CSP rules (merged with base rules)
```

**Key Learnings:**
- CSP Level 3 browsers check granular directives (`-elem`, `-attr`) first
- When nonce present, `'unsafe-inline'` is ignored (by design)
- Dynamic framework styles can't have nonces (Vite HMR, React hydration)
- `'strict-dynamic'` allows nonce-verified scripts to load other scripts

## References

- [@enalmada/start-secure](https://github.com/Enalmada/start-secure) - NPM package (v1.0.0)
- [TanStack Router Discussion #3028](https://github.com/TanStack/router/discussions/3028) - Implementation pattern
- [TanStack Start Middleware Docs](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)
