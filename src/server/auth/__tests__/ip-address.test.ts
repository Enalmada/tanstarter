/**
 * @vitest-environment node
 */

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { describe, expect, it } from "vitest";
import { authIpAddress } from "../ip-address";

const ORIGIN = "http://localhost:3000";

// Same ipAddress config as src/server/auth/auth.ts with rate limiting forced on
// (better-auth only enables it in production). A fresh instance per test keeps
// the in-memory rate-limit buckets separate.
function createTestAuth() {
	return betterAuth({
		database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
		secret: "test-secret-that-is-at-least-32-characters", // betterleaks:allow
		baseURL: ORIGIN,
		emailAndPassword: { enabled: true },
		rateLimit: { enabled: true },
		advanced: { ipAddress: authIpAddress },
	});
}

type TestAuth = ReturnType<typeof createTestAuth>;

// The default /sign-in and /sign-up rules allow 3 requests per 10s window per IP and path.
// better-auth keeps the rate-limit buckets at module level, so each test uses its own
// IPs or path to stay independent.
const SIGN_IN_LIMIT = 3;

async function signIn(auth: TestAuth, headers: Record<string, string> = {}, path = "/sign-in/email") {
	const res = await auth.handler(
		new Request(`${ORIGIN}/api/auth${path}`, {
			method: "POST",
			headers: { origin: ORIGIN, "content-type": "application/json", ...headers },
			body: JSON.stringify({ email: "nobody@example.com", password: "TestPassword123!" }), // betterleaks:allow
		}),
	);
	return res.status;
}

async function exhaust(auth: TestAuth, headers: Record<string, string>, path?: string) {
	for (let i = 0; i < SIGN_IN_LIMIT; i++) {
		expect(await signIn(auth, headers, path)).not.toBe(429);
	}
}

describe("auth client IP resolution", () => {
	it("reads the client IP from fly-client-ip only", () => {
		expect(authIpAddress.ipAddressHeaders).toEqual(["fly-client-ip"]);
	});

	it("rate limits per fly-client-ip", async () => {
		const auth = createTestAuth();
		await exhaust(auth, { "fly-client-ip": "203.0.113.7" });
		expect(await signIn(auth, { "fly-client-ip": "203.0.113.7" })).toBe(429);
		// A different client is not affected.
		expect(await signIn(auth, { "fly-client-ip": "203.0.113.8" })).not.toBe(429);
	});

	it("ignores a client-supplied x-forwarded-for", async () => {
		const auth = createTestAuth();
		const ip = "203.0.113.20";
		await exhaust(auth, { "fly-client-ip": ip, "x-forwarded-for": "198.51.100.1" });
		// Rotating the spoofable header does not reset the limit for the same fly-client-ip.
		expect(await signIn(auth, { "fly-client-ip": ip, "x-forwarded-for": "198.51.100.2" })).toBe(429);
	});

	it("does not let x-forwarded-for alone pick a bucket", async () => {
		const auth = createTestAuth();
		// No fly-client-ip (dev, e2e, direct hit): one shared bucket however the header varies.
		await exhaust(auth, { "x-forwarded-for": "198.51.100.1" }, "/sign-up/email");
		expect(await signIn(auth, { "x-forwarded-for": "198.51.100.2" }, "/sign-up/email")).toBe(429);
	});

	it("works without any IP header outside production", async () => {
		// NODE_ENV=test falls back to 127.0.0.1, as in dev and Playwright.
		const auth = createTestAuth();
		expect(await signIn(auth)).not.toBe(429);
	});
});
