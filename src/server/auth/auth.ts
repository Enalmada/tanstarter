import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "~/server/db";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	// emailAndPassword: {
	//   enabled: true,
	// },
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
	},
	// baseURL: env.CF_PAGES_URL || env.APP_BASE_URL || "",
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
		generateId: false,
	},
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = typeof auth.$Infer.Session.user;
