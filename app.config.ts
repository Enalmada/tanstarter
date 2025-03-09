import { lingui } from "@lingui/vite-plugin";
import { serwist } from "@serwist/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import { config } from "dotenv";
import type { PluginOption } from "vite";
import viteRollbar from "vite-plugin-rollbar";
import tsConfigPaths from "vite-tsconfig-paths";
import { cspRules } from "./app/lib/security/cspRules";
import { generateSecurityHeaders } from "./app/lib/security/generate";

config();

// Get release info for build time
const getBuildRelease = () => {
	if (process.env.CF_PAGES_COMMIT_SHA) {
		return `${process.env.CF_PAGES_BRANCH}@${process.env.CF_PAGES_COMMIT_SHA}`;
	}
	return "development";
};

export default defineConfig({
	vite: {
		plugins: [
			// serverGuard(serverGuardConfig),
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			tailwindcss(),
			// Upload source maps to Rollbar after build
			...(process.env.ROLLBAR_SERVER_TOKEN
				? [
						viteRollbar({
							accessToken: process.env.ROLLBAR_SERVER_TOKEN,
							version: getBuildRelease(),
							baseUrl: process.env.CF_PAGES_URL || "http://localhost:3000",
							ignoreUploadErrors: true,
							silent: false,
						}),
					]
				: []),
			serwist({
				base: "/",
				scope: "/",
				swUrl: "/_build/assets/sw.js",
				swSrc: "./app/sw.ts",
				swDest: "assets/sw.js",
				globDirectory: "dist",
				rollupFormat: "iife",
			}),
			lingui(),
		] as PluginOption[],
		// Only expose PUBLIC_ prefixed vars to client
		envPrefix: ["PUBLIC_", "APP_", "CF_"],
		define: {
			// TODO - try getting rid of these now that we have envPrefix
			// Explicitly expose specific environment variables to client
			"process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN": JSON.stringify(
				process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN,
			),
			// Environment and release info
			"process.env.APP_ENV": JSON.stringify(process.env.APP_ENV),
			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
			// Cloudflare Pages environment info
			"process.env.CF_PAGES": JSON.stringify(process.env.CF_PAGES),
			"process.env.CF_PAGES_URL": JSON.stringify(process.env.CF_PAGES_URL),
			"process.env.CF_PAGES_BRANCH": JSON.stringify(
				process.env.CF_PAGES_BRANCH,
			),
			"process.env.CF_PAGES_COMMIT_SHA": JSON.stringify(
				process.env.CF_PAGES_COMMIT_SHA,
			),
			"process.env.PUBLIC_POSTHOG_API_KEY": JSON.stringify(
				process.env.PUBLIC_POSTHOG_API_KEY,
			),
		},
		assetsInclude: ["**/*.po"],
		optimizeDeps: {
			exclude: [
				"@lingui/macro",
				"@lingui/react",
				"drizzle-orm",
				"drizzle-orm/pg-core",
				"drizzle-valibot",
				"@neondatabase/serverless",
				"@react-email/render",
				"rollbar",
				/*
				"@tanstack/react-start/server",
				"@tanstack/react-start/server-functions",
				"@tanstack/react-start/server-functions-client",
				"@tanstack/react-start/api",
				"@tanstack/react-start/router-manifest",
				"node:async_hooks",
				"node:stream",
				"node:stream/web",
				"node:buffer",
				"node:util",
				"node:url",
				"node:net",
				"node:http",
				"node:https",
				"node:events",
				"node:assert",
				"node:child_process",
				"node:crypto",
				"node:fs",
				"node:module",
				"node:os",
				"node:path",
				"node:process",
				"node:querystring",
				"node:readline",
				"node:tls",
				"node:zlib",
				*/
			],

			include: [
				"@casl/ability",
				"@lingui/core",
				"@lukemorales/query-key-factory",
				"@radix-ui/react-scroll-area",
				"@radix-ui/react-slot",
				"@radix-ui/react-avatar",
				"@radix-ui/react-dropdown-menu",
				"@radix-ui/react-checkbox",
				"@radix-ui/react-label",
				"@radix-ui/react-radio-group",
				"@radix-ui/react-select",
				"@radix-ui/react-popover",
				"@radix-ui/react-dialog",
				"@rollbar/react",
				"@tanstack/react-form",
				"@tanstack/react-query",
				"@tanstack/react-query-devtools",
				"@tanstack/react-router",
				"@tanstack/react-table",
				"@tanstack/react-start",
				"@tanstack/react-start/client",
				"@tanstack/react-start/server-functions-client",
				"@tanstack/react-start/server",
				"@tanstack/react-router-with-query",
				"@tanstack/router-devtools",
				"@unpic/react",
				"better-auth/client",
				"better-auth/react",
				"better-auth/client/plugins",
				"class-variance-authority",
				"clsx",
				"date-fns",
				"lucide-react",
				"nanoid/non-secure",
				"next-themes",
				"posthog-js",
				"react-dom/client",
				"sonner",
				"tailwind-merge",
				"@serwist/window",
				"valibot",
			],
		},
		// TODO confirm we need this build section.
		build: {
			// Source map configuration
			sourcemap: true,
			rollupOptions: {
				output: {
					// Only include source map URLs in development
					// In production, source maps are uploaded to Rollbar
					sourcemap: process.env.NODE_ENV === "development",
				},
			},
		},
	},
	server: {
		preset: "bun",
		serveStatic: "node",
		routeRules: {
			"/**": {
				headers: {
					...generateSecurityHeaders(cspRules),
					"Service-Worker-Allowed": "/",
				},
			},
		},
	},
	/*
	server: {
		preset: "cloudflare-pages",
		unenv: cloudflare,
		routeRules: {
			"/**": {
				headers: {
					...generateSecurityHeaders(cspRules),
					"Service-Worker-Allowed": "/",
				},
			},
		},
	},
	*/
	react: {
		babel: {
			plugins: [
				...(process.env.NODE_ENV === "production"
					? [["babel-plugin-react-compiler", { target: "19" }]]
					: []),
				"@lingui/babel-plugin-lingui-macro",
			],
		},
	},
});
