/**
 * Last line of defense for `$exception` events, applied in `before_send` on
 * both the browser and server PostHog clients.
 *
 * Filtering the properties callers pass in is not enough: the SDKs add their
 * own (`$current_url`, exception messages and cause chains) after that.
 * - URLs lose their query string and fragment (they can carry tokens).
 * - Drizzle's "Failed query" message ends with the bound parameters, which are
 *   row values (emails, titles): everything from `params:` on is dropped.
 * - Unhandled rejections of expected errors (which bypass `isExpectedError`
 *   because PostHog captures them itself) are dropped by error name.
 *
 * Only `$exception` events are touched: analytics events keep their URLs.
 */

import { isExpectedErrorName } from "./expected-errors";

interface ExceptionEntry {
	type?: unknown;
	value?: unknown;
	stacktrace?: { frames?: Array<{ filename?: unknown }> };
}

interface EventLike {
	event: string;
	properties?: Record<string, unknown> | undefined;
	$set?: Record<string, unknown> | undefined;
	$set_once?: Record<string, unknown> | undefined;
}

// Properties that hold a page URL (posthog-js also nests them in $set/$set_once)
const URL_PROPERTIES = [
	"$current_url",
	"$referrer",
	"$initial_current_url",
	"$initial_referrer",
	"$session_entry_url",
	"$session_entry_referrer",
];

export function stripUrlDetails(url: string): string {
	return url.replace(/[?#].*$/s, "");
}

export function redactExceptionMessage(message: string): string {
	const index = message.indexOf("\nparams:");
	return index === -1 ? message : `${message.slice(0, index)}\nparams: [redacted]`;
}

function stripUrls(bag: Record<string, unknown> | undefined) {
	if (!bag) return;
	for (const key of URL_PROPERTIES) {
		const value = bag[key];
		if (typeof value === "string") bag[key] = stripUrlDetails(value);
	}
}

/** Returns the sanitized event, or null to drop it. Mutates and returns `event`. */
export function sanitizeExceptionEvent<T extends EventLike>(event: T | null): T | null {
	if (event?.event !== "$exception") return event;

	const properties = event.properties;
	const list = properties?.$exception_list;
	if (Array.isArray(list)) {
		const entries = list as ExceptionEntry[];
		if (entries.some((entry) => typeof entry.type === "string" && isExpectedErrorName(entry.type))) return null;
		for (const entry of entries) {
			if (typeof entry.value === "string") entry.value = redactExceptionMessage(entry.value);
			for (const frame of entry.stacktrace?.frames ?? []) {
				if (typeof frame.filename === "string") frame.filename = stripUrlDetails(frame.filename);
			}
		}
	}

	stripUrls(properties);
	stripUrls(event.$set);
	stripUrls(event.$set_once);
	stripUrls(properties?.$set as Record<string, unknown> | undefined);
	stripUrls(properties?.$set_once as Record<string, unknown> | undefined);
	return event;
}
