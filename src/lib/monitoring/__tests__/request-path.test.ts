import { describe, expect, it } from "vitest";
import { requestPath } from "~/lib/monitoring/request-path";

describe("requestPath", () => {
	it("returns the pathname without query string or fragment", () => {
		expect(requestPath("http://localhost:3000/api/thing?token=secret#frag")).toBe("/api/thing");
	});

	it("returns null for a URL that can't be parsed", () => {
		expect(requestPath("/relative")).toBeNull();
	});
});
