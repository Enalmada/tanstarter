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
					plugins: ["@lingui/babel-plugin-lingui-macro"],
				},
			}),

			lingui(),
		],
		envPrefix: ["PUBLIC_"],
		assetsInclude: ["**/*.po"],
		optimizeDeps: {
			exclude: ["@lingui/macro", "@lingui/react"],
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
