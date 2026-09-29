# Security

- **CSP.** A per-request nonce and a strict policy are set by `createCspMiddleware` in `src/start.ts`. Allow a new third-party origin in `src/config/cspRules.ts`, not with `unsafe-inline` or `unsafe-eval`. Inline scripts must go through `ScriptOnce`, which applies the nonce.
- **CSRF.** Server functions are cookie-authenticated POST calls, so `createCsrfMiddleware` rejects cross-site ones. better-auth checks the origin on `/api/auth` itself. Do not add a state-changing GET route.
- **Server functions.** Each needs `authMiddleware` or `freshAuthMiddleware`, and authorization is CASL, not a role string comparison in the handler. See [Auth](auth.md).
- **Environment.** Server secrets are declared in `env.config.ts` and never leave the server. Only `APP_ENV` and the keys in `PUBLIC_RUNTIME_ENV_KEYS` (`src/lib/env/public-env.ts`) are copied into the page, from an explicit allowlist. Adding a key there publishes it to every visitor. `bun run check-client-leaks` checks the client bundle for server-only code.
- **Redirects.** User-supplied redirect targets go through `safeRedirect`.
- **Wire payloads.** The global error translator returns only a safe message. Never attach `cause`, stack traces or row data to an error that reaches the client; the serializer would send it.
- **Logs and errors.** Metadata only. Error reports are sanitized before they leave (`src/lib/monitoring/sanitize.ts`): ORM "Failed query" messages carry bound values.
- **Secrets in git.** Betterleaks scans the commits of a branch: `bun run scan:secrets` locally (skips with a warning until it is installed) and in CI (`secret-scan.yml`). Use credential-free example URLs. A reviewed false positive is either an inline `betterleaks:allow` comment or a fingerprint in `.betterleaksignore`.
- **Dependencies.** `bunfig.toml` holds new package versions back for a few days before install. Do not add an exemption to get a fresh release unless the maintainer asks.
