---
name: tanstack-start
description: TanStack Start server function patterns and best practices. Use when creating or modifying server functions with createServerFn, debugging "Buffer is not defined" / Drizzle leaks in the client bundle, implementing server-side data fetching, or handling HTTP errors from handlers.
---

# TanStack Start Best Practices

This project uses TanStack Start for full-stack React. Server functions (`createServerFn`) enable server-side code execution from client components.

## Server Function Structure (CRITICAL)

Every `createServerFn` file MUST follow this pattern:

1. **Imports at top** — limited to:
   - `@tanstack/react-start` (the framework itself)
   - `valibot` (validation)
   - `~/server/access/http-errors` (the typed error vocabulary — client-safe by construction)
   - `~/lib/*` (client-safe enums and constants)
   - Type-only imports (`import type { … }`)
2. **Schema definitions** next.
3. **Validator** function (sync) — throws `BadRequestError` with `result.issues.map((i) => i.message).join("; ")`.
4. **Handler** as inline exported named function — `export async function handleX(...)`. NEVER trailing `export { handleX }` (TanStack Start's handler-body extraction can dangle the reference).
5. **Dynamic imports** inside the handler for server-only modules (`~/server/db`, `~/server/services/*`, `~/server/auth/*`, `@tanstack/react-start/server`).
6. **`createServerFn(...)` at the VERY END** of the file, registering the handler.

Reference example: see [src/functions/user-role.ts](src/functions/user-role.ts).

## TSS Rules (mechanical checks)

| Rule | Description |
|---|---|
| TSS-1a | No `setResponseStatus` in createServerFn files (the middleware handles status translation; pre-handler auth helpers that 401/500 are an exception) |
| TSS-1b | No `try/catch` around `accessCheck` calls (let the `authErrorTranslator` translate `NotAuthorizedError`) |
| TSS-2 | No top-level server-only imports in createServerFn files (load-bearing — violations crash the client bundle) |
| TSS-3 | Pure-valibot validators must not co-locate with `pgTable` declarations if shared across client + server |
| TSS-5 | Validators use the canonical `.issues.map((i) => i.message).join("; ")` form |

**TSS-2 is the load-bearing rule** — violations crash the client bundle with `Buffer is not defined` or pull Drizzle / `postgres-js` into the browser. A mechanical CI gate (`bun run check-tss-2`) enforces it.

## HTTP Status Codes — Domain Errors + Global Middleware

Handlers throw typed domain errors from [src/server/access/http-errors.ts](src/server/access/http-errors.ts); the `authErrorTranslator` middleware in [src/server/access/middleware.ts](src/server/access/middleware.ts) translates them to HTTP.

| Class | HTTP | Default `safeMessage` | When to throw |
|---|---|---|---|
| `BadRequestError` | 400 | the message | Input-validation failures from `inputValidator` |
| `NotAuthorizedError` | 403 | `"Forbidden"` | Self-actor authorization denial (Pattern A) |
| `NotFoundError` | 404 | `"Not found"` | Row missing, or info-hiding recast (Pattern B) |
| `ConflictError` | 409 | the message | Unique-constraint violations, optimistic-concurrency mismatches |

All four implement the structural `HttpErrorHints` interface (`httpStatus` + `safeMessage`). The middleware dispatches on `hasHttpErrorHints(err)`, so future domain error types get translation for free.

### Wire-payload safety

The middleware rethrows a plain `Error` with the original error name and `safeMessage` only — no `cause`, no extra properties. TanStack Start's seroval serializer walks own-property names, so attaching `cause` would leak rich diagnostic (rule details, owning user IDs, stack traces) to the client. Server-side correlation is preserved via the logger calls inside the middleware.

## Pattern A vs Pattern B authorization

- **Pattern A — self-actor**: rule criteria reference the calling user (`{ userId: user.id }`). Translate auth denials to **403**.
- **Pattern B — other-actor**: rule criteria reference a loaded row the actor may not own. Recast auth denials to **404** (anti-enumeration / IDOR mitigation). Every 404 path in a Pattern B handler must surface byte-identical `safeMessage` — extract to a `SAFE_NOT_FOUND` const in a sibling `guards.ts`.

## Post-write race fallback (INTENTIONAL bare Error)

After a pre-write existence check confirms a row, if the write returns null it means concurrent delete. Throw a bare `Error` with a rationale comment — the middleware default 500 is the right signal. The race is unrecoverable client-side; the 5xx surfaces it in monitoring. Pre-write existence check uses `NotFoundError` (404, client-attributable). Don't conflate the two.

## Safe top-level imports in createServerFn files

- `@tanstack/react-start` (the framework)
- `valibot` / `zod` (pure JS)
- `~/lib/*` (client-safe enums and constants, e.g. [src/lib/enums/user-role.ts](src/lib/enums/user-role.ts), [src/lib/enums/task-status.ts](src/lib/enums/task-status.ts), [src/lib/entity-types.ts](src/lib/entity-types.ts))
- `~/server/access/http-errors` (intentionally client-safe — no Drizzle/auth imports)
- `~/server/db/schema/*-schemas.ts` (Drizzle-free valibot sibling files — when shared across 2+ handlers)
- Type-only imports (`import type { X }`)

## Dynamic-import inside handler (REQUIRED)

- `~/server/db` (Drizzle DB instance)
- `~/server/db/schema/*.schema.ts` (Drizzle tables and any `createInsertSchema`/`createUpdateSchema` exports)
- `~/server/services/*` (anything that chains into Drizzle)
- `~/server/auth/*` (Better Auth + Drizzle adapter)
- `~/utils/logger` (Axiom client init)
- `@tanstack/react-start/server` (`getRequest`, `setResponseHeader`, `setResponseStatus`)
- `drizzle-orm` (table-builder helpers like `eq`, `and`, …)
- `~/utils/test/playwright` (server-only helper)
- Anything that runs `relations()` or `drizzle(postgres(...))` at module load

## Client-safe enum carve-out

Any TypeScript enum or constant used in BOTH client components AND server code must live in `~/lib/`. Examples in this repo:

- `UserRole` → [src/lib/enums/user-role.ts](src/lib/enums/user-role.ts), re-exported by [src/server/db/schema/auth.schema.ts](src/server/db/schema/auth.schema.ts).
- `TaskStatus` → [src/lib/enums/task-status.ts](src/lib/enums/task-status.ts), re-exported by [src/server/db/schema/task.schema.ts](src/server/db/schema/task.schema.ts).
- `ENTITY_TYPES` → [src/lib/entity-types.ts](src/lib/entity-types.ts), re-exported by [src/server/access/ability.ts](src/server/access/ability.ts).

**Why this matters:** importing a value like `TaskStatus` from `~/server/db/schema` pulls in `pgTable("task", { … })` side effects via the schema barrel, leaking Drizzle into the client bundle. The `~/lib/` carve-out keeps client imports Drizzle-free while server code continues to import everything from `~/server/db/schema` via the barrel.

## `getRequest()` defensive try/catch (REQUIRED)

`getRequest()` from `@tanstack/react-start/server` resolves the per-request `Request` from TanStack Start's AsyncLocalStorage context. Since v1.134+ the call **throws** (not returns `undefined`) when the context isn't active — which happens routinely during SSR query prefetch / dehydration. An unhandled throw poisons the React Query cache (`fetchFailureReason: TypeError`) on every SSR page render, breaks `setResponseHeader("Set-Cookie", …)` calls that depend on getting `request` first, and noisily alerts Sentry / Rollbar / Axiom.

**Always wrap the call** — whether the import is static (e.g. `~/utils/test/playwright.ts`, middleware files) or dynamic (createServerFn handlers):

```typescript
const { getRequest } = await import("@tanstack/react-start/server");
let request: Request | undefined;
try {
	request = getRequest();
} catch (_error) {
	// Context not available (e.g., during SSR initialization)
	return null;
}
if (!request) {
	return null;
}
```

For handlers where missing context IS a fatal condition (e.g. authed-action helpers), the `if (!request)` branch should `setResponseStatus(500)` and throw, but the throw should reach that branch via the `_error → request = undefined` fallthrough rather than crashing in the call itself. See [src/functions/session.ts](src/functions/session.ts), [src/functions/user-role.ts](src/functions/user-role.ts), and `getUser` in [src/functions/base-service.ts](src/functions/base-service.ts) for the canonical shape.

## Mechanical check script (TSS-2)

See [scripts/check-tss-2.sh](scripts/check-tss-2.sh). Run via `bun run check-tss-2`. CI gates merge on a hit. Failing locally means a createServerFn file gained a top-level server-only import — convert it to a dynamic import inside the handler.

## Real-browser validation for bundling PRs

When a PR touches `vite.config.ts`, the bundler config, the dynamic-import / shim layer, anything chunk-graph-shaped, SSR boundaries, or env-validation — drive a preview deploy in a real browser before merging. See [docs/development/engineering-workflow.md](docs/development/engineering-workflow.md).
