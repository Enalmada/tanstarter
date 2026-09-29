import { defineEnv } from "envin";
import { fly } from "envin/presets/valibot";
import * as v from "valibot";

export default defineEnv({
	// Extend with Fly.io preset for deployment
	extends: [fly],

	// Server-side environment variables
	server: {
		// Required server vars
		GOOGLE_CLIENT_ID: v.pipe(v.string(), v.minLength(1)),
		GOOGLE_CLIENT_SECRET: v.pipe(v.string(), v.minLength(1)),
		DATABASE_URL: v.pipe(v.string(), v.url()),
		BETTER_AUTH_SECRET: v.pipe(v.string(), v.minLength(1)),

		// Optional server vars
		DB_RETRY_INTERVAL: v.optional(v.pipe(v.string(), v.transform(Number), v.number())),
		DB_MAX_RETRIES: v.optional(v.pipe(v.string(), v.transform(Number), v.number())),
		AXIOM_DATASET_NAME: v.optional(v.string()),
		AXIOM_TOKEN: v.optional(v.string()),
		ROLLBAR_SERVER_TOKEN: v.optional(v.string()),
		// Comma-separated emails promoted to ADMIN when their account is first
		// created by a verified (OAuth) sign-in. See src/server/auth/admin-emails.ts.
		ADMIN_EMAILS: v.optional(v.string()),
		// "true" re-enables the profile page's self-service role toggle outside
		// local dev (public demo sites). Gives every signed-in visitor admin —
		// only use with a throwaway database.
		DEMO_MODE: v.optional(
			v.pipe(
				v.picklist(["true", "false"]),
				v.transform((value) => value === "true"),
			),
		),
	},

	// Client-side environment variables (prefixed with PUBLIC_)
	clientPrefix: "PUBLIC_",
	client: {
		PUBLIC_ROLLBAR_ACCESS_TOKEN: v.optional(v.string()),
		PUBLIC_POSTHOG_API_KEY: v.optional(v.string()),
	},

	// Shared environment variables (available on both client and server)
	shared: {
		NODE_ENV: v.optional(v.picklist(["development", "test", "production"]), "development"),
		APP_ENV: v.picklist(["development", "preview", "staging", "production"]),
		PUBLIC_APP_URL: v.optional(v.pipe(v.string(), v.url())),
	},
});
