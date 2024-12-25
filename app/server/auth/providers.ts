// providers.ts
"use server";

"use server";

import { Google } from "arctic";
import type { GoogleUser, OAuthProvider } from "./types";

const providersCache = new WeakMap();

export function getProviders(request?: Request): Record<string, OAuthProvider> {
	const context = {};

	if (providersCache.has(context)) {
		return providersCache.get(context);
	}

	// Access environment variables through platform bindings
	const env = (request as any)?.platform?.env || process.env;

	if (
		!env.GOOGLE_CLIENT_ID ||
		!env.GOOGLE_CLIENT_SECRET ||
		!env.GOOGLE_REDIRECT_URI
	) {
		console.error("Missing Google OAuth environment variables");
		throw new Error("OAuth configuration error");
	}

	const google = new Google(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		env.GOOGLE_REDIRECT_URI,
	);

	const providers: Record<string, OAuthProvider> = {
		google: {
			id: "google",
			stateCookieName: "google_oauth_state",
			codeVerifierCookieName: "google_code_verifier",
			createAuthorizationURL(
				state: string,
				codeVerifierOrScopes: string | string[],
				scopes?: string[],
			) {
				if (Array.isArray(codeVerifierOrScopes)) {
					throw new Error("Google OAuth requires a code verifier");
				}
				return google.createAuthorizationURL(
					state,
					codeVerifierOrScopes,
					scopes || [],
				);
			},
			validateCode: async (code: string, codeVerifier?: string) =>
				google.validateAuthorizationCode(code, codeVerifier || ""),
			getUserInfo: async (accessToken: string) => {
				const response = await fetch(
					"https://openidconnect.googleapis.com/v1/userinfo",
					{
						headers: { Authorization: `Bearer ${accessToken}` },
					},
				);
				return response.json();
			},
			getProviderUserId: (user: GoogleUser) => user.sub,
			formatUserForDatabase: (user: GoogleUser) => ({
				email: user.email,
				name: user.name,
				avatar_url: user.picture,
			}),
		},
	};

	providersCache.set(context, providers);
	return providers;
}
