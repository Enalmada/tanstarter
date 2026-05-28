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

## One createServerFn per file (REQUIRED — TSS-6)

Each `createServerFn(...)` lives in its own per-handler file. **Do not** collect multiple createServerFn definitions in a shared helper file (e.g. `base-service.ts`) that other modules import.

**Why this is load-bearing**: `@tanstack/react-start` v1.167+ ships a `tanstack-start-core:import-protection` Vite plugin that walks the import graph and rejects any module reachable from a client route that imports `@tanstack/react-start/server` — even via dynamic `await import(...)`. If a shared file houses both the createServerFn definitions AND server-only helpers (e.g. `getUser`, `loadEntityConfig`), then a single client-reachable importer (`~/utils/query/queries.ts`, `~/utils/query/mutations.ts`, any route loader) drags the whole server-only chain into the client compile pass and the dev server / build fails.

Per-handler files keep `base-service.ts`-style modules off the client-reachable graph: the per-handler file only re-exports its `createServerFn`, and the framework's compile-time handler extraction strips the body (with its dynamic imports of the helpers) before the client bundle is emitted.

Pattern in this repo: [src/functions/find-first.ts](src/functions/find-first.ts), [src/functions/find-many.ts](src/functions/find-many.ts), [src/functions/create-entity.ts](src/functions/create-entity.ts), [src/functions/update-entity.ts](src/functions/update-entity.ts), [src/functions/delete-entity.ts](src/functions/delete-entity.ts) each export exactly one createServerFn; [src/functions/base-service.ts](src/functions/base-service.ts) houses only the shared entity registry, validators, error formatter, and the `getUser` / `loadEntityConfig` helpers (no createServerFn).

## TSS Rules (mechanical checks)

| Rule | Description |
|---|---|
| TSS-1a | No `setResponseStatus` in createServerFn files (the middleware handles status translation; pre-handler auth helpers that 401/500 are an exception) |
| TSS-1b | No `try/catch` around `accessCheck` calls (let the `authErrorTranslator` translate `NotAuthorizedError`) |
| TSS-2 | No top-level server-only imports in createServerFn files (load-bearing — violations crash the client bundle) |
| TSS-3 | Pure-valibot validators must not co-locate with `pgTable` declarations if shared across client + server |
| TSS-5 | Validators use the canonical `.issues.map((i) => i.message).join("; ")` form |
| TSS-6 | One `createServerFn` per file; no shared file housing multiple createServerFn surfaces + server-only helpers (load-bearing on v1.167+ import-protection) |
| TSS-7 | Auth helpers single source of truth — no bare `getRequest()` or direct `auth.api.getSession()` in createServerFn files; route through `~/server/auth/session.ts` (`getOptionalSessionUser` / `requireAuthedUser`) |

**TSS-2 is the load-bearing rule** — violations crash the client bundle with `Buffer is not defined` or pull Drizzle / `postgres-js` into the browser. A mechanical CI gate (`bun run check-tss-2`) enforces it.

**TSS-7** prevents regressions where a future PR re-introduces inline session loading that bypasses the helpers' Playwright shortcut + `Set-Cookie` forwarding + defensive `getRequest()` context handling. CI gate: `bun run check-tss-7`. Locally: `CHANGED="path1 path2" bash scripts/check-tss-7.sh` for diff-mode against a few files.

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

## Auth helpers — single source of truth (REQUIRED)

Three central helpers in `~/server/auth/` own every session-loading flow in the codebase. **Use these instead of calling `getRequest()` / `auth.api.getSession()` directly** in createServerFn handlers, middleware, or any other server-only code:

| Helper | Returns | Use when |
|---|---|---|
| [`getSessionRequest()`](src/server/auth/request.ts) | `Request \| null` | You need the raw `Request` and want the `getRequest()` v1.134+ throw-on-missing-context handled in one place. |
| [`getOptionalSessionUser({ freshFromDb? })`](src/server/auth/session.ts) | `SessionUser \| null` | The anonymous path is valid (session probes, marketing pages, optional auth). |
| [`requireAuthedUser({ freshFromDb? })`](src/server/auth/session.ts) | `SessionUser` (throws 401 otherwise) | The handler already requires a session — typical authed action. |

Both `getOptionalSessionUser` and `requireAuthedUser` automatically:
- Honor the Playwright test-auth header shortcut.
- Wrap `getRequest()` in the defensive try/catch (no caller-visible throw on missing AsyncLocalStorage context).
- Call `auth.api.getSession({ asResponse: true })` and forward `Set-Cookie` headers from session refresh.
- Accept `{ freshFromDb: true }` to bypass better-auth's cookie cache when the caller needs to observe a role/permission change written earlier in the same session.

### Failure mode that this design prevents

`getRequest()` from `@tanstack/react-start/server` resolves the per-request `Request` from TanStack Start's AsyncLocalStorage context. Since v1.134+ the call **throws** (not returns `undefined`) when the context isn't active — which happens routinely during SSR query prefetch / dehydration. An unhandled throw poisons the React Query cache (`fetchFailureReason: TypeError`) on every SSR page render, breaks `setResponseHeader("Set-Cookie", …)` calls that depend on getting `request` first, and noisily alerts Sentry / Rollbar / Axiom.

