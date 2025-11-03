# start-secure v0.2 API Design

## Package API

### High-Level API (What Users Import)

```typescript
// Middleware factory - returns configured TanStack Start middleware
export function createCspMiddleware(config: CspMiddlewareConfig): Middleware

// Isomorphic nonce retrieval - works on server and client
export function createNonceGetter(): IsomorphicNonceGetter

// Low-level utilities (for advanced use)
export function generateNonce(): string
export function buildCspHeader(rules: CspRule[], nonce: string, options: SecurityOptions): string
export function generateSecurityHeaders(rules: CspRule[], nonce: string, options: SecurityOptions): SecurityHeaders

// Deprecated (v0.1 compatibility)
export function createSecureHandler(config: StartSecureConfig): HandlerWrapper

// Types
export type {
  CspRule,
  SecurityOptions,
  CspMiddlewareConfig,
  SecurityHeaders,
  IsomorphicNonceGetter
}
```

## Type Definitions

```typescript
export interface CspMiddlewareConfig {
  /** CSP rules to merge with defaults */
  rules?: CspRule[]

  /** Security options */
  options?: SecurityOptions

  /** Custom nonce generator (optional, defaults to crypto-random) */
  nonceGenerator?: () => string

  /** Additional headers to set (optional) */
  additionalHeaders?: Record<string, string>
}

export interface SecurityOptions {
  /** Enable development mode (adds unsafe-eval, WebSocket support) */
  isDev?: boolean

  /** Custom header configuration */
  headerConfig?: SecurityHeadersConfig
}

export interface CspRule {
  description?: string
  source?: string

  // CSP directives (all optional)
  'base-uri'?: string | string[]
  'child-src'?: string | string[]
  'connect-src'?: string | string[]
  'default-src'?: string | string[]
  'font-src'?: string | string[]
  'form-action'?: string | string[]
  'frame-ancestors'?: string | string[]
  'frame-src'?: string | string[]
  'img-src'?: string | string[]
  'manifest-src'?: string | string[]
  'media-src'?: string | string[]
  'object-src'?: string | string[]
  'script-src'?: string | string[]
  'script-src-attr'?: string | string[]
  'script-src-elem'?: string | string[]
  'style-src'?: string | string[]
  'style-src-attr'?: string | string[]
  'style-src-elem'?: string | string[]
  'worker-src'?: string | string[]
}

export type IsomorphicNonceGetter = () => string | undefined
```

## User Experience

### Setup: src/start.ts (~7 lines)

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

### Setup: src/router.tsx (~3 lines)

```typescript
import { createRouter } from '@tanstack/react-router'
import { createNonceGetter } from '@enalmada/start-secure'

export function getRouter() {
  const getNonce = createNonceGetter()

  const router = createRouter({
    routeTree,
    // ... other options
    ssr: {
      nonce: getNonce()  // ← Applies nonce to all framework scripts
    }
  })

  return router
}
```

### Configuration: src/config/cspRules.ts

```typescript
import type { CspRule } from '@enalmada/start-secure'

export const cspRules: CspRule[] = [
  {
    description: 'google-auth',
    'form-action': "'self' https://accounts.google.com",
    'img-src': "https://*.googleusercontent.com",
    'connect-src': "https://*.googleusercontent.com",
  },
  {
    description: 'posthog-analytics',
    'script-src': "https://*.posthog.com",
    'connect-src': "https://*.posthog.com",
  },
  // ... more service-specific rules
]
```

## Implementation Files

### src/middleware.ts

```typescript
import { createMiddleware } from '@tanstack/react-start'
import { getResponseHeaders, setResponseHeaders } from '@tanstack/react-start/server'
import { generateNonce } from './nonce'
import { generateSecurityHeaders } from './internal/generator'
import type { CspMiddlewareConfig } from './internal/types'

export function createCspMiddleware(config: CspMiddlewareConfig = {}) {
  const {
    rules = [],
    options = {},
    nonceGenerator = generateNonce,
    additionalHeaders = {}
  } = config

  return createMiddleware().server(({ next }) => {
    // Generate unique nonce per request
    const nonce = nonceGenerator()

    // Generate all security headers with nonce
    const securityHeaders = generateSecurityHeaders(rules, options, nonce)

    // Apply headers
    const headers = getResponseHeaders()
    for (const [key, value] of Object.entries(securityHeaders)) {
      if (value !== undefined) {
        headers.set(key, value)
      }
    }

    // Apply additional custom headers
    for (const [key, value] of Object.entries(additionalHeaders)) {
      headers.set(key, value)
    }

    setResponseHeaders(headers)

    // Pass nonce through context for router
    return next({
      context: {
        nonce,
      },
    })
  })
}
```

### src/nonce.ts

