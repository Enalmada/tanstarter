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
	experimental: {
		// Vite 8 beta: Enable native plugins for tsconfigPaths
		// Note: Warning about "native plugins disabled" is a known beta issue - can be ignored
		enableNativePlugin: true,
	},
	server: {
		hmr: {
			// PLAYWRIGHT env var is set in playwright.config.ts webServer.env.
			// The HMR error overlay intercepts pointer events and blocks
			// Playwright clicks when a transient SSR/streaming warning fires
			// (e.g. TanStack Start's "Response body object should not be
			// disturbed" — https://github.com/TanStack/router/issues/3584).
			// Keep the overlay on for human dev for visibility.
			overlay: process.env.PLAYWRIGHT !== "true",
		},
		watch: {
			// Prevent infinite watch loop: TanStack Router's `watchChange`
			// handler fires on its own output file, triggering regeneration,
			// which fires `watchChange` again.
			ignored: ["**/routeTree.gen.ts"],
		},
	},
	resolve: {
		tsconfigPaths: true,
	},
	plugins: [
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
		// Pre-bundle deps Vite would otherwise discover at runtime. When the
		// dev server discovers a new dep mid-session it triggers a full
		// client reload after pre-bundling (the "✨ new dependencies
		// optimized → ✨ reloading" pair in the dev log), which invalidates
		// `react/jsx-runtime` hashes mid-flight and crashes any pages
		// hydrating in that 10-15s window. Listing the discoverable deps
		// here forces the first-request optimization to happen at startup
		// before Playwright is allowed to send its first navigation (the
		// readiness check on the dev server is HTTP, not just TCP).
		//
		// Mirrors gell-v2/vite.config.ts. If the dep tree shifts, watch for
		// "✨ new dependencies optimized" lines that aren't on this list
		// and add them.
		include: [
			"@tanstack/history",
			"@tanstack/router-core",
			"@tanstack/router-core/ssr/client",
			"@tanstack/router-core/ssr/server",
			"defu",
			"nanostores",
			"seroval",
			"tiny-invariant",
		],
		exclude: [
			// better-auth ecosystem — server-only by design (drizzle / postgres
			// behind every export). Letting Vite pre-bundle these into the
			// client graph is the TSS-2 leak we sweep for in CI; keep them
			// out of the optimizer pass entirely.
			"better-auth",
			"@better-auth/core",
			"@better-auth/telemetry",
			"@better-auth/utils",
			"@better-fetch/fetch",
			"better-call",
			"better-sse",
			// better-auth transitive deps — no browser exports.
			"@noble/ciphers",
			"@noble/hashes",
			"jose",
			// Server-only framework deps leaked from SSR.
			"h3-v2",
		],
		// Force re-bundling under Playwright so stale-hash references from
		// a prior CI run can't break the first request.
		...(process.env.PLAYWRIGHT === "true" && { force: true }),
	},
});
