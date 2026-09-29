/**
 * Nitro runtime plugin (registered in nitro.config.ts): reports errors that
 * reach Nitro to PostHog and flushes on shutdown.
 *
 * Nitro's `error` hook receives unhandled request errors and process-level
 * `uncaughtException` / `unhandledRejection`, so posthog-node's own exception
 * autocapture stays off (it would send those twice). Server-function errors
 * never get here, and neither do server-route errors (both are reported by
 * src/server/monitoring/middleware.ts).
 */

import { definePlugin } from "nitro";
import { requestPath } from "~/lib/monitoring/request-path";
import { captureServerException, shutdownServerPosthog } from "./posthog";

export default definePlugin((nitroApp) => {
	nitroApp.hooks.hook("error", (error, context) => {
		captureServerException(error, {
			properties: {
				source: "nitro",
				tags: context.tags?.join(",") ?? null,
				// Path only: query strings can carry tokens or personal data.
				path: context.event ? requestPath(context.event.req.url) : null,
			},
		});
	});

	nitroApp.hooks.hook("close", async () => {
		await shutdownServerPosthog();
	});
});
