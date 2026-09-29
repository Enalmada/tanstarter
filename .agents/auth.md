# Auth

Authentication is [better-auth](https://www.better-auth.com); authorization is CASL (`src/server/access/`). The session helpers, middleware and guards are documented in detail in the [tanstack-start skill](../.claude/skills/tanstack-start/SKILL.md) (sections "Auth helpers" and "Routes and guards"); this is the short version.

## Route guards

Pages are grouped by audience with pathless layout routes:

| Folder | Who | Guard |
|---|---|---|
| `src/routes/*.tsx` | anyone | none |
| `src/routes/_guest/` | signed-out visitors | `redirectIfSignedIn` |
| `src/routes/_authed/` | signed-in users | `requireUser` |
| `src/routes/_authed/_admin/` | admins | `requireAdmin` |

Put a protected page in the matching folder; do not write per-route `beforeLoad` checks. Guards (`src/lib/auth/guards.ts`) decide where to send people. They are not the security boundary.

`?redirect=` values go through `safeRedirect`: same-origin paths only, never `//host`, backslashes, control characters or the auth pages. Use it anywhere a redirect target comes from the user.

## Server-side checks

- Every server function that needs a user uses a middleware from `src/functions/auth-middleware.ts`: `authMiddleware` (reads better-auth's cookie-cached session, fine when the action does not depend on the caller's current role) or `freshAuthMiddleware` (re-reads the user row, use it for authorization decisions and role changes). `auth-wiring.test.ts` enforces this.
- Outside server functions (API routes, SSE), use `getOptionalSessionUser()` or `requireAuthedUser()` from `src/server/auth/session.ts`. Do not call `getRequest()` or `auth.api.getSession()` directly.
- Authorization (who may read or write which rows) is CASL: `src/server/access/ability.ts`, applied by the read filter and write guard used by the CRUD handlers.

## Roles

- Roles are `MEMBER` and `ADMIN` (`UserRole`). Sign-ups are members. An email listed in `ADMIN_EMAILS` is promoted to admin only when its user row is first created by a verified provider sign-in (OAuth), never by an email/password sign-up, sign-in or account link (`src/server/auth/admin-emails.ts` explains the squatting risk).
- The Profile page's "Make Admin / Remove Admin" toggle exists only for local development (`APP_ENV=development` and a non-production runtime) or when `DEMO_MODE=true` (`src/server/access/role-self-service.ts`).

## better-auth invariants

- The user table's `role` and other server-owned fields are not settable from sign-up input (`input: false` in `src/server/auth/user-fields.ts`). Keep it that way when adding fields.
- Do not rename better-auth models with `modelName`; the relations-v2 adapter derives relation keys from the default names. `src/server/auth/adapter-schema.ts` explains why.
- Disable endpoints you do not use through `disabledPaths` rather than leaving them reachable.

## Testing auth

- E2E uses seeded users (`member@playwright.local`, `admin@playwright.local`, created by `bun run drizzle:seed`) and stored auth state from `src/e2e/auth/*.setup.ts`. The test-auth header shortcut works only when the server runs with `NODE_ENV=development` and `PLAYWRIGHT=true` (`src/utils/test/playwright.ts`).
- Unit tests for the session helpers have mock-shape rules (spy on the module namespace, duck-typed `Response`); see the skill's "Testing the auth helpers" section.
