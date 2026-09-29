import { defineEnv } from "envin";
import { fly } from "envin/presets/valibot";
import * as v from "valibot";
import { readPublicRuntimeEnv } from "./src/lib/env/public-env";

// The production and dev browser bundles. Vitest's happy-dom also defines
// `window`, but runs in Node with a real `process.env`, so tests keep the
// server path and still validate.
const isBrowser = typeof window !== "undefined" && !import.meta.env?.VITEST;

export default defineEnv({
	// Extend with Fly.io preset for deployment
	extends: [fly],

	// envin defaults to `process.env`, which the client build replaces with
	// `{}`, so the browser validated an empty object and threw on APP_ENV. On
	// the client, pass an explicit allowlist: spreading `import.meta.env` would
	// inline every `envPrefix` build variable into public JavaScript.
	//
	// APP_ENV and PUBLIC_* come from the runtime snapshot the server renders
	// into the SSR HTML (src/lib/env/public-env.ts): the Docker/Fly build has
	// none of them, they arrive as runtime Fly secrets. Build-time values are
	// the fallback outside an SSR page (Storybook). NODE_ENV stays build-time.
	env: isBrowser
		? (() => {
				const runtime = readPublicRuntimeEnv();
				return {
					NODE_ENV: process.env.NODE_ENV,
					APP_ENV: runtime.APP_ENV ?? process.env.APP_ENV,
					PUBLIC_APP_URL: runtime.PUBLIC_APP_URL ?? import.meta.env.PUBLIC_APP_URL,
					PUBLIC_POSTHOG_API_KEY: runtime.PUBLIC_POSTHOG_API_KEY ?? import.meta.env.PUBLIC_POSTHOG_API_KEY,
				};
			})()
		: { ...process.env },

	// Validate on the server only. The server already validated the values it
	// renders into the page, and a page without the snapshot (Storybook) may
	// have no APP_ENV, which is required. Client code treats every value as
	// optional.
	skip: isBrowser,

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
		// Axiom API base URL, for an EU-region dataset (https://api.eu.axiom.co) or a local stub
		AXIOM_URL: v.optional(v.string()),
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
		PUBLIC_POSTHOG_API_KEY: v.optional(v.string()),
	},

	// Shared environment variables (available on both client and server)
	shared: {
		NODE_ENV: v.optional(v.picklist(["development", "test", "production"]), "development"),
		APP_ENV: v.picklist(["development", "preview", "staging", "production"]),
		PUBLIC_APP_URL: v.optional(v.pipe(v.string(), v.url())),
	},
});
