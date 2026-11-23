/**
 * @vitest-environment node
 */

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { APIError } from "better-auth/api";
import { describe, expect, it, vi } from "vitest";
import { createAuthApiErrorHandler } from "../api-error";

const ORIGIN = "http://localhost:3000";
const EMAIL = "person@example.com";
const PASSWORD = "a-long-enough-passphrase"; // betterleaks:allow

describe("createAuthApiErrorHandler", () => {
	it("ignores API errors below 500", async () => {
		const log = vi.fn();
		const capture = vi.fn();
		const onError = createAuthApiErrorHandler(log, capture);
		await onError(new APIError("UNAUTHORIZED"));
		await onError(new APIError("FORBIDDEN"));
		expect(log).not.toHaveBeenCalled();
		expect(capture).not.toHaveBeenCalled();
	});

	it("logs a fixed message with the status and captures 5xx API errors", async () => {
		const log = vi.fn();
		const capture = vi.fn();
		const error = new APIError("SERVICE_UNAVAILABLE", { message: "person@example.com: upstream down" });
		await createAuthApiErrorHandler(log, capture)(error);
		expect(log).toHaveBeenCalledWith("Better Auth API failure", { status: 503 });
		expect(capture).toHaveBeenCalledWith(error, { source: "better-auth", status: 503 });
	});

	it("captures other thrown errors with a null status, and wraps non-errors in a fixed-message Error", async () => {
		const log = vi.fn();
		const capture = vi.fn();
		const onError = createAuthApiErrorHandler(log, capture);
		const error = new Error("db down");
		await onError(error);
		expect(log).toHaveBeenCalledWith("Better Auth API failure", { status: null });
		expect(capture).toHaveBeenCalledWith(error, { source: "better-auth", status: null });

		await onError("a string");
		expect(capture).toHaveBeenLastCalledWith(new Error("Better Auth API failure"), {
			source: "better-auth",
			status: null,
		});
	});

	it("still captures when logging throws, and swallows a capture failure", async () => {
		const capture = vi.fn(async () => {
			throw new Error("posthog down");
		});
		const onError = createAuthApiErrorHandler(() => {
			throw new Error("logger down");
		}, capture);
		await expect(onError(new Error("db down"))).resolves.toBeUndefined();
		expect(capture).toHaveBeenCalledOnce();
	});
});

// The hook wired into a real better-auth router (as in src/server/auth/auth.ts), on an in-memory database.
describe("onAPIError in the better-auth router", () => {
	function createTestAuth() {
		const log = vi.fn();
		const capture = vi.fn();
		const state = { failSessionCreate: false };
		const auth = betterAuth({
			database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
			secret: "test-secret-that-is-at-least-32-characters", // betterleaks:allow
			baseURL: ORIGIN,
			emailAndPassword: { enabled: true },
			databaseHooks: {
				session: {
					create: {
						before: async () => {
							// Stands in for the database failing while a valid sign-in writes its session
							if (state.failSessionCreate) throw new Error("connection terminated unexpectedly");
						},
					},
				},
			},
			// better-auth skips the origin check under NODE_ENV=test; keep it on so the 403 case is real
			advanced: { disableOriginCheck: false },
			onAPIError: { onError: createAuthApiErrorHandler(log, capture) },
		});
		return { auth, log, capture, state };
	}

	async function post(
		auth: ReturnType<typeof createTestAuth>["auth"],
		path: string,
		body: object,
		extraHeaders: Record<string, string> = {},
	) {
		const res = await auth.handler(
			new Request(`${ORIGIN}/api/auth${path}`, {
				method: "POST",
				headers: { origin: ORIGIN, "content-type": "application/json", ...extraHeaders },
				body: JSON.stringify(body),
			}),
		);
		return { status: res.status, body: await res.text() };
	}

	const signIn = (auth: ReturnType<typeof createTestAuth>["auth"], password = PASSWORD) =>
		post(auth, "/sign-in/email", { email: EMAIL, password });

	async function withUser() {
		const test = createTestAuth();
		expect((await post(test.auth, "/sign-up/email", { email: EMAIL, password: PASSWORD, name: "Person" })).status).toBe(
			200,
		);
		return test;
	}

	it("captures a failure inside sign-in once and still answers 500", async () => {
		const { auth, log, capture, state } = await withUser();
		state.failSessionCreate = true;
		// better-call itself prints "# SERVER_ERROR" for a non-API error after the hook runs; keep the test output clean
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
		try {
			const res = await signIn(auth);
			expect(res.status).toBe(500);
			expect(res.body).toBe("");
		} finally {
			consoleError.mockRestore();
		}
		expect(capture).toHaveBeenCalledOnce();
		expect(capture).toHaveBeenCalledWith(expect.objectContaining({ message: "connection terminated unexpectedly" }), {
			source: "better-auth",
			status: null,
		});
		expect(log).toHaveBeenCalledOnce();
		expect(log).toHaveBeenCalledWith("Better Auth API failure", { status: null });
	});

	it("reports nothing for invalid credentials", async () => {
		const { auth, log, capture } = await withUser();
		expect((await signIn(auth, "the-wrong-long-passphrase")).status).toBe(401); // betterleaks:allow
		expect(capture).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it("reports nothing for a request the origin check rejects", async () => {
		const { auth, log, capture } = await withUser();
		// The check is router middleware, so its 403 APIError reaches onError, which must ignore it
		const res = await post(
			auth,
			"/sign-in/email",
			{ email: EMAIL, password: PASSWORD },
			{ origin: "https://evil.example", cookie: "unrelated=1" },
		);
		expect(res.status).toBe(403);
		expect(capture).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});

	it("reports nothing for a successful sign-in", async () => {
		const { auth, log, capture } = await withUser();
		expect((await signIn(auth)).status).toBe(200);
		expect(capture).not.toHaveBeenCalled();
		expect(log).not.toHaveBeenCalled();
	});
});
