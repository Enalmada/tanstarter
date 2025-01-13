"use server";

export type OAuthConfig = {
	scopes: string[];
	useCodeVerifier?: boolean;
};

export type OAuthProvider = {
	id: string;
	stateCookieName: string;
	codeVerifierCookieName?: string;
	createAuthorizationURL(
		state: string,
		codeVerifier: string,
		scopes: string[],
	): URL;
	createAuthorizationURL(state: string, scopes: string[]): URL;
	validateCode: (
		code: string,
		codeVerifier?: string,
	) => Promise<{
		access_token: string;
		token_type: string;
		expires_in?: number;
		refresh_token?: string;
		scope?: string;
	}>;
	getUserInfo: (
		accessToken: string,
	) => Promise<GoogleUser | GitHubUser | DiscordUser>;
	getProviderUserId: (user: GoogleUser | GitHubUser | DiscordUser) => string;
	formatUserForDatabase: (user: GoogleUser | GitHubUser | DiscordUser) => {
		email: string;
		name: string;
		avatarUrl: string | null;
	};
};

export interface GoogleUser {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	email: string;
	picture: string;
	email_verified: boolean;
	locale: string;
}

export interface GitHubUser {
	id: string;
	name: string | null;
	email: string;
	avatar_url: string;
	location: string | null;
	login: string;
}

export interface DiscordUser {
	id: string;
	username: string;
	global_name?: string;
	avatar?: string;
	email: string;
	verified: boolean;
}
