# TanStack Native CSP with Nonces

## What & Why

**Goal:** Implement strict Content Security Policy (CSP) with per-request nonces in TanStack Start, then extract to `@enalmada/start-secure` for reuse across projects.

**Problem Solved:**
- Current `start-secure` v0.1 uses `'unsafe-inline'` (insecure fallback)
- TanStack Start v1 now has native nonce support via `router.options.ssr.nonce`
- Need nonce-based CSP for production security (no `'unsafe-inline'` for scripts)

**Security Model:**
- **Scripts:** Strict with nonces (main XSS vector)
- **Styles:** Relaxed with `'unsafe-inline'` (frameworks inject dynamic styles)

## Current Status

✅ **Phase 1-2 Complete:** Working implementation in TanStarter
- Native CSP middleware in `src/start.ts`
- Nonce integration in `src/router.tsx`
- All tests passing, no CSP violations
- HMR works in development

⏭️ **Next:** Extract to `start-secure` package (Phase 10-15)

## Documentation Structure

- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - What we built in TanStarter and why
- **[EXTRACTION.md](./EXTRACTION.md)** - How to extract to start-secure package
- **[PACKAGE_API_DESIGN.md](./PACKAGE_API_DESIGN.md)** - Detailed API design for start-secure v0.2

## Key Technical Decisions

1. **Middleware over handler wrapper** - Use TanStack Start's `createMiddleware()` for per-request nonces
2. **Isomorphic nonce retrieval** - Server gets from context, client from meta tag
3. **Pragmatic style handling** - Allow `'unsafe-inline'` for styles, strict for scripts
4. **Granular CSP directives** - Support CSP Level 3 (`-elem`, `-attr` directives)
5. **Rule merging** - Copy base directive sources to granular directives

## Quick Reference

**Files Changed:**
```
src/start.ts          (NEW)  - CSP middleware with nonce generation
src/router.tsx        (+17L) - Isomorphic nonce getter, ssr: { nonce }
src/server.ts         (-14L) - Removed old createSecureHandler wrapper
```

**Key Learnings:**
- CSP Level 3 browsers check granular directives (`-elem`, `-attr`) first
- When nonce present, `'unsafe-inline'` is ignored (by design)
- Dynamic framework styles can't have nonces (Vite HMR, React hydration)
- `'strict-dynamic'` allows nonce-verified scripts to load other scripts

## References

- [TanStack Router Discussion #3028](https://github.com/TanStack/router/discussions/3028) - Complete implementation pattern
- [TanStack Start Middleware Docs](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)
- Current package: `C:\Users\enalm\code\open\start-secure`
