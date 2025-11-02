# Extracting to start-secure Package

## Goal

Move working CSP implementation from TanStarter to `@enalmada/start-secure` v0.2 for reuse across projects.

## Package Location

`C:\Users\enalm\code\open\start-secure`

## Extraction Strategy

### What Goes in Package

**Core utilities (100% reusable):**
- Nonce generation
- Nonce validation
- CSP header building with nonce
- Rule merging logic
- Granular directive handling (copy base → `-elem`/`-attr`)

**Middleware factory (high-level API):**
- `createCspMiddleware(config)` - Returns configured middleware
- `createNonceGetter()` - Returns isomorphic nonce function

### What Stays in User Code

**Required setup (~10 lines total):**
- `src/start.ts` - Register middleware
- `src/router.tsx` - Add `ssr: { nonce }`
- `src/config/cspRules.ts` - Service-specific CSP rules

**Why:** TanStack Start requires these files for middleware/router configuration.

## Proposed API

### Package Exports

```typescript
// High-level API
export function createCspMiddleware(config: CspMiddlewareConfig): Middleware
export function createNonceGetter(): IsomorphicNonceGetter

// Low-level utilities (for advanced use)
export function generateNonce(): string
export function buildCspHeader(rules, nonce, options): string
export function generateSecurityHeaders(rules, nonce, options): SecurityHeaders

// Types
export type { CspRule, SecurityOptions, CspMiddlewareConfig, SecurityHeaders }
```

### User Setup

**src/start.ts:**
```typescript
import { createStart } from '@tanstack/react-start'
import { createCspMiddleware } from '@enalmada/start-secure'
import { cspRules } from './config/cspRules'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCspMiddleware({
      rules: cspRules,
      options: { isDev: process.env.NODE_ENV !== 'production' }
    })
  ]
}))
```

**src/router.tsx:**
```typescript
import { createNonceGetter } from '@enalmada/start-secure'

const getNonce = createNonceGetter()
const router = createRouter({
  // ...
  ssr: { nonce: getNonce() }
})
```

## Package Structure

```
start-secure/
├── src/
│   ├── index.ts                  # Public API exports
│   ├── middleware.ts             # NEW: createCspMiddleware()
│   ├── nonce.ts                  # NEW: generateNonce(), createNonceGetter()
│   ├── handler.ts                # KEEP: createSecureHandler() (deprecated)
│   └── internal/
│       ├── types.ts              # UPDATE: Add CspMiddlewareConfig
│       ├── defaults.ts           # UPDATE: Remove nonce fallback logic
│       ├── generator.ts          # UPDATE: Integrate nonce properly
│       └── merger.ts             # UPDATE: Add granular directive copying
```

## Implementation Plan (Phases 10-15)

### Phase 10: Explore Current Package

- [x] Review package structure
- [ ] Understand existing exports
- [ ] Check test coverage
- [ ] Review dependencies

### Phase 11: Create New Files

**src/middleware.ts:**
```typescript
import { createMiddleware } from '@tanstack/react-start'
import { getResponseHeaders, setResponseHeaders } from '@tanstack/react-start/server'
import { generateNonce } from './nonce'
import { buildCspHeader } from './internal/csp-builder'

export function createCspMiddleware(config: CspMiddlewareConfig) {
  const { rules = [], options = {}, nonceGenerator = generateNonce } = config

  return createMiddleware().server(({ next }) => {
    const nonce = nonceGenerator()
    const headers = buildCspHeader(rules, nonce, options)

    const responseHeaders = getResponseHeaders()
    for (const [key, value] of Object.entries(headers)) {
      responseHeaders.set(key, value)
    }
    setResponseHeaders(responseHeaders)

    return next({ context: { nonce } })
  })
}
```

**src/nonce.ts:**
```typescript
import { createIsomorphicFn } from '@tanstack/react-start'
import { getStartContext } from '@tanstack/start-storage-context'

export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

export function createNonceGetter() {
  return createIsomorphicFn()
    .server(() => getStartContext().contextAfterGlobalMiddlewares?.nonce)
    .client(() => document.querySelector("meta[property='csp-nonce']")?.getAttribute('content') ?? undefined)
}
```

