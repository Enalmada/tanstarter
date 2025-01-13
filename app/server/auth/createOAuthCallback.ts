// createOAuthCallback.ts
"use server";

import { createAPIFileRoute } from "@tanstack/start/api";
import { Google, OAuth2RequestError } from "arctic";
import { and, eq } from "drizzle-orm";
import { parseCookies } from "vinxi/http";
import { env } from "~/env";
import {
	createSession,
	generateSessionToken,
	setSessionTokenCookie,
} from "~/server/auth/auth";
import db from "~/server/db";
import { OAuthAccountTable, UserTable } from "~/server/db/schema";
import { UserRole } from "~/server/db/schema";

export function createOAuthCallback(providerId: string) {
	return createAPIFileRoute(`/api/auth/callback/${providerId}`)({
		GET: async ({ request }) => {
			const google = new Google(
				env.GOOGLE_CLIENT_ID,
				env.GOOGLE_CLIENT_SECRET,
				env.GOOGLE_REDIRECT_URI,
			);

			const url = new URL(request.url);
			const code = url.searchParams.get("code");
			const state = url.searchParams.get("state");

			const cookies = parseCookies();
			const storedState = cookies[`${providerId}_oauth_state`];
			const storedCodeVerifier = cookies[`${providerId}_code_verifier`];

			if (!code || !state || !storedState || state !== storedState) {
				return new Response(null, { status: 400 });
			}

			try {
				const tokens = await google.validateAuthorizationCode(
					code,
					storedCodeVerifier || "",
				);

				const userResponse = await fetch(
					"https://openidconnect.googleapis.com/v1/userinfo",
					{
						headers: { Authorization: `Bearer ${tokens.accessToken()}` },
					},
				);

				const providerUser = await userResponse.json();
				const providerUserId = providerUser.sub;

				const existingUser = await db.query.OAuthAccountTable.findFirst({
					where: and(
						eq(OAuthAccountTable.providerId, providerId),
						eq(OAuthAccountTable.providerUserId, providerUserId),
					),
				});

				if (existingUser) {
					const token = generateSessionToken();
					const session = await createSession(token, existingUser.userId);
					setSessionTokenCookie(token, session.expiresAt);
					return new Response(null, {
						status: 302,
						headers: { Location: "/" },
					});
				}

				const userData = {
					email: providerUser.email,
					name: providerUser.name,
					avatarUrl: providerUser.picture,
					version: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
					role: UserRole.MEMBER,
					createdById: null,
					updatedById: null,
				};

				const existingUserEmail = await db.query.UserTable.findFirst({
					where: eq(UserTable.email, userData.email),
				});

				if (existingUserEmail) {
					await db.insert(OAuthAccountTable).values({
						providerId: providerId,
						providerUserId: providerUserId,
						userId: existingUserEmail.id,
					});

					const token = generateSessionToken();
					const session = await createSession(token, existingUserEmail.id);
					setSessionTokenCookie(token, session.expiresAt);
					return new Response(null, {
						status: 302,
						headers: { Location: "/" },
					});
				}

				const [{ newId }] = await db
					.insert(UserTable)
					.values(userData)
					.returning({ newId: UserTable.id });

				await db.insert(OAuthAccountTable).values({
					providerId: providerId,
					providerUserId: providerUserId,
					userId: newId,
				});

				const token = generateSessionToken();
				const session = await createSession(token, newId);
				setSessionTokenCookie(token, session.expiresAt);
				return new Response(null, {
					status: 302,
					headers: { Location: "/" },
				});
			} catch (e) {
				if (e instanceof OAuth2RequestError) {
					return new Response(null, { status: 400 });
				}
				return new Response(null, { status: 500 });
			}
		},
	});
}
