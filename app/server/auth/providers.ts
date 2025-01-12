// providers.ts
"use server";

import { Google } from "arctic";
import type {
	DiscordUser,
	GitHubUser,
	GoogleUser,
	OAuthProvider,
} from "./types";

interface PlatformRequest extends Request {
	platform?: {
		env: {
			GOOGLE_CLIENT_ID?: string;
			GOOGLE_CLIENT_SECRET?: string;
			GOOGLE_REDIRECT_URI?: string;
			[key: string]: string | undefined;
		};
	};
}

const providersCache = new WeakMap();

export function getProviders(request?: Request): Record<string, OAuthProvider> {
	const context = {};

	if (providersCache.has(context)) {
		return providersCache.get(context);
	}

	// Access environment variables through platform bindings
	const env = (request as PlatformRequest)?.platform?.env || process.env;

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
			validateCode: async (code: string, codeVerifier?: string) => {
				const tokens = await google.validateAuthorizationCode(
					code,
					codeVerifier || "",
				);
				return {
					access_token: String(tokens.accessToken),
					token_type: "Bearer",
					expires_in: 3600, // Default to 1 hour
					refresh_token: String(tokens.refreshToken),
					scope: tokens.scopes().join(" "),
				};
			},
			getUserInfo: async (accessToken: string) => {
				const response = await fetch(
					"https://openidconnect.googleapis.com/v1/userinfo",
					{
						headers: { Authorization: `Bearer ${accessToken}` },
					},
				);
				return response.json() as Promise<GoogleUser>;
			},
			getProviderUserId: (user: GoogleUser | GitHubUser | DiscordUser) => {
				if ("sub" in user) return user.sub;
				if ("id" in user) return user.id;
				throw new Error("Invalid user type");
			},
			formatUserForDatabase: (user: GoogleUser | GitHubUser | DiscordUser) => {
				if ("sub" in user) {
					return {
						email: user.email,
						name: user.name,
						avatar_url: user.picture,
					};
				}
				if ("id" in user && "login" in user) {
					return {
						email: user.email,
						name: user.name || user.login,
						avatar_url: user.avatar_url,
					};
				}
				if ("id" in user && "username" in user) {
					return {
						email: user.email,
						name: user.global_name || user.username,
						avatar_url: user.avatar
							? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
							: null,
					};
				}
				throw new Error("Invalid user type");
			},
		},
	};

	providersCache.set(context, providers);
	return providers;
}