Before the helpers landed, the defensive try/catch lived inline in five separate call sites and getting one of them wrong (which this PR's earlier commits did, twice) broke session refresh + SSR-time error monitoring. **The whole point of routing through the helpers is that the rule can't be forgotten.** If TanStack Start changes the semantics again (it has, twice — 1.134 and 1.167), one edit in `~/server/auth/request.ts` propagates everywhere.

### Direct `getRequest()` usage — when it's still OK

`~/utils/test/playwright.ts` is the only file that calls `getRequest()` directly without going through `getSessionRequest()`. It needs to be sync (it's invoked at the top of the auth helpers themselves before any await), so wrapping its `getRequest()` call inline with try/catch is OK there. Every other file MUST go through `~/server/auth/session.ts`.

### Testing the auth helpers — Vitest mock limitations

`vi.spyOn(module, "fn")` replaces the property on the module object, but a destructured `const { fn } = await import(...)` captured the ORIGINAL reference and won't see the spy. Two mitigations applied throughout this codebase:

1. **In helpers, call through the module namespace, not destructured:**

   ```typescript
   // ❌ Destructured — vi.spyOn can't intercept after this binding
   const { getSessionRequest } = await import("./request");
   const request = await getSessionRequest();

   // ✅ Through the module namespace — vi.spyOn intercepts correctly
   const requestModule = await import("./request");
   const request = await requestModule.getSessionRequest();
   ```

   `src/server/auth/session.ts` and `src/server/auth/request.ts` follow this convention.

2. **In tests, mock at the helper layer (not at the framework layer):**

   ```typescript
   // ❌ Doesn't propagate to dynamic-import call sites that destructured
   vi.mocked(getRequest).mockReturnValueOnce(null);

   // ✅ Mock the chokepoint that handlers actually call
   const requestModule = await import("~/server/auth/request");
   vi.spyOn(requestModule, "getSessionRequest").mockResolvedValueOnce(null);
   ```

### Test mock shape — duck-typed `Response`, NOT `new Response(JSON.stringify(...))`

`auth.api.getSession({ asResponse: true })` returns a `Response`. The obvious "wrap in `new Response(JSON.stringify(payload))`" approach round-trips Dates to ISO strings, breaking any test that asserts a full user object including `createdAt: fixedDate` (a Date instance) against `accessCheck` calls.

The codebase exports `makeMockSessionResponse(payload)` from [src/test/setup.ts](src/test/setup.ts) — use it instead of constructing the shape inline:

```typescript
// ✅ Preserves Date instances — `json()` returns the original reference
vi.mocked(auth.api.getSession).mockResolvedValueOnce(
  makeMockSessionResponse({ session: null, user: null }) as any
);
```

The global default mock in `src/test/setup.ts` also returns this duck-typed shape, so tests that don't override it still match production's `asResponse: true` call.

## Mechanical check script (TSS-2)

See [scripts/check-tss-2.sh](scripts/check-tss-2.sh). Run via `bun run check-tss-2`. CI gates merge on a hit. Failing locally means a createServerFn file gained a top-level server-only import — convert it to a dynamic import inside the handler.

Implementation notes worth banking:

- The script requires **ripgrep (`rg`)** for `--multiline --multiline-dotall -nP` (POSIX `grep -P` is GNU-only and can't match across lines). The guard at the top of the script gives an install hint when missing. CI installs it via `apt-get install ripgrep` in the workflow — ubuntu-latest does not ship with it.
- The two carve-outs (`import type { … }` and `~/server/db/schema/*-schemas.ts`) live in **PCRE negative lookaheads inside the main regex**, not in post-filter `grep -v` pipes. Earlier versions used pipes and silently missed multi-line imports — `rg --multiline` matches the whole block as one logical hit but emits each line separately, so a `type` keyword on line 1 was stripped before the path-matched line was emitted. The lookahead approach fires BEFORE any path matching and correctly skips the whole match regardless of line layout.
- All character classes use **POSIX `[[:space:]]` etc., NOT `\s` / `\d` / `\w`**. BSD grep (macOS default `/usr/bin/grep`) treats `\s` as the literal `s`.
- When ripping out a Vite alias (e.g. removing `src/polyfills/use-sync-external-store-shim.ts`), grep `.storybook/`, `vitest.config*`, and any per-tool config for the same find-key. A single `vite.config.ts` edit is not sufficient when the project has parallel toolchains — Storybook's `viteFinal` and Vitest configs maintain their own alias blocks.

## Real-browser validation for bundling PRs

When a PR touches `vite.config.ts`, the bundler config, the dynamic-import / shim layer, anything chunk-graph-shaped, SSR boundaries, or env-validation — drive a preview deploy in a real browser before merging. See [docs/development/engineering-workflow.md](docs/development/engineering-workflow.md).
