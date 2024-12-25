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
import db, { withTransaction } from "~/server/db";
import { oauthAccount, user } from "~/server/db/schema";

export function createOAuthCallback(providerId: string) {
	return createAPIFileRoute(`/api/auth/callback/${providerId}`)({
		GET: async ({ request }) => {
			// Initialize Google with our env helper
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
				console.error("OAuth validation failed:", {
					hasCode: !!code,
					hasState: !!state,
					hasStoredState: !!storedState,
					stateMatch: state === storedState,
				});
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

				const existingUser = await db.query.oauthAccount.findFirst({
					where: and(
						eq(oauthAccount.provider_id, providerId),
						eq(oauthAccount.provider_user_id, providerUserId),
					),
				});

				if (existingUser) {
					const token = generateSessionToken();
					const session = await createSession(token, existingUser.user_id);
					setSessionTokenCookie(token, session.expires_at);
					return new Response(null, {
						status: 302,
						headers: { Location: "/" },
					});
				}

				const userData = {
					email: providerUser.email,
					name: providerUser.name,
					avatar_url: providerUser.picture,
				};

				const existingUserEmail = await db.query.user.findFirst({
					where: eq(user.email, userData.email),
				});

				if (existingUserEmail) {
					await db.insert(oauthAccount).values({
						provider_id: providerId,
						provider_user_id: providerUserId,
						user_id: existingUserEmail.id,
					});
					const token = generateSessionToken();
					const session = await createSession(token, existingUserEmail.id);
					setSessionTokenCookie(token, session.expires_at);
					return new Response(null, {
						status: 302,
						headers: { Location: "/" },
					});
				}

				const userId = await withTransaction(async (db) => {
					return await db.transaction(async (tx) => {
						const [{ newId }] = await tx
							.insert(user)
							.values(userData)
							.returning({ newId: user.id });

						await tx.insert(oauthAccount).values({
							provider_id: providerId,
							provider_user_id: providerUserId,
							user_id: newId,
						});

						return newId;
					});
				});

				const token = generateSessionToken();
				const session = await createSession(token, userId);
				setSessionTokenCookie(token, session.expires_at);
				return new Response(null, {
					status: 302,
					headers: { Location: "/" },
				});
			} catch (e) {
				console.error("OAuth error:", e);
				if (e instanceof OAuth2RequestError) {
					return new Response(null, { status: 400 });
				}
				return new Response(null, { status: 500 });
			}
		},
	});
}
