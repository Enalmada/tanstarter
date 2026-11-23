/**
 * @vitest-environment node
 */

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { describe, expect, it, vi } from "vitest";

// Pins the better-auth + TanStack Start behavior src/server/auth/session.ts relies
// on: a direct auth.api.getSession() call (no asResponse) inside a Start request
// hands its Set-Cookie to Start's response through the tanstackStartCookies plugin,
// merged with cookies set elsewhere, so the helper must not forward it again.
//
// The plugin loads the real @tanstack/react-start/server (node_modules are not
// mocked), so this runs inside a real Start request scope: Start keeps it in an
// AsyncLocalStorage on globalThis, and `{ request, requestUrl }` is the event it
// creates for each request. src/test/setup.ts mocks the module for this file, so
// the real helpers come from importActual.
type StartServer = typeof import("@tanstack/react-start/server");
const start = await vi.importActual<StartServer>("@tanstack/react-start/server");
const startStorage = (globalThis as Record<symbol, unknown>)[Symbol.for("tanstack-start:event-storage")] as {
	run: <T>(store: object, fn: () => T) => T;
};

const ORIGIN = "http://localhost:3000";

function createTestAuth() {
	return betterAuth({
		database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
		secret: "test-secret-that-is-at-least-32-characters", // betterleaks:allow
		baseURL: ORIGIN,
		emailAndPassword: { enabled: true },
		// As in src/server/auth/auth.ts: a cache miss re-issues the session_data cookie
		session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
		plugins: [tanstackStartCookies()],
	});
}

async function signedInCookie(auth: ReturnType<typeof createTestAuth>) {
	const res = await auth.handler(
		new Request(`${ORIGIN}/api/auth/sign-up/email`, {
			method: "POST",
			headers: { origin: ORIGIN, "content-type": "application/json" },
			body: JSON.stringify({ email: "person@example.com", password: "a-long-enough-passphrase", name: "Person" }), // betterleaks:allow
		}),
	);
	expect(res.status).toBe(200);
	// Only the session token, so the next getSession misses the cookie cache and sets session_data
	const token = res.headers
		.getSetCookie()
		.map((line) => line.split(";")[0] ?? "")
		.find((pair) => pair.startsWith("better-auth.session_token="));
	expect(token).toBeDefined();
	return token as string;
}

/** Runs `body` as part of a Start request and returns its result plus the Set-Cookie names Start would send. */
async function inStartRequest<T>(cookie: string, body: () => Promise<T>) {
	const request = new Request(`${ORIGIN}/_serverFn/probe`, { headers: { cookie } });
	return startStorage.run({ request, requestUrl: new URL(request.url) }, async () => {
		// An unrelated cookie set earlier in the same request
		start.setCookie("locale", "es");
		const result = await body();
		const cookies = start
			.getResponseHeaders()
			.getSetCookie()
			.map((line) => line.split("=")[0]);
		return { result, cookies };
	});
}

describe("tanstackStartCookies with a direct getSession call", () => {
	it("adds the refreshed session cookie to Start's response once, next to the other cookies, with Dates intact", async () => {
		const auth = createTestAuth();
		const cookie = await signedInCookie(auth);

		const { result, cookies } = await inStartRequest(cookie, () =>
			auth.api.getSession({ headers: new Headers({ cookie }) }),
		);

		expect(result?.user.email).toBe("person@example.com");
		expect(result?.user.createdAt).toBeInstanceOf(Date);
		expect(cookies).toEqual(["locale", "better-auth.session_data"]);
	});

	it("sets no auth cookie for an anonymous request", async () => {
		const auth = createTestAuth();
		const { result, cookies } = await inStartRequest("", () => auth.api.getSession({ headers: new Headers() }));
		expect(result).toBeNull();
		expect(cookies).toEqual(["locale"]);
	});
});
