import { describe, expect, it } from "vitest";
import { toCapture } from "~/lib/monitoring/capture";

describe("toCapture", () => {
	it("uses an Error passed as extra, keeping the message as context", () => {
		const error = new Error("boom");
		expect(toCapture("Save failed", error)).toEqual({ error, properties: { context: "Save failed" } });
	});

	it("wraps a string message in an Error", () => {
		const { error, properties } = toCapture("Something broke");
		expect(error).toBeInstanceOf(Error);
		expect((error as Error).message).toBe("Something broke");
		expect(properties).toEqual({});
	});

	it("keeps an Error message as the error", () => {
		const error = new Error("boom");
		expect(toCapture(error).error).toBe(error);
	});

	it("keeps only top-level primitive values from extra", () => {
		const { properties } = toCapture("msg", {
			source: "test",
			count: 2,
			ok: false,
			none: null,
			user: { email: "person@example.com" },
			ids: [1, 2],
			skipped: undefined,
		});
		expect(properties).toEqual({ source: "test", count: 2, ok: false, none: null });
	});

	it("ignores arrays and primitives as extra", () => {
		expect(toCapture("msg", ["a"]).properties).toEqual({});
		expect(toCapture("msg", "a").properties).toEqual({});
	});
});
