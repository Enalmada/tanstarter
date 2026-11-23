import { setResponseStatus } from "@tanstack/react-start/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, UnauthenticatedError } from "~/server/access/http-errors";
import { authErrorTranslator } from "~/server/access/middleware";

vi.mock("~/utils/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

type ServerFn = (ctx: { next: () => Promise<unknown> }) => Promise<unknown>;
// src/test/setup.ts mocks createMiddleware(...).server(fn) to return fn itself
const run = authErrorTranslator as unknown as ServerFn;

async function wireErrorFor(error: unknown) {
	return run({ next: () => Promise.reject(error) }).catch((wire: unknown) => wire);
}

describe("authErrorTranslator", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("answers requireAuthedUser's UnauthenticatedError with a 401 and the safe message only", async () => {
		const wire = await wireErrorFor(new UnauthenticatedError("no session cookie"));
		expect(setResponseStatus).toHaveBeenCalledWith(401);
		expect(wire).toBeInstanceOf(Error);
		expect(wire).not.toBeInstanceOf(UnauthenticatedError);
		expect((wire as Error).name).toBe("UnauthenticatedError");
		expect((wire as Error).message).toBe("Unauthorized");
	});

	it("uses each domain error's own status", async () => {
		await wireErrorFor(new NotFoundError("task t_1 missing"));
		expect(setResponseStatus).toHaveBeenCalledWith(404);
	});

	it("rethrows errors without hints unchanged and sets no status", async () => {
		const error = new Error("boom");
		expect(await wireErrorFor(error)).toBe(error);
		expect(setResponseStatus).not.toHaveBeenCalled();
	});
});
