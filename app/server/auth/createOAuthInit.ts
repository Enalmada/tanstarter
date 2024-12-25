// createOAuthInit.ts
"use server";

import { createAPIFileRoute } from "@tanstack/start/api";
import { Google, generateCodeVerifier, generateState } from "arctic";
import { setCookie, setHeader } from "vinxi/http";
import { env } from "~/env";
import type { OAuthConfig } from "./types";

export function createOAuthInit(providerId: string, config: OAuthConfig) {
	return createAPIFileRoute(`/api/auth/${providerId}`)({
		GET: async () => {
			// Use our env helper that handles both environments
			if (
				!env.GOOGLE_CLIENT_ID ||
				!env.GOOGLE_CLIENT_SECRET ||
				!env.GOOGLE_REDIRECT_URI
			) {
				console.error("Missing OAuth configuration:", {
					hasClientId: !!env.GOOGLE_CLIENT_ID,
					hasClientSecret: !!env.GOOGLE_CLIENT_SECRET,
					hasRedirectUri: !!env.GOOGLE_REDIRECT_URI,
					environment: process.env.NODE_ENV,
				});
				return new Response("OAuth configuration error", { status: 500 });
			}

			const google = new Google(
				env.GOOGLE_CLIENT_ID,
				env.GOOGLE_CLIENT_SECRET,
				env.GOOGLE_REDIRECT_URI,
			);

			const state = generateState();
			const codeVerifier = generateCodeVerifier();

			const url = google.createAuthorizationURL(
				state,
				codeVerifier,
				config.scopes,
			);

			setCookie(`${providerId}_code_verifier`, codeVerifier, {
				path: "/",
				secure: env.NODE_ENV === "production",
				httpOnly: true,
				maxAge: 60 * 10,
				sameSite: "lax",
			});

			setCookie(`${providerId}_oauth_state`, state, {
				path: "/",
				secure: env.NODE_ENV === "production",
				httpOnly: true,
				maxAge: 60 * 10,
				sameSite: "lax",
			});

			setHeader("Location", url.toString());
			return new Response(null, { status: 302 });
		},
	});
}
