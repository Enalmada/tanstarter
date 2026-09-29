/**
 * Helpers shared by the client and server PostHog capture paths.
 */

export const POSTHOG_HOST = "https://us.i.posthog.com";

export type CaptureProperties = Record<string, string | number | boolean | null>;

/**
 * Normalizes an `ErrorMonitor` call (`monitor.error("context", err)` or
 * `monitor.error("message", { key: value })`) into an error plus properties.
 *
 * Privacy: only top-level primitive values from `extra` are kept, so request
 * payloads, records or nested objects can't ride along into PostHog.
 */
export function toCapture(message: string | Error, extra?: unknown): { error: unknown; properties: CaptureProperties } {
	const properties: CaptureProperties = {};

	if (extra instanceof Error) {
		if (typeof message === "string") properties.context = message;
		return { error: extra, properties };
	}

	if (extra && typeof extra === "object" && !Array.isArray(extra)) {
		for (const [key, value] of Object.entries(extra)) {
			if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
				properties[key] = value as string | number | boolean | null;
			}
		}
	}

	return { error: message instanceof Error ? message : new Error(message), properties };
}