### Phase 12: Update Existing Files

**src/internal/csp-builder.ts (extract from TanStarter):**
- Move `buildCspHeader()` function
- Include granular directive copying logic
- Handle development mode
- Merge user rules

**src/internal/defaults.ts:**
- Remove nonce fallback to `'unsafe-inline'`
- Update base directives to expect nonce parameter
- Keep style directives simple (no nonce)

**src/internal/types.ts:**
```typescript
export interface CspMiddlewareConfig {
  rules?: CspRule[]
  options?: SecurityOptions
  nonceGenerator?: () => string
  additionalHeaders?: Record<string, string>
}
```

### Phase 13: Update Exports

**src/index.ts:**
```typescript
// New v0.2 API
export { createCspMiddleware } from './middleware'
export { createNonceGetter, generateNonce } from './nonce'
export { buildCspHeader, generateSecurityHeaders } from './internal/generator'

// Deprecated v0.1 API (keep for migration)
export { createSecureHandler } from './handler'

// Types
export type {
  CspRule,
  SecurityOptions,
  CspMiddlewareConfig,
  SecurityHeaders
} from './internal/types'
```

### Phase 14: Test via bun link

```bash
# In start-secure directory
cd C:\Users\enalm\code\open\start-secure
bun link

# In TanStarter directory
cd C:\Users\enalm\code\open\tanstarter
bun link @enalmada/start-secure
```

**Update TanStarter to use new API:**
```typescript
// src/start.ts
import { createCspMiddleware } from '@enalmada/start-secure'

// src/router.tsx
import { createNonceGetter } from '@enalmada/start-secure'
```

**Remove inline implementations:**
- Delete `generateNonce()` from `src/start.ts`
- Delete `buildCspHeader()` from `src/start.ts`
- Delete `getNonce` from `src/router.tsx`

**Test everything still works:**
- Run dev server
- Check nonces in DevTools
- Verify CSP header
- Run quality checks

### Phase 15: Package Finalization

**Documentation:**
- [ ] Update README.md with v0.2 API
- [ ] Add migration guide (v0.1 → v0.2)
- [ ] Document `createCspMiddleware()` options
- [ ] Document `createNonceGetter()` usage
- [ ] Add examples

**Testing:**
- [ ] Add tests for nonce generation
- [ ] Add tests for CSP building
- [ ] Add tests for middleware factory
- [ ] Add tests for isomorphic nonce getter

**Release:**
- [ ] Update version to 0.2.0 (breaking change)
- [ ] Update changelog
- [ ] Publish to npm (or keep local)
- [ ] Update TanStarter to use published version

## Migration Guide (v0.1 → v0.2)

**What's Removed:**
- Handler wrapper pattern
- Static header generation
- `'unsafe-inline'` fallback for scripts

**What's Added:**
- Middleware pattern
- Per-request nonce generation
- Isomorphic nonce retrieval
- Strict CSP for scripts

**Breaking Changes:**
1. Must create `src/start.ts` with middleware
2. Must update router with `ssr: { nonce }`
3. CSP rules format unchanged (compatible)

**Backward Compatibility:**
- Keep old `createSecureHandler()` as deprecated
- Provide clear migration path
- Document both approaches

## Success Criteria

**Package:**
- ✅ Exports `createCspMiddleware()` and `createNonceGetter()`
- ✅ Per-request nonce generation
- ✅ Full TypeScript support
- ✅ Comprehensive tests
- ✅ Clean, documented API

**Integration:**
- ✅ Works via `bun link` in TanStarter
- ✅ All tests pass
- ✅ No CSP violations
- ✅ HMR works

**Reusability:**
- ✅ Can be used in any TanStack Start project
- ✅ Minimal setup required (~10 lines)
- ✅ Hard to use incorrectly

## Key Decisions

1. **Middleware factory pattern** - Better than full abstraction
2. **Keep CSP rules in user code** - Each project has different services
3. **Deprecate old API** - Don't remove for easier migration
4. **Pragmatic style handling** - Document why `'unsafe-inline'` for styles
5. **Granular directive support** - Handle CSP Level 3 properly

## Next Action

Start Phase 10: Explore current start-secure package structure.
