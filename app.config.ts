import { lingui } from "@lingui/vite-plugin";
import { serwist } from "@serwist/vite";
import { defineConfig } from "@tanstack/start/config";
import { config } from "dotenv";
import viteRollbar from "vite-plugin-rollbar";
import tsConfigPaths from "vite-tsconfig-paths";

// Load environment variables early for build plugins
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
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			// Upload source maps to Rollbar after build
			viteRollbar({
				accessToken: process.env.ROLLBAR_SERVER_TOKEN || "",
				version: getBuildRelease(),
				baseUrl: process.env.CF_PAGES_URL || "http://localhost:3000",
				ignoreUploadErrors: true,
				silent: false,
			}),
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
			],
			/*
			include: [
				"@casl/ability",
				"@lingui/core",
				"@lukemorales/query-key-factory",
				"@mantine/core",
				"@mantine/dates",
				"@mantine/hooks",
				"@mantine/modals",
				"@mantine/notifications",
				"@neondatabase/serverless",
				"@rollbar/react",
				"@serwist/window",
				"@tanstack/react-form",
				"@tanstack/react-query",
				"@tanstack/react-query-devtools",
				"@tanstack/react-router",
				"@tanstack/react-router-with-query",
				"@tanstack/react-table",
				"@tanstack/router-devtools",
				"@tanstack/start",
				"@tanstack/start/server",
				"@tanstack/start/server-functions-client",
				"@unpic/react",
				"better-auth",
				"better-auth/adapters/drizzle",
				"better-auth/client/plugins",
				"better-auth/react",
				"date-fns",
				"lucide-react",
				"nanoid/non-secure",
				"posthog-js",
				"react-dom/client",
				"rollbar",
				"valibot",
			],
			*/
		},
		build: {
			// Source map configuration
			sourcemap: true,
			rollupOptions: {
				output: {
					// Only include source map URLs in development
					// In production, source maps are uploaded to Rollbar
					sourcemap: process.env.NODE_ENV === "development",
				},
				/*
				external: [
					// Mark server-only packages as external to exclude from client bundle
					"better-auth",
					"better-auth/adapters/*",
					"better-auth/server",
					"better-auth/dist/server",
					"drizzle-orm",
					"drizzle-orm/pg-core",
					"drizzle-valibot",
					"@neondatabase/serverless",
				],
				*/
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
				["babel-plugin-react-compiler", { target: "19" }],
				"@lingui/babel-plugin-lingui-macro",
			],
		},
	},
});
