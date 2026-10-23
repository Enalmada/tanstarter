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

## Sign-in policy

Defined once in `src/server/auth/policy.ts` and unit-tested in `__tests__/policy.test.ts`.

- **Email verification.** Email/password sign-ups get no session until they follow the emailed link (valid for `VERIFICATION_LINK_MINUTES`, 60). Following it verifies the address but deliberately does not sign anyone in (`autoSignInAfterVerification: false`): the link proves who controls the mailbox, not who chose the password, so a squatter who registered someone else's address could otherwise get the owner to sign the squatter's account in. Signing in early re-sends the link. Google sign-ins arrive verified. The link's `callbackURL` is the sign-in page (`verificationCallback`), which forwards a signed-in visitor to their destination and explains an expired or invalid link from `?error=`. Sign-up answers the same way (status and body) for an address that already has an account, and the confirmation text is worded to match. It is not airtight: signing up and then signing in shows whether you just created the account, as does a simultaneous duplicate sign-up (422). Hiding the provider round trip hides only part of the timing difference; a new address still does extra database writes. Google never links into an existing email/password account (`disableImplicitLinking`), for the same squatting reason: otherwise the squatter's row, verified when the owner follows the link, would absorb the owner's Google sign-in while the squatter's password kept working. The link is built from `PUBLIC_APP_URL` (falling back to localhost), so set it wherever mail is sent. Mail goes through Resend (`src/server/email/`): set `RESEND_API_KEY` and `EMAIL_FROM` in production, otherwise email sign-up is switched off for every address (`disableSignUp`, decided by `emailDelivery`) rather than creating accounts nobody can verify; Google sign-in still works. A send the provider rejects at runtime is logged, and the person gets a new link by signing in. Locally with neither set, the link is printed to the server log. PR previews (`fly-review.yml`) get them from the repository secret `RESEND_API_KEY` and variable `EMAIL_FROM`; unset, email sign-up is off on that preview and Google sign-in still works. The Playwright dev server (`isPlaywrightServer`) skips verification because the e2e run has no inbox.
- **Passwords.** At least 12 characters, at most 128, no composition rules (`src/lib/auth/password-policy.ts`, shared with the sign-up form). The minimum applies when a password is set; existing shorter passwords still sign in.
- **Sessions.** Sliding: a session ends after 7 days without use and is extended at most once a day while in use. There is no absolute lifetime cap and no 2FA yet.
- **Audit trail.** `src/server/auth/audit.ts` logs one `audit.auth` line per sign-up, sign-in, sign-out, email verification and OAuth callback that better-auth answers (an unexpected server error returns 500 and goes to the error log instead), with the outcome, the error code and the client IP (same `fly-client-ip` header as the rate limiter). It records the user id when the endpoint has a session (sign-out lines carry only the IP), never the email or password. Lines reach Axiom when it is configured. Server functions that change data log an `audit.mutation` line the same way (`src/server/auth/mutation-audit.ts`): the action, entity type and id, outcome, HTTP status of a failure, user id and client IP, never field values or error messages. It covers the app's own server functions only: better-auth's account endpoints (change password, delete account, link or unlink a provider) are not audited here. Wrap the handler of every new data-changing POST function: `.handler(audited("name", describe, handler))` (`src/functions/audited.ts`); `auth-wiring.test.ts` fails if one is missing, unless it is listed as not storing data.

## better-auth invariants

- The user table's `role` and other server-owned fields are not settable from sign-up input (`input: false` in `src/server/auth/user-fields.ts`). Keep it that way when adding fields.
- Do not rename better-auth models with `modelName`; the relations-v2 adapter derives relation keys from the default names. `src/server/auth/adapter-schema.ts` explains why.
- Disable endpoints you do not use through `disabledPaths` rather than leaving them reachable.

## Testing auth

- E2E uses seeded users (`member@playwright.local`, `admin@playwright.local`, created by `bun run drizzle:seed`) and stored auth state from `src/e2e/auth/*.setup.ts`. The test-auth header shortcut works only when the server runs with `NODE_ENV=development` and `PLAYWRIGHT=true` (`src/utils/test/playwright.ts`).
- Unit tests for the session helpers have mock-shape rules (spy on the module namespace, duck-typed `Response`); see the skill's "Testing the auth helpers" section.
