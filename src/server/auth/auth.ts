import "@tanstack/react-start/server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth/minimal";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "~/env";
import db from "~/server/db";
import { nanoString, type UserRole } from "~/server/db/schema";
import { authAdapterSchema } from "./adapter-schema";
import { authIpAddress } from "./ip-address";
import { authDisabledPaths, userAdditionalFields, userDatabaseHooks } from "./user-fields";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authAdapterSchema,
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
	// No `modelName` overrides: joins need the default model names (see ./adapter-schema).
	user: {
		// Server-owned fields, ADMIN_EMAILS hook and disabled paths: see ./user-fields.
		additionalFields: userAdditionalFields,
	},
	databaseHooks: userDatabaseHooks,
	disabledPaths: authDisabledPaths,
	session: {
		cookieCache: {
			enabled: true, // avoid hitting db
			maxAge: 5 * 60, // 5m cache duration
		},
	},
	advanced: {
		// Client IP for rate limiting comes from Fly's proxy header: see ./ip-address.
		ipAddress: authIpAddress,
		database: {
			generateId: () => nanoString("usr"),
			// One query (with relations-v2) for session + user and user + accounts
			joins: true,
		},
	},
	plugins: [tanstackStartCookies()],
});

export type Session = typeof auth.$Infer.Session;

// The inferred additionalFields type is `role: string` (from `type: "string"`); narrow it to the
// UserRole enum so role checks are exhaustive.
export type SessionUser = typeof auth.$Infer.Session.user & {
	role: UserRole;
};
