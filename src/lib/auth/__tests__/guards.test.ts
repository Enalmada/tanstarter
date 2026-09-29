import { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { redirectIfSignedIn, safeRedirect } from "~/lib/auth/guards";

const getSessionUser = vi.hoisted(() => vi.fn());
vi.mock("~/functions/session", () => ({ getSessionUser }));

describe("safeRedirect", () => {
	it.each([
		["/tasks/new", "/tasks/new"],
		["/tasks?page=2#top", "/tasks?page=2#top"],
		["/admin/users/abc", "/admin/users/abc"],
		["/", "/"],
	])("keeps the same-origin path %s", (input, expected) => {
		expect(safeRedirect(input)).toBe(expected);
	});

	it.each([
		["https://evil.test/tasks"],
		["http://evil.test"],
		["//evil.test"],
		["/\\evil.test"],
		["/tasks\\..\\evil"],
		["javascript:alert(1)"],
		["tasks"],
		[""],
		["/tasks\n/evil"],
		["/signin"],
		["/signin?redirect=/tasks"],
		["/signup"],
		["/signout"],
		[undefined],
		[null],
		[42],
		[["/tasks"]],
	])("falls back to /tasks for %j", (input) => {
		expect(safeRedirect(input)).toBe("/tasks");
	});

	it("uses the given fallback", () => {
		expect(safeRedirect("//evil.test", "/")).toBe("/");
	});

	it("does not treat paths that merely start with an auth page name as auth pages", () => {
		expect(safeRedirect("/signing-off")).toBe("/signing-off");
	});
});

describe("redirectIfSignedIn", () => {
	it("does nothing for an anonymous visitor", async () => {
		getSessionUser.mockResolvedValue(null);
		await expect(redirectIfSignedIn(new QueryClient(), "/tasks/new")).resolves.toBeUndefined();
	});

	it("redirects a signed-in user to the validated target", async () => {
		getSessionUser.mockResolvedValue({ id: "u1" });
		const error = await redirectIfSignedIn(new QueryClient(), "/tasks/new").catch((e: unknown) => e);
		expect(isRedirect(error)).toBe(true);
		expect((error as { options: { href: string } }).options.href).toBe("/tasks/new");
	});

	it("sends a signed-in user to /tasks when the target is not a local path", async () => {
		getSessionUser.mockResolvedValue({ id: "u1" });
		const error = await redirectIfSignedIn(new QueryClient(), "https://evil.test").catch((e: unknown) => e);
		expect((error as { options: { href: string } }).options.href).toBe("/tasks");
	});
});
