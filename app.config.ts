// import { serverGuard } from "./app/lib/vite/server-guard";
import { lingui } from "@lingui/vite-plugin";
// import { serwist } from "@serwist/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/start/config";
import { config } from "dotenv";
import { cloudflare } from "unenv";
// import viteRollbar from "vite-plugin-rollbar";
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
			// serverGuard(),
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			tailwindcss(),
			// Upload source maps to Rollbar after build
			/* 			...(process.env.ROLLBAR_SERVER_TOKEN
				? [
						viteRollbar({
							accessToken: process.env.ROLLBAR_SERVER_TOKEN,
							version: getBuildRelease(),
							baseUrl: process.env.CF_PAGES_URL || "http://localhost:3000",
							ignoreUploadErrors: true,
							silent: false,
						}),
					]
				: []), */
			// TODO - serwist having trouble on cloudflare pages
			// "~": process.env.CF_PAGES ? "/opt/buildhome/repo/app"  : "./app",
			/*
			serwist({
				base: "/",
				scope: "/",
				swUrl: "/_build/assets/sw.js",
				swSrc: "./app/sw.ts",
				swDest: "assets/sw.js",
				globDirectory: "dist",
				rollupFormat: "iife",
			}),
*/

			/*
			react({
				// Force inclusion of React refresh preamble
				babel: {
					plugins: [
						...(process.env.NODE_ENV === "production"
							? [["babel-plugin-react-compiler", { target: "19" }]]
							: []),
						"@lingui/babel-plugin-lingui-macro",
					],
				},
			}),
			*/

			lingui(),
		],
		resolve: {
			alias: {
				"~": "./app",
			},
		},
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
				"better-auth",
				"better-auth/adapters/*",
				"better-auth/server",
				"better-auth/dist/server",
				"@neondatabase/serverless",
			],
			include: [
				"@radix-ui/react-scroll-area",
				"@radix-ui/react-slot",
				"@radix-ui/react-avatar",
				"@radix-ui/react-dropdown-menu",
				"@radix-ui/react-checkbox",
				"@radix-ui/react-label",
				"@radix-ui/react-radio-group",
				"@radix-ui/react-select",
				"@radix-ui/react-popover",
				"class-variance-authority",
				"sonner",
				"clsx",
				"tailwind-merge",
				"posthog-js",
				"@radix-ui/react-dialog",
				"@tanstack/react-query",
				"@tanstack/react-query-devtools",
				"@tanstack/react-router",
				"@tanstack/react-table",
				"@tanstack/react-form",
				"@tanstack/start",
				"@tanstack/start/client",
				"@tanstack/react-router-with-query",
				"@tanstack/router-devtools",
				"@serwist/window",
				"@lukemorales/query-key-factory",
				"@lingui/core",
				"valibot",
				"nanoid/non-secure",
				"react-dom/client",
				"better-auth/client/plugins",
				"better-auth/react",
				"lucide-react",
				"date-fns",
				"@unpic/react",
				"@casl/ability",
				"@rollbar/react",
				"rollbar",
				"next-themes",
				"@tanstack/start/server-functions-client",
				"@tanstack/start/server",
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
				/* 				external: [
					// Mark server-only packages as external to exclude from client bundle
					"better-auth",
					"better-auth/adapters/*",
					"better-auth/server",
					"better-auth/dist/server",
					"drizzle-orm",
					"drizzle-orm/pg-core",
					"drizzle-valibot",
					"@neondatabase/serverless",
					// Node.js built-in modules
					"node:stream",
					"node:stream/web",
					"node:async_hooks",
				], */
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
