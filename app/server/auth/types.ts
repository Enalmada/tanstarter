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
	validateCode: (code: string, codeVerifier?: string) => Promise<any>;
	getUserInfo: (accessToken: string) => Promise<any>;
	getProviderUserId: (user: any) => string;
	formatUserForDatabase: (user: any) => {
		email: string;
		name: string;
		avatar_url: string | null;
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
