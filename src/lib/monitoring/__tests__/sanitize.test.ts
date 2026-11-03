import { describe, expect, it } from "vitest";
import { maskNetworkRequest, redactExceptionMessage, sanitizeEvent, stripUrlDetails } from "~/lib/monitoring/sanitize";

function exceptionEvent(overrides: Record<string, unknown> = {}) {
	return {
		event: "$exception",
		properties: {
			$current_url: "https://app.example.com/reset?token=abc#frag",
			$referrer: "https://mail.example.com/?utm=x",
			$exception_list: [{ type: "Error", value: "boom" }],
			...overrides,
		},
		$set_once: { $initial_current_url: "https://app.example.com/a?b=c" },
	};
}

describe("stripUrlDetails", () => {
	it("drops the query string and the fragment", () => {
		expect(stripUrlDetails("https://x.test/a/b?token=1#h")).toBe("https://x.test/a/b");
		expect(stripUrlDetails("https://x.test/a#h?x")).toBe("https://x.test/a");
		expect(stripUrlDetails("https://x.test/a")).toBe("https://x.test/a");
	});
});

describe("maskNetworkRequest", () => {
	const entry = {
		name: "https://x.test/reset-password?token=live-secret",
		entryType: "navigation",
		startTime: 1,
		duration: 5,
		initiatorType: "navigation" as const,
		status: 200,
		isInitial: true,
		requestHeaders: { authorization: "Bearer live-secret" }, // betterleaks:allow
		requestBody: JSON.stringify({ token: "live-secret", newPassword: "hunter2hunter2" }), // betterleaks:allow
		responseHeaders: { "set-cookie": "session=live-secret" }, // betterleaks:allow
		responseBody: '{"session":"live-secret"}',
		// Chromium adds further URLs to a serialized navigation entry
		notRestoredReasons: { url: "https://x.test/reset-password?token=live-secret", children: [] },
	};

	it("keeps timing, sizes and status, with the URL stripped of a reset token", () => {
		// The browser adds fields the SDK's type does not list
		const browserEntry = { ...entry, responseStatus: 200, transferSize: 512, nextHopProtocol: "h2" };
		expect(maskNetworkRequest(browserEntry)).toEqual({
			name: "https://x.test/reset-password",
			entryType: "navigation",
			startTime: 1,
			duration: 5,
			initiatorType: "navigation",
			status: 200,
			isInitial: true,
			responseStatus: 200,
			transferSize: 512,
			nextHopProtocol: "h2",
		});
	});

	it("drops headers, bodies and every field it does not know", () => {
		expect(JSON.stringify(maskNetworkRequest(entry))).not.toContain("live-secret");
	});
});

describe("redactExceptionMessage", () => {
	it("drops Drizzle's bound params", () => {
		const message = "Failed query: insert into task (title) values ($1)\nparams: Secret title,person@example.com";
		expect(redactExceptionMessage(message)).toBe(
			"Failed query: insert into task (title) values ($1)\nparams: [redacted]",
		);
	});

	it("leaves other messages alone", () => {
		expect(redactExceptionMessage("boom")).toBe("boom");
	});
});

describe("sanitizeEvent", () => {
	it("strips URL details from properties and $set_once", () => {
		const event = sanitizeEvent(exceptionEvent());
		expect(event?.properties?.$current_url).toBe("https://app.example.com/reset");
		expect(event?.properties?.$referrer).toBe("https://mail.example.com/");
		expect(event?.$set_once?.$initial_current_url).toBe("https://app.example.com/a");
	});

	it("redacts every entry of the exception list, causes included", () => {
		const event = sanitizeEvent(
			exceptionEvent({
				$exception_list: [
					{ type: "DrizzleQueryError", value: "Failed query: q\nparams: a@b.c" },
					{ type: "Error", value: "cause\nparams: secret" },
				],
			}),
		);
		expect(JSON.stringify(event)).not.toMatch(/a@b\.c|secret/);
	});

	it("replaces the message of a database driver error, which can echo a rejected value", () => {
		const event = sanitizeEvent(
			exceptionEvent({
				$exception_list: [
					{ type: "NeonDbError", value: 'invalid input syntax for type integer: "a@b.c"' },
					{ type: "DatabaseError", value: "Server error (HTTP status 500): a@b.c" },
					{ type: "Error", value: "kept" },
				],
			}),
		);
		const list = event?.properties?.$exception_list as Array<{ type: string; value: string }>;
		expect(list.map((entry) => entry.value)).toEqual([
			"[redacted database error]",
			"[redacted database error]",
			"kept",
		]);
		expect(JSON.stringify(event)).not.toContain("a@b.c");
	});

	it("removes source lines from stack frames", () => {
		const frame = {
			filename: "ssr.mjs",
			function: "GET",
			context_line: "throw new Error(email)",
			pre_context: ["a"],
			post_context: ["b"],
		};
		const event = sanitizeEvent(
			exceptionEvent({ $exception_list: [{ type: "Error", value: "x", stacktrace: { frames: [frame] } }] }),
		);
		const list = event?.properties?.$exception_list as unknown as Array<{
			stacktrace: { frames: Array<Record<string, unknown>> };
		}>;
		expect(list[0]?.stacktrace.frames[0]).toEqual({ filename: "ssr.mjs", function: "GET" });
	});

	it("strips query strings from stack frame filenames", () => {
		const event = sanitizeEvent(
			exceptionEvent({
				$exception_list: [
					{ type: "Error", value: "x", stacktrace: { frames: [{ filename: "https://x.test/a.js?v=tok" }] } },
				],
			}),
		);
		const list = event?.properties?.$exception_list as unknown as Array<{
			stacktrace: { frames: Array<{ filename: string }> };
		}>;
		expect(list[0]?.stacktrace.frames[0]?.filename).toBe("https://x.test/a.js");
	});

	it("drops automatically captured expected errors", () => {
		expect(sanitizeEvent(exceptionEvent({ $exception_list: [{ type: "NotFoundError", value: "x" }] }))).toBeNull();
	});

	it("leaves other events, and their URLs, alone", () => {
		const pageview = { event: "$pageview", properties: { $current_url: "https://x.test/a?utm_source=news" } };
		expect(sanitizeEvent(pageview)).toEqual({
			event: "$pageview",
			properties: { $current_url: "https://x.test/a?utm_source=news" },
		});
		expect(sanitizeEvent(null)).toBeNull();
	});

	it("removes the password-reset token from any event's page URL", () => {
		const pageview = {
			event: "$pageview",
			properties: {
				$current_url: "https://x.test/reset-password?token=live-secret",
				$referrer: "https://x.test/api/auth/reset-password/live-secret?callbackURL=%2Freset-password",
				$set: { $current_url: "https://x.test/reset-password?token=live-secret#f" },
			},
			$set_once: { $initial_current_url: "https://x.test/reset-password?token=live-secret" },
		};
		const event = sanitizeEvent(pageview);
		expect(event?.properties?.$current_url).toBe("https://x.test/reset-password");
		expect(event?.properties?.$referrer).toBe("https://x.test/api/auth/reset-password");
		expect(event?.$set_once?.$initial_current_url).toBe("https://x.test/reset-password");
		expect(JSON.stringify(event)).not.toContain("live-secret");
	});

	it("keeps the query string of a URL that merely resembles the reset page", () => {
		const pageview = {
			event: "$pageview",
			properties: { $current_url: "https://x.test/reset-passwords?utm_source=news" },
		};
		expect(sanitizeEvent(pageview)?.properties?.$current_url).toBe("https://x.test/reset-passwords?utm_source=news");
	});
});
