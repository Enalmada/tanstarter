/**
 * @vitest-environment node
 */

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { bearer } from "better-auth/plugins/bearer";
import { afterEach, describe, expect, it } from "vitest";
import { UserRole } from "~/lib/enums/user-role";
import { shouldPromoteOnCreate } from "../admin-emails";
import { authDisabledPaths, userAdditionalFields, userDatabaseHooks } from "../user-fields";

type Row = Record<string, unknown>;

const ORIGIN = "http://localhost:3000";

// Same user fields, hooks and disabled paths as src/server/auth/auth.ts, on an
// in-memory DB. The bearer plugin only lets the test carry a session.
function createTestAuth() {
	const db: Record<string, Row[]> = { user: [], session: [], account: [], verification: [] };
	const auth = betterAuth({
		database: memoryAdapter(db),
		secret: "test-secret-that-is-at-least-32-characters",
		baseURL: ORIGIN,
		emailAndPassword: { enabled: true },
		user: { additionalFields: userAdditionalFields },
		databaseHooks: userDatabaseHooks,
		disabledPaths: authDisabledPaths,
		plugins: [bearer()],
	});
	const findUser = (id: string) => db.user?.find((u) => u.id === id);
	return { auth, findUser };
}

type TestAuth = ReturnType<typeof createTestAuth>["auth"];

// Mirrors src/routes/api/auth/$.ts, which forwards every request to auth.handler.
async function call(auth: TestAuth, path: string, body: unknown, token?: string) {
	const headers = new Headers({ origin: ORIGIN, "content-type": "application/json" });
	if (token) headers.set("authorization", `Bearer ${token}`);
	const res = await auth.handler(
		new Request(`${ORIGIN}/api/auth${path}`, { method: "POST", headers, body: JSON.stringify(body) }),
	);
	const text = await res.text();
	let json: Record<string, unknown> | null = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		// Plain-text bodies such as "Not Found".
	}
	return { status: res.status, json };
}

async function signUp(auth: TestAuth, extra: Record<string, unknown> = {}) {
	return call(auth, "/sign-up/email", {
		email: `member-${crypto.randomUUID()}@example.com`,
		password: "TestPassword123!",
		name: "Member",
		...extra,
	});
}

describe("better-auth user-field policy", () => {
	const originalAdminEmails = process.env.ADMIN_EMAILS;
	afterEach(() => {
		if (originalAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
		else process.env.ADMIN_EMAILS = originalAdminEmails;
	});

	it("marks role as server-owned", () => {
		expect(userAdditionalFields.role.input).toBe(false);
	});

	it("ignores a client-supplied role on sign-up", async () => {
		const { auth, findUser } = createTestAuth();
		const res = await signUp(auth, { role: UserRole.ADMIN });

		expect(res.status).toBe(200);
		const userId = (res.json as { user: { id: string } }).user.id;
		expect(findUser(userId)?.role).toBe(UserRole.MEMBER);
	});

	it("disables /update-user so a member cannot write their own fields", async () => {
		const { auth, findUser } = createTestAuth();
		const res = await signUp(auth);
		const { token, user } = res.json as { token: string; user: { id: string } };

		const update = await call(auth, "/update-user", { role: UserRole.ADMIN, name: "Hacker" }, token);

		expect(update.status).toBe(404);
		expect(findUser(user.id)?.role).toBe(UserRole.MEMBER);
		expect(findUser(user.id)?.name).toBe("Member");
	});

	it("keeps change-email and delete-user inert (not enabled in config)", async () => {
		const { auth } = createTestAuth();
		const { token } = (await signUp(auth)).json as { token: string };

		const changeEmail = await call(auth, "/change-email", { newEmail: "other@example.com" }, token);
		const deleteUser = await call(auth, "/delete-user", {}, token);

		expect(changeEmail.status).toBeGreaterThanOrEqual(400);
		expect(deleteUser.status).toBeGreaterThanOrEqual(400);
	});

	it("does not promote an ADMIN_EMAILS address registered with a password (unverified)", async () => {
		process.env.ADMIN_EMAILS = "owner@example.com";
		const { auth, findUser } = createTestAuth();

		const res = await signUp(auth, { email: "owner@example.com" });

		const userId = (res.json as { user: { id: string } }).user.id;
		expect(findUser(userId)?.emailVerified).toBe(false);
		expect(findUser(userId)?.role).toBe(UserRole.MEMBER);
	});

	it("promotes a verified ADMIN_EMAILS address at creation", async () => {
		process.env.ADMIN_EMAILS = " Owner@Example.com , other@example.com";
		const result = await userDatabaseHooks.user.create.before({ email: "owner@example.com", emailVerified: true });

		expect(result.data).toMatchObject({ role: UserRole.ADMIN });
	});

	it("leaves unlisted verified users as-is", async () => {
		process.env.ADMIN_EMAILS = "owner@example.com";
		const result = await userDatabaseHooks.user.create.before({ email: "someone@example.com", emailVerified: true });

		expect(result.data).not.toHaveProperty("role");
	});
});

describe("shouldPromoteOnCreate", () => {
	it.each([
		[{ email: "a@x.com", emailVerified: true }, "a@x.com", true],
		[{ email: "A@X.com", emailVerified: true }, " a@x.com ", true],
		[{ email: "a@x.com", emailVerified: false }, "a@x.com", false],
		[{ email: "a@x.com", emailVerified: null }, "a@x.com", false],
		[{ email: "a@x.com", emailVerified: true }, undefined, false],
		[{ email: "a@x.com", emailVerified: true }, "", false],
		[{ email: "b@x.com", emailVerified: true }, "a@x.com,c@x.com", false],
		[{ email: null, emailVerified: true }, "a@x.com", false],
	])("%o with ADMIN_EMAILS=%s → %s", (user, raw, expected) => {
		expect(shouldPromoteOnCreate(user, raw)).toBe(expected);
	});
});
