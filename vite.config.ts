import { lingui } from "@lingui/vite-plugin";
import { serwist } from "@serwist/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig } from "vite";
import viteRollbar from "vite-plugin-rollbar";
import tsConfigPaths from "vite-tsconfig-paths";

config();

// Get release info for build time
const getBuildRelease = () => {
	// First check for explicit release version (set in CI)
	if (process.env.RELEASE_VERSION) {
		return process.env.RELEASE_VERSION;
	}
	// Then try Cloudflare Pages info (legacy)
	if (process.env.CF_PAGES_COMMIT_SHA) {
		return `${process.env.CF_PAGES_BRANCH}@${process.env.CF_PAGES_COMMIT_SHA}`;
	}
	// Fallback to development
	return "development";
};

export default defineConfig({
	plugins: [
		tsConfigPaths({
			projects: ["./tsconfig.json"],
		}),
		tailwindcss(),
		tanstackStart({
			router: {
				quoteStyle: "double",
				semicolons: true,
			},
		}),
		react({
			// https://react.dev/learn/react-compiler
			jsxRuntime: "automatic",
			babel: {
				plugins: [
					[
						"babel-plugin-react-compiler",
						{
							target: "19",
						},
					],
					"@lingui/babel-plugin-lingui-macro",
				],
			},
		}),
		lingui(),
		serwist({
			base: "/",
			scope: "/",
			swUrl: "/_build/assets/sw.js",
			swSrc: "./src/sw.ts",
			swDest: "assets/sw.js",
			globDirectory: "dist",
			rollupFormat: "iife",
		}),
		// Upload source maps to Rollbar after build
		...(process.env.ROLLBAR_SERVER_TOKEN && process.env.NODE_ENV === "production"
			? [
					viteRollbar({
						accessToken: process.env.ROLLBAR_SERVER_TOKEN,
						version: getBuildRelease(),
						baseUrl: process.env.PUBLIC_APP_URL || process.env.CF_PAGES_URL || "http://localhost:3000",
						ignoreUploadErrors: true,
						silent: false,
					}),
				]
			: []),
	],
	// Only expose PUBLIC_ prefixed vars to client
	envPrefix: ["PUBLIC_", "APP_", "CF_"],
	define: {
		// TODO - try getting rid of these now that we have envPrefix
		// Explicitly expose specific environment variables to client
		"process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN": JSON.stringify(process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN),
		// Environment and release info
		"process.env.APP_ENV": JSON.stringify(process.env.APP_ENV),
		"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		// Cloudflare Pages environment info
		"process.env.CF_PAGES": JSON.stringify(process.env.CF_PAGES),
		"process.env.CF_PAGES_URL": JSON.stringify(process.env.CF_PAGES_URL),
		"process.env.CF_PAGES_BRANCH": JSON.stringify(process.env.CF_PAGES_BRANCH),
		"process.env.CF_PAGES_COMMIT_SHA": JSON.stringify(process.env.CF_PAGES_COMMIT_SHA),
		"process.env.PUBLIC_POSTHOG_API_KEY": JSON.stringify(process.env.PUBLIC_POSTHOG_API_KEY),
	},
	assetsInclude: ["**/*.po"],
	// TODO confirm we need this build section.
	build: {
		// Support top-level await for ES2022
		target: "es2022",
		// Only include source map URLs in development
		// In production, source maps are uploaded to Rollbar
		sourcemap: process.env.NODE_ENV === "development",
		rollupOptions: {
			external: ["perf_hooks", "crypto", "stream", "@react-email/render", "html-to-text", "prettier"],
		},
	},
});
