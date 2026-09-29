# Monitoring

Errors go to [PostHog error tracking](https://posthog.com/docs/error-tracking), the same project as product analytics. The `ErrorMonitor` interface (`types.ts`) keeps call sites provider-agnostic.

## Setup

Set the PostHog project API key (`phc_...`, public) in `.env` (in production it is a runtime secret, read by both the server and, through the SSR snapshot, the browser; the Docker build needs no key):

```env
PUBLIC_POSTHOG_API_KEY=phc_your_key
```

Errors are reported only when `APP_ENV` isn't `development`, so local dev doesn't mix into real issues. To try it locally, run a production build with `APP_ENV=staging`. Analytics runs whenever the key is set.

## What gets captured

| Where | How | Code |
| --- | --- | --- |
| Browser: uncaught errors, unhandled rejections | posthog-js `capture_exceptions` | `client.ts` |
| Browser: errors caught by router error components (loaders, render) | `useReportError` in `DefaultCatchBoundary` and route `errorComponent`s | `report.ts` |
| Browser: manual | `useMonitor().error()` / `.warn()` | `hooks.ts`, `client.ts` |
| Server functions | global function middleware, with the signed-in user's id | `src/server/monitoring/middleware.ts` |
| Server routes (`/api/*`, `/health`) | global request middleware, with the signed-in user's id when there is one | `src/server/monitoring/middleware.ts` |
| Everything else on the server (`uncaughtException`, `unhandledRejection`, errors outside the handlers above) | Nitro `error` hook; flushed on the `close` hook (SIGTERM) | `src/server/monitoring/nitro-plugin.ts` |

**Not captured (expected errors):** router `redirect()`/`notFound()`, 4xx domain errors (`BadRequestError`, `NotAuthorizedError`, `NotFoundError`, `ConflictError`, anything with `HttpErrorHints` below 500), and server functions that set a 4xx status before throwing. See `expected-errors.ts`.

**Privacy:** exception properties carry metadata only: source, path (no query string), server function name, and caller-chosen primitive values. Request payloads and nested objects are dropped (`capture.ts`). Both clients also run every `$exception` event through `sanitize.ts` in `before_send`, because the SDKs add their own fields: URLs lose their query string and fragment, Drizzle's `Failed query … params: …` messages (which end with bound row values) are cut before the params, database driver errors (`NeonDbError`, …: their messages can echo a rejected value) lose their message, stack frames lose their source lines, and automatically captured expected errors (unhandled rejections of a `NotFoundError`, …) are dropped. Analytics events keep their URLs. One rule stays with you: an error message you write yourself must not embed user data (emails, ids from a request), since messages and `cause` chains are sent as they are.

**Known limitation:** an unexpected server-function error is reported by the server (with the user's id) and, if it reaches a router error component, again by the browser. Only the message crosses the wire, so the two can't be linked yet.

**Not yet:** source maps. Production stack traces are minified until hidden source maps are uploaded with the PostHog CLI (a follow-up).

## Usage

### Manual reporting

```tsx
import { useMonitor } from "~/lib/monitoring/hooks";

function MyComponent() {
	const monitor = useMonitor();

	try {
		// Some risky operation
	} catch (error) {
		monitor.error("Operation failed", error);
	}
}
```

`info`, `debug` and `breadcrumb` add exception steps: context attached to the next captured exception, not issues of their own.

### Route error components

`DefaultCatchBoundary` (the router default) already reports. A route with its own `errorComponent` should call `useReportError(error, "router:/path")`.

### Server code outside server functions

```ts
const { captureServerException } = await import("~/server/monitoring/posthog");
captureServerException(error, { properties: { source: "cron" } });
```

Import it dynamically from anything reachable from a client route (TSS-2).

## Logging

`logger` (`src/utils/logger.ts`, server only) writes structured lines: `logger.info`, `logger.error` and, in development only, `logger.debug`. Log ids and metadata, never request bodies, tokens or personal data.

- **Development** (`APP_ENV=development`): console only. A local `.env` with an Axiom token never ships logs.
- **Elsewhere**, with `AXIOM_TOKEN` and `AXIOM_DATASET_NAME` set: events are batched to Axiom about once a second, and info goes only there. Error lines also always go to the console, so Fly's log stream keeps them when Axiom is unreachable. Set `AXIOM_URL` for an EU-region dataset (for example `https://api.eu.axiom.co`).
- **Failures:** Axiom's `ingest` returns nothing, so there is no promise to catch. Transport and HTTP errors (network failure, 401, 5xx) land in the client's `onError`, which writes one `Axiom ingest failed` console line. A successful response that rejects individual events (`failed > 0`) is not reported by the SDK's batching path, so those events are lost silently.
- **Shutdown:** the Nitro `close` hook (`src/server/monitoring/nitro-plugin.ts`) flushes the queue and PostHog together, each capped at 3 seconds so one slow sink cannot hold the other. The hook runs after Nitro has stopped the server and drained in-flight requests, so on a slow deploy the total can still pass Fly's 5 second kill timeout and the last events may be lost. `auto_stop_machines = 'suspend'` freezes the process instead of stopping it, so queued events go out late, not lost.

## Testing

Visit `/debug/monitoring`. It covers the error boundary, uncaught errors, unhandled rejections, caught errors, monitor messages and steps, and (for admins) server-function errors: one unexpected (reported with your user id) and one expected 404 (not reported).
