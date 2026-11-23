import { getRequest } from "@tanstack/react-start/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "~/server/auth/auth";
import { getOptionalSessionUser } from "~/server/auth/session";
import { UserRole } from "~/server/db/schema";
import { fixedDate, mockUserId } from "~/test/setup";

// ~/server/auth/auth and @tanstack/react-start/server are mocked in src/test/setup.ts
const user = { id: mockUserId, role: UserRole.MEMBER, email: "test@example.com", createdAt: fixedDate };

describe("getOptionalSessionUser", () => {
	beforeEach(() => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ session: { id: "sess_1" }, user } as never);
	});

	it("returns the session's user object as is, Dates intact", async () => {
		const result = await getOptionalSessionUser();
		expect(result).toBe(user);
		expect(result?.createdAt).toBeInstanceOf(Date);
	});

	it("asks for the session object, not a Response, and leaves cookies to the plugin", async () => {
		await getOptionalSessionUser();
		const [options] = vi.mocked(auth.api.getSession).mock.calls[0] ?? [];
		expect(options).not.toHaveProperty("asResponse");
		expect(options).not.toHaveProperty("query");
	});

	it("bypasses the cookie cache when freshFromDb is set", async () => {
		await getOptionalSessionUser({ freshFromDb: true });
		expect(auth.api.getSession).toHaveBeenCalledWith(expect.objectContaining({ query: { disableCookieCache: true } }));
	});

	it("returns null for an anonymous request", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);
		expect(await getOptionalSessionUser()).toBeNull();
	});

	it("returns null without a session lookup when there is no request context", async () => {
		vi.mocked(getRequest).mockImplementationOnce(() => {
			throw new Error("No StartEvent found in AsyncLocalStorage");
		});
		expect(await getOptionalSessionUser()).toBeNull();
		expect(auth.api.getSession).not.toHaveBeenCalled();
	});
});
