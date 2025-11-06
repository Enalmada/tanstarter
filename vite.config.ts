import path from "node:path";
import { lingui } from "@lingui/vite-plugin";
// TODO: Re-enable when Serwist Vite plugin works with Nitro v3
// import { serwist } from "@serwist/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { config } from "dotenv";
import { nitro } from "nitro/vite";
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
	// Then try Fly.io image ref
	if (process.env.FLY_IMAGE_REF) {
		return process.env.FLY_IMAGE_REF;
	}
	// Fallback to development
	return "development";
};

export default defineConfig({
	resolve: {
		alias: {
			"use-sync-external-store/shim/with-selector.js": path.resolve(
				__dirname,
				"./src/polyfills/use-sync-external-store-shim.ts",
			),
			"use-sync-external-store/shim/with-selector": path.resolve(
				__dirname,
				"./src/polyfills/use-sync-external-store-shim.ts",
			),
			"use-sync-external-store/shim/index.js": path.resolve(
				__dirname,
				"./src/polyfills/use-sync-external-store-shim.ts",
			),
			"use-sync-external-store/shim": path.resolve(__dirname, "./src/polyfills/use-sync-external-store-shim.ts"),
		},
	},
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
		// https://tanstack.com/start/latest/docs/framework/react/hosting#using-nitro-v3-beta
		nitro(),
		viteReact({
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
		// TODO: Serwist Vite plugin is currently DISABLED due to Nitro v3 incompatibility
		// ISSUE: Serwist runs during Vite's build phase but Nitro processes/moves assets
		//        AFTER that. Result: sw.js gets generated in dist/ but never copied to
		//        .output/public/ where Nitro serves from.
		// WORKAROUND: Using post-build script (scripts/generate-sw.ts) that runs after
		//             Nitro completes. See package.json build:prod script.
		// FUTURE FIX: This should work once Nitro v3 is stable and has proper integration
		//             hooks, or if Serwist adds a "closeBundleOrder: post" option to run
		//             after Nitro's processing.
		// REFERENCES: docs/sessions/serwist_support.md for full investigation
		// serwist({
		// 	base: "/",
		// 	scope: "/",
		// 	swUrl: "/_build/assets/sw.js",
		// 	swSrc: "./src/sw.ts",
		// 	swDest: "assets/sw.js",
		// 	globDirectory: "dist",
		// 	rollupFormat: "iife",
		// }),
		// Upload source maps to Rollbar after build
		...(process.env.ROLLBAR_SERVER_TOKEN && process.env.NODE_ENV === "production"
			? [
					viteRollbar({
						accessToken: process.env.ROLLBAR_SERVER_TOKEN,
						version: getBuildRelease(),
						baseUrl: process.env.PUBLIC_APP_URL || "http://localhost:3000",
						ignoreUploadErrors: true,
						silent: false,
					}),
				]
			: []),
	],
	// Only expose PUBLIC_ prefixed vars to client
	envPrefix: ["PUBLIC_", "APP_", "FLY_"],
	define: {
		// TODO - try getting rid of these now that we have envPrefix
		// Explicitly expose specific environment variables to client
		"process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN": JSON.stringify(process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN),
		// Environment and release info
		"process.env.APP_ENV": JSON.stringify(process.env.APP_ENV),
		"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		"process.env.PUBLIC_APP_URL": JSON.stringify(process.env.PUBLIC_APP_URL),
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
			external: [
				"perf_hooks",
				"crypto",
				"stream",
				"@react-email/render",
				"html-to-text",
				"prettier",
				"node:async_hooks",
			],
		},
	},
	ssr: {
		noExternal: ["better-auth"],
	},
	optimizeDeps: {
		exclude: ["better-auth"],
	},
});
