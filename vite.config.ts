import { lingui } from "@lingui/vite-plugin";
// TODO: Re-enable when Serwist Vite plugin works with Nitro v3
// import { serwist } from "@serwist/vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { config } from "dotenv";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { rollbarSourceMaps } from "./scripts/vite-rollbar-sourcemaps.ts";
import { serviceWorker } from "./scripts/vite-service-worker.ts";
import { getBuildRelease } from "./src/lib/env/build-release.ts";

config();

const buildRelease = getBuildRelease();

export default defineConfig({
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
		// Builds sw.js into the client output before Nitro snapshots it
		// (see scripts/vite-service-worker.ts for why not @serwist/vite).
		serviceWorker({ swSrc: "src/sw.ts" }),
		// With ROLLBAR_SERVER_TOKEN set: hidden client source maps, uploaded to
		// Rollbar and then deleted before Nitro snapshots the client output.
		rollbarSourceMaps({
			accessToken: process.env.ROLLBAR_SERVER_TOKEN,
			version: buildRelease,
			appUrl: process.env.PUBLIC_APP_URL,
			apiUrl: process.env.ROLLBAR_API_URL,
		}),
		// serwist({
		// 	base: "/",
		// 	scope: "/",
		// 	swUrl: "/_build/assets/sw.js",
		// 	swSrc: "./src/sw.ts",
		// 	swDest: "assets/sw.js",
		// 	globDirectory: "dist",
		// 	rollupFormat: "iife",
		// }),
	],
	// Only expose PUBLIC_ prefixed vars to client
	envPrefix: ["PUBLIC_"],
	define: {
		// TODO - try getting rid of these now that we have envPrefix
		// Explicitly expose specific environment variables to client
		"process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN": JSON.stringify(process.env.PUBLIC_ROLLBAR_ACCESS_TOKEN),
		// Environment and release info
		"process.env.APP_ENV": JSON.stringify(process.env.APP_ENV),
		"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		"process.env.PUBLIC_APP_URL": JSON.stringify(process.env.PUBLIC_APP_URL),
		"process.env.PUBLIC_POSTHOG_API_KEY": JSON.stringify(process.env.PUBLIC_POSTHOG_API_KEY),
		// The client's Rollbar code_version (src/client.tsx). Must equal the
		// version the source maps were uploaded under.
		"import.meta.env.PUBLIC_RELEASE_VERSION": JSON.stringify(buildRelease ?? ""),
	},
	assetsInclude: ["**/*.po"],
	// TODO confirm we need this build section.
	build: {
		// Support top-level await for ES2022
		target: "es2022",
		// Source maps in development only. Production builds ship none; with
		// ROLLBAR_SERVER_TOKEN set, rollbarSourceMaps() generates hidden client
		// maps for Rollbar and deletes them from the output.
		sourcemap: process.env.NODE_ENV === "development",
		rollupOptions: {
			// Node builtins only. Externalizing a package leaves a bare import
			// that the browser cannot resolve and that the bundled Nitro output
			// ships no node_modules for (see src/functions/email-preview.tsx).
			external: ["perf_hooks", "crypto", "stream", "node:async_hooks"],
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
			"@tanstack/router-core/isServer",
			"@tanstack/router-core/ssr/client",
			"@tanstack/router-core/ssr/server",
			"defu",
			"nanostores",
			"seroval",
			"tiny-invariant",
			"zod",
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
