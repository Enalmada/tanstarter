import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactStartCookies } from "better-auth/react-start";
import { env } from "~/env";
import db from "~/server/db";
import { nanoString } from "~/server/db/schema";

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
	plugins: [reactStartCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = typeof auth.$Infer.Session.user;
