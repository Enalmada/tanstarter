import { lingui } from "@lingui/vite-plugin";
import { serwist } from "@serwist/vite";
import { defineConfig } from "@tanstack/start/config";
import { config } from "dotenv";
import { cloudflare } from "unenv";
import viteRollbar from "vite-plugin-rollbar";
import tsConfigPaths from "vite-tsconfig-paths";
import { cspRules } from "./app/lib/security/cspRules";
import { generateSecurityHeaders } from "./app/lib/security/generate";
import { serverGuard } from "./app/lib/vite/server-guard";
import { serverGuardConfig } from "./app/lib/vite/server-guard-config";

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
			serverGuard(serverGuardConfig),
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
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
		],
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
				/*
				"@tanstack/start/server",
				"@tanstack/start/server-functions",
				"@tanstack/start/server-functions-client",
				"@tanstack/start/api",
				"@tanstack/start/router-manifest",
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
				"@react-email/components",
				"@react-email/render",
				"@rollbar/react",
				"@tanstack/react-form",
				"@tanstack/react-query",
				"@tanstack/react-query-devtools",
				"@tanstack/react-router",
				"@tanstack/react-table",
				"@tanstack/start",
				"@tanstack/start/client",
				"@tanstack/start/server-functions-client",
				"@tanstack/start/server",
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
				"rollbar",
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
				external: [
					// Be more specific about better-auth externals
					"better-auth/server",
					"better-auth/dist/server",
					"better-auth/adapters/*",
					"better-auth/adapters/drizzle",
					"better-auth/core/server",
					"better-auth/core/init",
					// Keep your server auth paths
					"~/server/auth/auth",
					"app/server/auth/auth",
					// replaced vinxi/http with @tanstack/start/server but that may have been a mistake
					// Node.js built-in modules that should not be bundled
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
				],
			},
		},
	},
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
