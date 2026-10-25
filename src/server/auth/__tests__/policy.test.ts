/**
 * @vitest-environment node
 */

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MIN_PASSWORD_LENGTH } from "~/lib/auth/password-policy";
import { verificationCallback } from "~/lib/auth/verification-link";
import { createAuthAuditHook } from "../audit";
import { authIpAddress } from "../ip-address";
import { createAuthPolicy, SESSION_IDLE_SECONDS, SESSION_REFRESH_SECONDS } from "../policy";

const ORIGIN = "http://localhost:3000";
const EMAIL = "person@example.com";
const PASSWORD = "a-long-enough-passphrase"; // betterleaks:allow
const CLIENT_IP = "203.0.113.9";

// Same policy, IP header and audit hook as src/server/auth/auth.ts, on an in-memory database.
function createTestAuth({ canSendEmail = true } = {}) {
	const sent: { email: string; url: string }[] = [];
	const logs: { message: string; data: Record<string, unknown> }[] = [];
	const policy = createAuthPolicy({ requireEmailVerification: true, canSendEmail });
	const auth = betterAuth({
		database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
		secret: "test-secret-that-is-at-least-32-characters", // betterleaks:allow
		baseURL: ORIGIN,
		emailAndPassword: policy.emailAndPassword,
		account: policy.account,
		socialProviders: {
			google: {
				clientId: "test-client-id",
				clientSecret: "test-client-secret", // betterleaks:allow
				verifyIdToken: async () => true,
				// The provider reports the address as verified, as Google does.
				// (Cast: the full Google profile type has fields the flow never reads.)
				getUserInfo: async () =>
					({
						user: { id: "google-sub-1", email: EMAIL, name: "Person", emailVerified: true },
						data: { sub: "google-sub-1", email: EMAIL, email_verified: true },
					}) as never,
			},
		},
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

const cookieHeader = (res: Response) =>
	res.headers
		.getSetCookie()
		.map((line) => line.split(";")[0])
		.join("; ");

async function post(auth: TestAuth, path: string, body: Record<string, unknown>) {
	const res = await auth.handler(
		new Request(`${ORIGIN}/api/auth${path}`, {
			method: "POST",
			headers: { origin: ORIGIN, "content-type": "application/json", "fly-client-ip": CLIENT_IP },
			body: JSON.stringify(body),
		}),
	);
	const cookie = cookieHeader(res);
	return { status: res.status, cookie, body: (await res.json().catch(() => null)) as Record<string, unknown> | null };
}

const signUp = (auth: TestAuth, password: string, callbackURL?: string) =>
	post(auth, "/sign-up/email", { email: EMAIL, password, name: "Person", callbackURL });
const signIn = (auth: TestAuth, password = PASSWORD) => post(auth, "/sign-in/email", { email: EMAIL, password });

async function followLink(auth: TestAuth, url: string) {
	const res = await auth.handler(new Request(url, { headers: { "fly-client-ip": CLIENT_IP } }));
	return { status: res.status, location: res.headers.get("location"), cookie: cookieHeader(res) };
}

const verify = async (auth: TestAuth, url: string) => (await followLink(auth, url)).status;

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe("password length", () => {
	it("rejects a password shorter than the minimum and accepts the minimum", async () => {
		const { auth } = createTestAuth();
		const tooShort = await signUp(auth, "x".repeat(MIN_PASSWORD_LENGTH - 1));
		expect(tooShort.status).toBe(400);
		expect(tooShort.body?.code).toBe("PASSWORD_TOO_SHORT");

		const ok = await signUp(auth, "x".repeat(MIN_PASSWORD_LENGTH));
		expect(ok.status).toBe(200);
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

	it("verifies the address without signing anyone in, so the person signs in with their own password", async () => {
		const { auth, sent } = createTestAuth();
		await signUp(auth, PASSWORD);
		const link = await followLink(auth, sent[0]?.url ?? "");
		expect([200, 302]).toContain(link.status);
		// The link only proves control of the mailbox, not who chose the password.
		expect(link.cookie).not.toContain("session_token");
		const session = await auth.handler(
			new Request(`${ORIGIN}/api/auth/get-session`, { headers: { cookie: link.cookie } }),
		);
		expect(await session.json()).toBeNull();

		const res = await signIn(auth);
		expect(res.status).toBe(200);
		expect(res.body?.token).toEqual(expect.any(String));
	});

	it("does not reveal whether an address already has an account", async () => {
		const { auth, sent } = createTestAuth();
		const first = await signUp(auth, PASSWORD);
		const second = await signUp(auth, "another-long-enough-passphrase"); // betterleaks:allow

		expect(second.status).toBe(first.status);
		expect(second.body?.token).toBeNull();
		expect(first.cookie).toBe("");
		expect(second.cookie).toBe("");
		// The new user's fields are all present in the answer for an existing one (the in-memory
		// adapter leaves out null columns the real database returns).
		const firstUser = (first.body?.user ?? {}) as Record<string, unknown>;
		const secondUser = (second.body?.user ?? {}) as Record<string, unknown>;
		for (const key of Object.keys(firstUser)) {
			expect(secondUser, key).toHaveProperty(key);
		}
		expect(sent).toHaveLength(1);

		// The second sign-up must not have changed the password.
		await verify(auth, sent[0]?.url ?? "");
		expect((await signIn(auth)).status).toBe(200);
		expect((await signIn(auth, "another-long-enough-passphrase")).status).toBe(401); // betterleaks:allow
	});

	it("sends a followed link to sign-in, keeping the destination", async () => {
		const { auth, sent } = createTestAuth();
		await signUp(auth, PASSWORD, verificationCallback("/tasks"));

		const { location } = await followLink(auth, sent[0]?.url ?? "");
		expect(location).toBe("/signin?redirect=%2Ftasks");
	});

	it("reports a bad link on the sign-in page", async () => {
		const { auth, sent } = createTestAuth();
		await signUp(auth, PASSWORD, verificationCallback("/tasks"));
		const url = new URL(sent[0]?.url ?? "");
		url.searchParams.set("token", `${url.searchParams.get("token")}x`);

		const { location } = await followLink(auth, url.toString());
		const target = new URL(location ?? "", ORIGIN);
		expect(target.pathname).toBe("/signin");
		expect(target.searchParams.get("redirect")).toBe("/tasks");
		expect(target.searchParams.get("error")).toBe("INVALID_TOKEN");
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

describe("Google linking", () => {
	async function signInWithGoogle(auth: TestAuth) {
		return post(auth, "/sign-in/social", { provider: "google", idToken: { token: "test-token" } });
	}

	it("does not merge into an email/password account, even a verified one", async () => {
		const { auth, sent } = createTestAuth();
		await signUp(auth, PASSWORD); // someone registers an address with their own password
		await verify(auth, sent[0]?.url ?? ""); // and the owner (or a link scanner) follows the link

		const google = await signInWithGoogle(auth);
		expect(google.status).toBe(401);
		expect(google.body?.code).toBe("OAUTH_LINK_ERROR");
	});

	it("still signs in an address that has no account yet", async () => {
		const { auth } = createTestAuth();
		const google = await signInWithGoogle(auth);
		expect(google.status).toBe(200);
		expect(google.body?.token).toEqual(expect.any(String));
	});
});

describe("when email cannot be sent", () => {
	it("turns email sign-up off for every address alike and sends nothing", async () => {
		const { auth, sent } = createTestAuth({ canSendEmail: false });
		const first = await signUp(auth, PASSWORD);
		const second = await post(auth, "/sign-up/email", {
			email: "other@example.com",
			password: PASSWORD,
			name: "Other",
		});

		expect(first.status).toBe(400);
		expect(first.body?.code).toBe("EMAIL_PASSWORD_SIGN_UP_DISABLED");
		expect(second.status).toBe(first.status);
		expect(second.body?.code).toBe(first.body?.code);
		expect(sent).toHaveLength(0);
	});
});

describe("session lifetime", () => {
	it("ends a session after seven days without use", async () => {
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

describe("session refresh", () => {
	it("pushes the expiry out when a session is used after the refresh interval", async () => {
		const { auth, sent } = createTestAuth();
		await signUp(auth, PASSWORD);
		await verify(auth, sent[0]?.url ?? "");
		const { body, cookie } = await signIn(auth);
		const context = await auth.$context;

		vi.useFakeTimers({ toFake: ["Date"] });
		vi.setSystemTime(Date.now() + (SESSION_REFRESH_SECONDS + 60) * 1000);
		await auth.handler(new Request(`${ORIGIN}/api/auth/get-session`, { headers: { cookie } }));

		const session = await context.internalAdapter.findSession(String(body?.token));
		const remainingMs = new Date(session?.session.expiresAt ?? 0).getTime() - Date.now();
		expect(remainingMs).toBeGreaterThan((SESSION_IDLE_SECONDS - 60) * 1000);
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

	it("logs sign-out with the client IP", async () => {
		const { auth, sent, logs } = createTestAuth();
		await signUp(auth, PASSWORD);
		await verify(auth, sent[0]?.url ?? "");
		const { cookie } = await signIn(auth);
		const res = await auth.handler(
			new Request(`${ORIGIN}/api/auth/sign-out`, {
				method: "POST",
				headers: { origin: ORIGIN, cookie, "content-type": "application/json", "fly-client-ip": CLIENT_IP },
				body: "{}",
			}),
		);

		expect(res.status).toBe(200);
		expect(logs.at(-1)?.data).toMatchObject({ event: "sign_out", outcome: "success", ip: CLIENT_IP });
	});

	it("logs a rejected verification link as a failure", async () => {
		const { auth, sent, logs } = createTestAuth();
		await signUp(auth, PASSWORD);
		const url = new URL(sent[0]?.url ?? "");
		url.searchParams.set("token", `${url.searchParams.get("token")}x`);
		await verify(auth, url.toString());

		expect(logs.at(-1)?.data).toMatchObject({ event: "email_verified", outcome: "failure", code: "INVALID_TOKEN" });
	});

	it("logs a successful OAuth sign-in as a success even if the destination carries ?error=", async () => {
		const realFetch = globalThis.fetch;
		vi.stubGlobal("fetch", async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
			String(input instanceof Request ? input.url : input).startsWith("https://oauth2.googleapis.com/token")
				? Response.json({ access_token: "at", id_token: "x.y.z", token_type: "Bearer", expires_in: 3600 })
				: realFetch(input, init),
		);
		const { auth, logs } = createTestAuth();

		const start = await auth.handler(
			new Request(`${ORIGIN}/api/auth/sign-in/social`, {
				method: "POST",
				headers: { origin: ORIGIN, "content-type": "application/json", "fly-client-ip": CLIENT_IP },
				body: JSON.stringify({ provider: "google", callbackURL: "/tasks?error=anything" }),
			}),
		);
		const state = new URL(((await start.json()) as { url: string }).url).searchParams.get("state");
		const callback = await auth.handler(
			new Request(`${ORIGIN}/api/auth/callback/google?code=c&state=${state}`, {
				headers: { cookie: cookieHeader(start), "fly-client-ip": CLIENT_IP },
			}),
		);

		expect(callback.headers.get("location")).toBe("/tasks?error=anything");
		expect(logs.at(-1)?.data).toMatchObject({
			event: "sign_in_oauth",
			outcome: "success",
			userId: expect.any(String),
		});
	});

	it("ignores paths it does not audit", async () => {
		const { auth, logs } = createTestAuth();
		await auth.handler(new Request(`${ORIGIN}/api/auth/get-session`));
		expect(logs).toHaveLength(0);
	});
});
