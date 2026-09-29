/**
 * Report errors caught by router error components.
 *
 * Router error components catch loader and render errors before any React
 * boundary or `window.onerror`, so PostHog's autocapture never sees them.
 * posthog-js is loaded on demand to keep it out of the main chunk. Errors
 * rendered during SSR are reported here once the client hydrates; errors the
 * server handles itself are captured server-side (src/server/monitoring).
 */

import { useEffect } from "react";
import type { CaptureProperties } from "./capture";
import { isExpectedError } from "./expected-errors";

export function reportError(error: unknown, properties?: CaptureProperties) {
	if (typeof window === "undefined" || isExpectedError(error)) return;
	import("./client")
		.then((mod) => mod.captureClientError(error, properties))
		.catch(() => {
			// Reporting must never break the error UI
		});
}

export function useReportError(error: unknown, source: string) {
	useEffect(() => {
		reportError(error, { source });
	}, [error, source]);
}
