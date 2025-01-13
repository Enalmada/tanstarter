"use server";

import { sha256 } from "@oslojs/crypto/sha2";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { eq } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "vinxi/http";

import db from "~/server/db";
import {
	type Session,
	SessionTable,
	UserRole,
	UserTable,
} from "~/server/db/schema";

export const SESSION_COOKIE_NAME = "session";

// Special tokens for Playwright tests
const PLAYWRIGHT_TEST_TOKEN = "playwright-test-token";
const PLAYWRIGHT_ADMIN_TEST_TOKEN = "playwright-admin-test-token";

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

export async function createSession(
	token: string,
	userId: string,
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId: userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
	};
	await db.insert(SessionTable).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	// Handle Playwright test tokens in development
	if (process.env.NODE_ENV === "development") {
		if (
			token === PLAYWRIGHT_TEST_TOKEN ||
			token === PLAYWRIGHT_ADMIN_TEST_TOKEN
		) {
			const isAdmin = token === PLAYWRIGHT_ADMIN_TEST_TOKEN;
			const email = isAdmin ? "admin@example.com" : "test@example.com";
			const name = isAdmin ? "Test Admin" : "Test User";
			const role = isAdmin ? UserRole.ADMIN : UserRole.MEMBER;

			// Create or find test user
			const testUser = await db.query.UserTable.findFirst({
				where: eq(UserTable.email, email),
			});

			if (testUser) {
				return {
					session: {
						id: "test-session-id",
						userId: testUser.id,
						expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
					},
					user: testUser,
				};
			}

			// Create test user if it doesn't exist
			const [newTestUser] = await db
				.insert(UserTable)
				.values({
					email,
					name,
					role,
					version: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			return {
				session: {
					id: "test-session-id",
					userId: newTestUser.id,
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				},
				user: newTestUser,
			};
		}
	}

	// Normal session validation
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await db
		.select({
			user: {
				// Only return the necessary user data for the client
				id: UserTable.id,
				name: UserTable.name,
				role: UserTable.role,
				avatarUrl: UserTable.avatarUrl,
				email: UserTable.email,
				setupAt: UserTable.setupAt,
			},
			session: SessionTable,
		})
		.from(SessionTable)
		.innerJoin(UserTable, eq(SessionTable.userId, UserTable.id))
		.where(eq(SessionTable.id, sessionId));
	if (result.length < 1) {
		return { session: null, user: null };
	}
	const { user, session } = result[0];
	if (Date.now() >= session.expiresAt.getTime()) {
		await db.delete(SessionTable).where(eq(SessionTable.id, session.id));
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await db
			.update(SessionTable)
			.set({
				expiresAt: session.expiresAt,
			})
			.where(eq(SessionTable.id, session.id));
	}

	return { session, user };
}

export type SessionUser = NonNullable<
	Awaited<ReturnType<typeof validateSessionToken>>["user"]
>;

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(SessionTable).where(eq(SessionTable.id, sessionId));
}

export function setSessionTokenCookie(token: string, expiresAt: Date) {
	setCookie(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		expires: expiresAt,
		path: "/",
	});
}

/**
 * Retrieves the session and user data if valid.
 * Can be used in API routes and server functions.
 */
export async function getAuthSession(
	{ refreshCookie } = { refreshCookie: true },
) {
	const token = getCookie(SESSION_COOKIE_NAME);
	if (!token) {
		return { session: null, user: null };
	}
	const { session, user } = await validateSessionToken(token);
	if (session === null) {
		deleteCookie(SESSION_COOKIE_NAME);
		return { session: null, user: null };
	}
	if (refreshCookie) {
		setSessionTokenCookie(token, session.expiresAt);
	}
	return { session, user };
}
