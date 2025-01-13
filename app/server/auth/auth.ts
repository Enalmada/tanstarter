"use server";

import { sha256 } from "@oslojs/crypto/sha2";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { eq } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "vinxi/http";

import db from "~/server/db";
import { type Session, SessionTable, UserTable } from "~/server/db/schema";

export const SESSION_COOKIE_NAME = "session";

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
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await db
		.select({
			user: {
				// Only return the necessary user data for the client
				id: UserTable.id,
				name: UserTable.name,
				// first_name: userTable.first_name,
				// last_name: userTable.last_name,
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
