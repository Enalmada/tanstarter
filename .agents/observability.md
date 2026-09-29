# Observability

Two separate channels: **logs** (Axiom plus the console, `src/utils/logger.ts`) and **errors** (PostHog error tracking). The details, environment variables and shutdown behavior are in [src/lib/monitoring/README.md](../src/lib/monitoring/README.md).

## Logging

- Use `logger.info`, `logger.error` and, for local development only, `logger.debug`. It is server-only: import it dynamically from code a client route can reach (TSS-2).
- Log ids and metadata, never request bodies, tokens, passwords, emails or other personal data. Prefer a stable message plus a data object (`logger.info("task created", { taskId })`) over interpolating values into the message.
- Errors also always reach the console, so they survive an Axiom outage. Axiom is off in development and when the token or dataset is not set.
- Do not call `console.*` anywhere else, and do not log inside a loop over rows.

## Errors

- Unexpected server errors are reported to PostHog by the server-function middleware (`src/server/monitoring/middleware.ts`), the request reporter for server routes and the Nitro plugin. Expected errors (redirects, 4xx domain errors) are skipped. Do not report the same error twice.
- Browser errors go through the monitor in `src/lib/monitoring/`. Use `reportError` from `~/lib/monitoring/report` for errors you catch and still want to know about.
- Typed domain errors (`src/server/access/http-errors.ts`) carry a safe message for the client; nothing else about the failure reaches the wire.

## Shutdown

The Nitro `close` hook flushes the PostHog client and the log queue together. If you add another buffered sink, flush it in the same hook so the caps do not add up past the platform's kill timeout.
