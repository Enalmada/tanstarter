// app.config.ts
import { lingui } from "@lingui/vite-plugin";
import { serwist } from "@serwist/vite";
import { defineConfig } from "@tanstack/start/config";
import react from "@vitejs/plugin-react";
import { cloudflare } from "unenv";
import tsConfigPaths from "vite-tsconfig-paths";
import { cspRules } from "./app/lib/security/cspRules";
import { generateSecurityHeaders } from "./app/lib/security/generate";

export default defineConfig({
	vite: {
		plugins: [
			tsConfigPaths({
				projects: ["./tsconfig.json"],
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
		envPrefix: ["PUBLIC_", "VITE_"],
		define: {
			// Expose environment variables to the client
			"import.meta.env.PUBLIC_ROLLBAR_ACCESS_TOKEN": JSON.stringify(
				process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN,
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
			],
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