```typescript
import { createIsomorphicFn } from '@tanstack/react-start'
import { getStartContext } from '@tanstack/start-storage-context'

/**
 * Generate cryptographically secure random nonce for CSP
 * @returns Base64-encoded random nonce (256 bits)
 */
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

/**
 * Create isomorphic function to get nonce on both server and client
 *
 * Server: Retrieves from TanStack Start global middleware context
 * Client: Retrieves from meta tag (auto-created by TanStack Start)
 *
 * @returns Function that retrieves nonce from appropriate context
 */
export function createNonceGetter() {
  return createIsomorphicFn()
    .server(() => {
      const context = getStartContext()
      return context.contextAfterGlobalMiddlewares?.nonce
    })
    .client(() => {
      const meta = document.querySelector("meta[property='csp-nonce']")
      return meta?.getAttribute('content') ?? undefined
    })
}
```

### src/internal/csp-builder.ts (extract from TanStarter)

Key responsibilities:
1. Build base CSP directives with nonce
2. Merge user-provided rules
3. Copy sources from base directives to granular directives (CSP Level 3)
4. Handle development mode adjustments
5. Build final CSP header string

## CSP Strategy

### Scripts (Strict)

```typescript
"script-src": ['self', 'nonce-XXX', 'unsafe-inline', 'strict-dynamic', ...dev]
"script-src-elem": ['self', 'nonce-XXX', 'unsafe-inline', 'strict-dynamic', ...dev]
```

- `'unsafe-inline'` ignored when nonce present (backward compat)
- `'strict-dynamic'` allows nonce-verified scripts to load others
- Development: adds `'unsafe-eval'`, `https:`, `http:`

### Styles (Pragmatic)

```typescript
"style-src": ['self', 'unsafe-inline']
"style-src-elem": ['self', 'unsafe-inline']
"style-src-attr": ['unsafe-inline']
```

- No nonce for styles (frameworks inject dynamic styles)
- Vite HMR, React hydration, CSS-in-JS need flexibility
- Trade-off: styles can't execute code (low security risk)

### Granular Directives

After merging user rules, copy base directive sources to granular:

```typescript
// CSP Level 3 browsers check granular directives first
// Must copy base sources to granular for them to apply
if (directives["style-src"] && directives["style-src-elem"]) {
  for (const source of directives["style-src"]) {
    if (!directives["style-src-elem"].includes(source)) {
      directives["style-src-elem"].push(source)
    }
  }
}
```

## Migration from v0.1 → v0.2

### Old Way

```typescript
// src/server.ts
import { createSecureHandler } from '@enalmada/start-secure'

const secureHandler = createSecureHandler({
  rules: cspRules,
  options: { isDev: process.env.NODE_ENV !== 'production' }
})

export default {
  fetch: secureHandler(createStartHandler(defaultStreamHandler))
}
```

### New Way

```typescript
// src/start.ts (NEW FILE)
import { createStart } from '@tanstack/react-start'
import { createCspMiddleware } from '@enalmada/start-secure'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCspMiddleware({ rules: cspRules, options: { isDev: true } })
  ]
}))

// src/router.tsx (UPDATED)
import { createNonceGetter } from '@enalmada/start-secure'

const getNonce = createNonceGetter()
const router = createRouter({ ssr: { nonce: getNonce() } })

// src/server.ts (SIMPLIFIED)
const fetch = createStartHandler(defaultStreamHandler)
```

### Breaking Changes

1. Must create `src/start.ts` to register middleware
2. Must update router with `ssr: { nonce }`
3. CSP rules format unchanged (compatible)

### Benefits

- ✅ Per-request nonce (not static)
- ✅ No `'unsafe-inline'` for scripts
- ✅ Integrates with TanStack router
- ✅ Automatic nonce in all framework scripts

## Dependencies

```json
{
  "peerDependencies": {
    "@tanstack/react-start": ">=1.0.0",
    "@tanstack/start-storage-context": ">=1.0.0"
  }
}
```

## Success Criteria

**API:**
- ✅ Exports `createCspMiddleware()` factory
- ✅ Exports `createNonceGetter()` helper
- ✅ Maintains `CspRule[]` format (backward compatible)
- ✅ Full TypeScript support

**User Experience:**
- ✅ < 15 lines of setup code total
- ✅ Clear, obvious API
- ✅ Hard to use incorrectly
- ✅ Works in any TanStack Start project

**Security:**
- ✅ No `'unsafe-inline'` for scripts (production CSP)
- ✅ Unique nonce per request
- ✅ All framework scripts get nonces
- ✅ `'strict-dynamic'` support

**Reusability:**
- ✅ Same package works across all projects
- ✅ Service-specific rules in user code
- ✅ Easy to share and maintain
