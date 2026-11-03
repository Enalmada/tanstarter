/**
 * Last line of defense for `$exception` events, applied in `before_send` on
 * both the browser and server PostHog clients.
 *
 * Filtering the properties callers pass in is not enough: the SDKs add their
 * own (`$current_url`, exception messages and cause chains) after that.
 * - URLs lose their query string and fragment (they can carry tokens).
 * - Drizzle's "Failed query" message ends with the bound parameters, which are
 *   row values (emails, titles): everything from `params:` on is dropped. Its
 *   cause is the driver's error (Neon, Postgres), whose message can carry a
 *   rejected literal or a raw HTTP body: the whole message is replaced.
 * - Stack frames lose their source lines (`context_line` and friends): posthog-node
 *   adds them for server code, and they are not needed to group an issue.
 * - Unhandled rejections of expected errors (which bypass `isExpectedError`
 *   because PostHog captures them itself) are dropped by error name.
 *
 * Analytics events keep their URLs, except the password-reset page's, whose
 * `?token=` is a live credential: the automatic pageview would otherwise send it
 * to anyone who can read analytics.
 */

import { isExpectedErrorName } from "./expected-errors";

interface ExceptionEntry {
	type?: unknown;
	value?: unknown;
	stacktrace?: { frames?: Array<Record<string, unknown>> };
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

// Database driver errors: their messages can echo the value that was rejected
const DATABASE_ERROR_TYPES = new Set(["NeonDbError", "DatabaseError", "PostgresError"]);
const REDACTED_DATABASE_ERROR = "[redacted database error]";

const SOURCE_CONTEXT_FIELDS = ["context_line", "pre_context", "post_context"];

export function redactExceptionMessage(message: string): string {
	const index = message.indexOf("\nparams:");
	return index === -1 ? message : `${message.slice(0, index)}\nparams: [redacted]`;
}

// A password-reset page URL carries a live credential (`?token=`, or the token as the last path segment)
const RESET_PASSWORD_URL = /\/reset-password(?:[/?#]|$)/;

/** Drops the token from a password-reset page URL; any other URL is returned unchanged. */
export function stripResetToken(url: string): string {
	if (!RESET_PASSWORD_URL.test(url)) return url;
	return stripUrlDetails(url).replace(/(\/reset-password)\/[^/]+$/, "$1");
}

function stripUrls(bag: Record<string, unknown> | undefined, strip: (url: string) => string) {
	if (!bag) return;
	for (const key of URL_PROPERTIES) {
		const value = bag[key];
		if (typeof value === "string") bag[key] = strip(value);
	}
}

/** Returns the sanitized event, or null to drop it. Mutates and returns `event`. */
export function sanitizeEvent<T extends EventLike>(event: T | null): T | null {
	if (!event) return event;
	if (event.event !== "$exception") {
		// Analytics events keep their URLs, except the one that holds a reset token
		stripUrls(event.properties, stripResetToken);
		stripUrls(event.$set, stripResetToken);
		stripUrls(event.$set_once, stripResetToken);
		stripUrls(event.properties?.$set as Record<string, unknown> | undefined, stripResetToken);
		stripUrls(event.properties?.$set_once as Record<string, unknown> | undefined, stripResetToken);
		return event;
	}

	const properties = event.properties;
	const list = properties?.$exception_list;
	if (Array.isArray(list)) {
		const entries = list as ExceptionEntry[];
		if (entries.some((entry) => typeof entry.type === "string" && isExpectedErrorName(entry.type))) return null;
		for (const entry of entries) {
			if (typeof entry.value === "string") {
				entry.value =
					typeof entry.type === "string" && DATABASE_ERROR_TYPES.has(entry.type)
						? REDACTED_DATABASE_ERROR
						: redactExceptionMessage(entry.value);
			}
			for (const frame of entry.stacktrace?.frames ?? []) {
				if (typeof frame.filename === "string") frame.filename = stripUrlDetails(frame.filename);
				for (const field of SOURCE_CONTEXT_FIELDS) delete frame[field];
			}
		}
	}

	stripUrls(properties, stripUrlDetails);
	stripUrls(event.$set, stripUrlDetails);
	stripUrls(event.$set_once, stripUrlDetails);
	stripUrls(properties?.$set as Record<string, unknown> | undefined, stripUrlDetails);
	stripUrls(properties?.$set_once as Record<string, unknown> | undefined, stripUrlDetails);
	return event;
}
