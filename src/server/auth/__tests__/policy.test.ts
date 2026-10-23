/**
 * @vitest-environment node
 */

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH } from "~/lib/auth/password-policy";
import { createAuthAuditHook } from "../audit";
import { authIpAddress } from "../ip-address";
import { createAuthPolicy, SESSION_IDLE_SECONDS } from "../policy";

const ORIGIN = "http://localhost:3000";
const EMAIL = "person@example.com";
const PASSWORD = "a-long-enough-passphrase"; // betterleaks:allow
const CLIENT_IP = "203.0.113.9";

// Same policy, IP header and audit hook as src/server/auth/auth.ts, on an in-memory database.
function createTestAuth() {
	const sent: { email: string; url: string }[] = [];
	const logs: { message: string; data: Record<string, unknown> }[] = [];
	const policy = createAuthPolicy({ requireEmailVerification: true });
	const auth = betterAuth({
		database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
		secret: "test-secret-that-is-at-least-32-characters", // betterleaks:allow
		baseURL: ORIGIN,
		emailAndPassword: policy.emailAndPassword,
		emailVerification: {
			...policy.emailVerification,
			sendVerificationEmail: async ({ user, url }) => {
				sent.push({ email: user.email, url });
			},
		},
		session: policy.session,
		advanced: { ipAddress: authIpAddress },
		hooks: { after: createAuthAuditHook((message, data) => logs.push({ message, data })) },
	});
	return { auth, sent, logs };
}

type TestAuth = ReturnType<typeof createTestAuth>["auth"];

async function post(auth: TestAuth, path: string, body: Record<string, unknown>) {
	const res = await auth.handler(
		new Request(`${ORIGIN}/api/auth${path}`, {
			method: "POST",
			headers: { origin: ORIGIN, "content-type": "application/json", "fly-client-ip": CLIENT_IP },
			body: JSON.stringify(body),
		}),
	);
	return { status: res.status, body: (await res.json().catch(() => null)) as Record<string, unknown> | null };
}

const signUp = (auth: TestAuth, password: string) =>
	post(auth, "/sign-up/email", { email: EMAIL, password, name: "Person" });
const signIn = (auth: TestAuth, password = PASSWORD) => post(auth, "/sign-in/email", { email: EMAIL, password });

async function verify(auth: TestAuth, url: string) {
	const res = await auth.handler(new Request(url, { headers: { "fly-client-ip": CLIENT_IP } }));
	return res.status;
}

describe("password length", () => {
	it("rejects a password shorter than the minimum and accepts the minimum", async () => {
		const { auth } = createTestAuth();
		const tooShort = await signUp(auth, "x".repeat(MIN_PASSWORD_LENGTH - 1));
		expect(tooShort.status).toBe(400);
		expect(tooShort.body?.code).toBe("PASSWORD_TOO_SHORT");

		const ok = await signUp(auth, "x".repeat(MIN_PASSWORD_LENGTH));
		expect(ok.status).toBe(200);
	});

	it("requires at least 12 characters", () => {
		expect(MIN_PASSWORD_LENGTH).toBe(12);
	});
});

describe("email verification", () => {
	it("creates no session on sign-up and sends a link", async () => {
		const { auth, sent } = createTestAuth();
		const res = await signUp(auth, PASSWORD);
		expect(res.status).toBe(200);
		expect(res.body?.token).toBeNull();
		expect(sent).toHaveLength(1);
		expect(sent[0]?.email).toBe(EMAIL);
	});

	it("refuses sign-in until the address is verified, and sends a fresh link", async () => {
		const { auth, sent } = createTestAuth();
		await signUp(auth, PASSWORD);

		const blocked = await signIn(auth);
		expect(blocked.status).toBe(403);
		expect(blocked.body?.code).toBe("EMAIL_NOT_VERIFIED");
		expect(sent).toHaveLength(2);
	});

	it("signs in after the link is followed", async () => {
		const { auth, sent } = createTestAuth();
		await signUp(auth, PASSWORD);
		expect([200, 302]).toContain(await verify(auth, sent[0]?.url ?? ""));

		const res = await signIn(auth);
		expect(res.status).toBe(200);
		expect(res.body?.token).toEqual(expect.any(String));
	});

	it("does not accept a tampered link", async () => {
		const { auth, sent } = createTestAuth();
		await signUp(auth, PASSWORD);
		const url = new URL(sent[0]?.url ?? "");
		url.searchParams.set("token", `${url.searchParams.get("token")}x`);
		await verify(auth, url.toString());

		expect((await signIn(auth)).status).toBe(403);
	});
});

describe("session lifetime", () => {
	it("ends a session after seven days without use", async () => {
		expect(SESSION_IDLE_SECONDS).toBe(7 * 24 * 60 * 60);
		const { auth, sent } = createTestAuth();
		await signUp(auth, PASSWORD);
		await verify(auth, sent[0]?.url ?? "");
		const { body } = await signIn(auth);

		const context = await auth.$context;
		const session = await context.internalAdapter.findSession(String(body?.token));
		const lifetimeMs = new Date(session?.session.expiresAt ?? 0).getTime() - Date.now();
		expect(lifetimeMs).toBeGreaterThan((SESSION_IDLE_SECONDS - 60) * 1000);
		expect(lifetimeMs).toBeLessThanOrEqual(SESSION_IDLE_SECONDS * 1000);
	});
});

describe("audit trail", () => {
	it("logs each outcome with the client IP and no email or password", async () => {
		const { auth, sent, logs } = createTestAuth();
		await signUp(auth, PASSWORD);
		await signIn(auth); // refused: not verified
		await verify(auth, sent[0]?.url ?? "");
		await signIn(auth);
		await signIn(auth, "wrong-but-long-enough-password");

		const lines = logs.map((log) => log.data);
		expect(logs.every((log) => log.message === "audit.auth")).toBe(true);
		expect(lines.map(({ event, outcome }) => [event, outcome])).toEqual([
			["sign_up", "success"],
			["sign_in", "failure"],
			["email_verified", "success"],
			["sign_in", "success"],
			["sign_in", "failure"],
		]);
		expect(lines[1]).toMatchObject({ status: 403, code: "EMAIL_NOT_VERIFIED" });
		expect(lines[3]?.userId).toEqual(expect.any(String));
		expect(lines.every((line) => line.ip === CLIENT_IP)).toBe(true);

		const text = JSON.stringify(lines);
		expect(text).not.toContain(EMAIL);
		expect(text).not.toContain("passphrase");
	});

	it("logs a rejected verification link as a failure", async () => {
		const { auth, sent, logs } = createTestAuth();
		await signUp(auth, PASSWORD);
		const url = new URL(sent[0]?.url ?? "");
		url.searchParams.set("token", `${url.searchParams.get("token")}x`);
		await verify(auth, url.toString());

		expect(logs.at(-1)?.data).toMatchObject({ event: "email_verified", outcome: "failure", code: "INVALID_TOKEN" });
	});

	it("ignores paths it does not audit", async () => {
		const { auth, logs } = createTestAuth();
		await auth.handler(new Request(`${ORIGIN}/api/auth/get-session`));
		expect(logs).toHaveLength(0);
	});
});
