import { beforeEach, describe, expect, it, vi } from "vitest";
import { authMiddleware, freshAuthMiddleware } from "~/functions/auth-middleware";
import { UserRole } from "~/lib/enums/user-role";

const session = vi.hoisted(() => ({ requireAuthedUser: vi.fn() }));
vi.mock("~/server/auth/session", () => session);

const member = { id: "usr_member", role: UserRole.MEMBER };

type ServerFn = (opts: { next: (opts: unknown) => Promise<unknown> }) => Promise<unknown>;

// src/test/setup.ts mocks createMiddleware(...).server(fn) to return fn itself
const run = (middleware: unknown) => middleware as ServerFn;

describe.each([
	["authMiddleware", authMiddleware, []],
	["freshAuthMiddleware", freshAuthMiddleware, [{ freshFromDb: true }]],
])("%s", (_name, middleware, expectedArgs) => {
	const next = vi.fn(async (opts: unknown) => opts);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("passes the signed-in user on as context.user", async () => {
		session.requireAuthedUser.mockResolvedValue(member);

		await expect(run(middleware)({ next })).resolves.toEqual({ context: { user: member } });
		expect(session.requireAuthedUser).toHaveBeenCalledWith(...expectedArgs);
	});

	it("rejects an anonymous caller before the handler runs", async () => {
		session.requireAuthedUser.mockRejectedValue(new Error("Unauthorized"));

		await expect(run(middleware)({ next })).rejects.toThrow("Unauthorized");
		expect(next).not.toHaveBeenCalled();
	});
});
