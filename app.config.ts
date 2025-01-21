import { lingui } from "@lingui/vite-plugin";
import { serwist } from "@serwist/vite";
import { defineConfig } from "@tanstack/start/config";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { cloudflare } from "unenv";
import viteRollbar from "vite-plugin-rollbar";
import tsConfigPaths from "vite-tsconfig-paths";
import { cspRules } from "./app/lib/security/cspRules";
import { generateSecurityHeaders } from "./app/lib/security/generate";

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

			react({
				babel: {
					plugins: [
						["babel-plugin-react-compiler", { target: "19" }],
						"@lingui/babel-plugin-lingui-macro",
					],
				},
			}),

			lingui(),
		],
		// Only expose PUBLIC_ prefixed vars to client
		envPrefix: ["PUBLIC_", "APP_", "CF_"],
		define: {
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
			include: [
				"@mantine/core",
				"@mantine/hooks",
				"@mantine/notifications",
				"@mantine/dates",
				"@mantine/modals",
				"@tanstack/react-query",
				"@tanstack/react-query-devtools",
				"@tanstack/react-router",
				"@tanstack/react-table",
				"@tanstack/react-form",
				"@tanstack/start",
				"@tanstack/start/client-runtime",
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
			],
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
			plugins: ["@lingui/babel-plugin-lingui-macro"],
		},
	},
});
