import { describe, expect, it } from "vitest";
import { redactExceptionMessage, sanitizeExceptionEvent, stripUrlDetails } from "~/lib/monitoring/sanitize";

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

describe("sanitizeExceptionEvent", () => {
	it("strips URL details from properties and $set_once", () => {
		const event = sanitizeExceptionEvent(exceptionEvent());
		expect(event?.properties?.$current_url).toBe("https://app.example.com/reset");
		expect(event?.properties?.$referrer).toBe("https://mail.example.com/");
		expect(event?.$set_once?.$initial_current_url).toBe("https://app.example.com/a");
	});

	it("redacts every entry of the exception list, causes included", () => {
		const event = sanitizeExceptionEvent(
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
		const event = sanitizeExceptionEvent(
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
		const event = sanitizeExceptionEvent(
			exceptionEvent({ $exception_list: [{ type: "Error", value: "x", stacktrace: { frames: [frame] } }] }),
		);
		const list = event?.properties?.$exception_list as unknown as Array<{
			stacktrace: { frames: Array<Record<string, unknown>> };
		}>;
		expect(list[0]?.stacktrace.frames[0]).toEqual({ filename: "ssr.mjs", function: "GET" });
	});

	it("strips query strings from stack frame filenames", () => {
		const event = sanitizeExceptionEvent(
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
		expect(
			sanitizeExceptionEvent(exceptionEvent({ $exception_list: [{ type: "NotFoundError", value: "x" }] })),
		).toBeNull();
	});

	it("leaves other events, and their URLs, alone", () => {
		const pageview = { event: "$pageview", properties: { $current_url: "https://x.test/a?utm_source=news" } };
		expect(sanitizeExceptionEvent(pageview)).toEqual({
			event: "$pageview",
			properties: { $current_url: "https://x.test/a?utm_source=news" },
		});
		expect(sanitizeExceptionEvent(null)).toBeNull();
	});
});
