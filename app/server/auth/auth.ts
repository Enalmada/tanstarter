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
	baseURL: process.env.VITE_BASE_URL || "",
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "MEMBER",
			},
		},
	},
	advanced: {
		generateId: false,
	},
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = typeof auth.$Infer.Session.user;
