import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "~/env";
import db from "~/server/db";
import { nanoString, type UserRole } from "~/server/db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		google: {
			// Using process.env instead of env.GOOGLE_CLIENT_* to avoid dev-time client-side execution
			// This auth config is imported by client-side code during development for type inference,
			// which causes Vite to bundle and execute server code on the client, triggering:
			// "EnvError: Attempted to access server-side environment variable on client"
			// Production builds work fine - this is purely a development bundling issue.
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
	},
	baseURL: env.PUBLIC_APP_URL || "http://localhost:3000",
	trustedOrigins: [env.PUBLIC_APP_URL || "http://localhost:3000"],
	user: {
		modelName: "UserTable",
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "MEMBER",
			},
		},
	},
	session: {
		modelName: "SessionTable",
		cookieCache: {
			enabled: true, // avoid hitting db
			maxAge: 5 * 60, // 5m cache duration
		},
	},
	account: {
		modelName: "AccountTable",
	},
	verification: {
		modelName: "VerificationTable",
	},
	advanced: {
		database: {
			generateId: () => nanoString("usr"),
		},
	},
	// WORKAROUND: better-auth v1.3.31+ has a type incompatibility with exactOptionalPropertyTypes: true
	// The tanstackStartCookies plugin's type definition uses `headers?: Headers` but should use
	// `headers?: Headers | undefined` to be compatible with strict TypeScript settings.
	// See: https://github.com/better-auth/better-auth/issues/5574
	// biome-ignore lint/suspicious/noExplicitAny: Required workaround for better-auth type bug
	plugins: [tanstackStartCookies() as any],
});

export type Session = typeof auth.$Infer.Session;

// WORKAROUND: better-auth's $Infer.Session.user doesn't properly include additionalFields
// in version 1.3.34, so we manually extend the type with the role field.
// This should be fixed in a future better-auth release.
export type SessionUser = typeof auth.$Infer.Session.user & {
	role: UserRole;
};
