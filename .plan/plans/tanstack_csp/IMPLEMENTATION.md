# TanStarter CSP Implementation

## What We Built

Native nonce-based CSP using TanStack Start's middleware system.

## Architecture

### 1. CSP Middleware (`src/start.ts`)

**Purpose:** Generate unique nonce per request, build CSP header, set security headers

**Key Functions:**
- `generateNonce()` - Crypto-random base64 nonce from `crypto.randomUUID()`
- `buildCspHeader()` - Merges base directives + user rules + nonce
- `cspMiddleware` - Request middleware registered globally

**How It Works:**
```typescript
createMiddleware().server(({ next }) => {
  const nonce = generateNonce()               // 1. Generate per request
  const cspHeader = buildCspHeader(...)       // 2. Build CSP with nonce
  setResponseHeaders({ CSP: cspHeader })      // 3. Set headers
  return next({ context: { nonce } })         // 4. Pass to router
})
```

### 2. Router Integration (`src/router.tsx`)

**Purpose:** Retrieve nonce and apply to router's SSR config

**Isomorphic Nonce Getter:**
```typescript
const getNonce = createIsomorphicFn()
  .server(() => getStartContext().contextAfterGlobalMiddlewares.nonce)
  .client(() => document.querySelector("meta[property='csp-nonce']")?.content)
```

**Router Config:**
```typescript
createRouter({
  ssr: { nonce: getNonce() }  // Applies to all <Scripts> and <ScriptOnce>
})
```

### 3. Simplified Server (`src/server.ts`)

**Before:**
```typescript
const secureHandler = createSecureHandler({ rules, options })
const fetch = secureHandler(createStartHandler(...))
```

**After:**
```typescript
const fetch = createStartHandler(...)  // Security via middleware now
```

## CSP Configuration

### Script Directives (Strict)

```typescript
"script-src": ['self', 'nonce-XXX', 'unsafe-inline', 'strict-dynamic', ...dev]
"script-src-elem": ['self', 'nonce-XXX', 'unsafe-inline', 'strict-dynamic', ...dev]
```

**Why:**
- `'nonce-XXX'` - Unique per request, allows our scripts
- `'unsafe-inline'` - Ignored when nonce present (backward compat only)
- `'strict-dynamic'` - Scripts loaded by nonce-verified scripts are allowed
- `'unsafe-eval'` (dev only) - For source maps, dev tools

### Style Directives (Pragmatic)

```typescript
"style-src": ['self', 'unsafe-inline']
"style-src-elem": ['self', 'unsafe-inline']
"style-src-attr": ['unsafe-inline']
```

**Why `'unsafe-inline'` for styles:**
- Vite HMR injects styles dynamically
- React hydration creates styles before nonce available
- CSS-in-JS libraries generate runtime styles
- Tailwind JIT (future) generates dynamic styles
- Hashes don't work (content changes)
- **Trade-off:** Styles can't execute code, low security risk

### Development Mode

```typescript
isDev ? {
  'script-src': [..., 'unsafe-eval', 'https:', 'http:'],
  'connect-src': [..., 'ws://localhost:*', 'wss://localhost:*']
} : {}
```

**Enables:**
- Source maps (`'unsafe-eval'`)
- Dev tools (`'unsafe-eval'`)
- HMR WebSocket (`ws://localhost:*`)
- CDN scripts during dev (`https:`, `http:`)

### Granular Directives (CSP Level 3)

**Problem:** When browsers see `-elem` or `-attr` directives, they ignore base directives

**Solution:** Copy sources from base to granular:
```typescript
// After merging user rules:
for (const source of directives["style-src"]) {
  directives["style-src-elem"].push(source)  // Copy to granular
}
```

This ensures external sources from `cspRules.ts` apply to granular directives.

## Rule Merging

User CSP rules from `src/config/cspRules.ts`:
```typescript
{
  description: 'google-fonts',
  'style-src': 'https://fonts.googleapis.com',
  'font-src': 'https://fonts.gstatic.com',
}
```

Are merged into base directives, then copied to granular directives.

## Security Headers

Beyond CSP, we set:
```typescript
'X-Frame-Options': 'DENY'
'X-Content-Type-Options': 'nosniff'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'X-XSS-Protection': '1; mode=block'
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload' (prod only)
'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), ...'
```

## Why This Approach

### vs. Old `createSecureHandler`

**Old (v0.1):**
- Headers generated once at startup (static)
- No per-request nonce
- Falls back to `'unsafe-inline'`
- Doesn't integrate with TanStack router

**New:**
- Headers generated per request (dynamic)
- Unique nonce each request
- No `'unsafe-inline'` for scripts
- Full TanStack router integration

### vs. Working in start-secure First

**Why implement in TanStarter first:**
- Real app context provides immediate feedback
- Easier to experiment and debug
- Proves the approach works
- Working reference makes extraction cleaner
- Lower risk

## Testing Results

✅ TypeScript type checking - PASSED
✅ Biome linting - PASSED (1 auto-fix)
✅ Unit tests - PASSED (62 tests)
✅ HMR works in development
✅ No CSP violations in console
✅ Nonces visible in `<script>` tags

## Files Changed

| File | Change | Lines | Purpose |
|------|--------|-------|---------|
| `src/start.ts` | NEW | 131 | CSP middleware, nonce generation |
| `src/router.tsx` | EDIT | +17 | Isomorphic nonce getter, ssr config |
| `src/server.ts` | EDIT | -14 | Removed old wrapper |

## Key Technical Insights

1. **`'unsafe-inline'` ignored with nonce** - By design in CSP Level 2+
2. **Granular directives override base** - CSP Level 3 browsers check `-elem`/`-attr` first
3. **Dynamic styles need flexibility** - Can't nonce framework-injected styles
4. **Scripts are main XSS vector** - Styles can't execute code
5. **`'strict-dynamic'` is powerful** - Nonce-verified scripts can load others
6. **Development needs relaxed rules** - HMR, source maps, dev tools

## Next Steps

Extract this working implementation to `@enalmada/start-secure` v0.2 for reuse across projects.

See [EXTRACTION.md](./EXTRACTION.md) for the extraction plan.
