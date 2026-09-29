/**
 * Service worker build plugin (production builds only).
 *
 * Bundles `src/sw.ts` into the client output as `sw.js`, then injects the
 * Serwist precache manifest. It runs in the client environment's
 * `writeBundle`, so `sw.js` is on disk before Nitro builds the server and
 * snapshots `.output/public` into its static-asset manifest. Nitro serves only
 * files in that manifest, so a `sw.js` written after `vite build` 404s.
 *
 * Replaces the old post-build script, which also skipped bundling: it copied
 * the TypeScript source, bare imports and all, into `sw.js`.
 *
 * `@serwist/vite` can't be used directly: it reads the top-level Vite config,
 * not the client environment's, so it writes to the wrong directory.
 *
 * @see {@link https://serwist.pages.dev/docs/build/inject-manifest}
 */

import { resolve } from "node:path";
import { injectManifest } from "@serwist/build";
import { build, type Plugin } from "vite";

const SW_FILE = "sw.js";

export function serviceWorker({ swSrc }: { swSrc: string }): Plugin {
	return {
		name: "tanstarter:service-worker",
		apply: "build",
		applyToEnvironment: (environment) => environment.name === "client",
		writeBundle: {
			sequential: true,
			async handler() {
				const { root, build: buildConfig } = this.environment.config;
				const outDir = resolve(root, buildConfig.outDir);
				const swDest = resolve(outDir, SW_FILE);

				// 1. Bundle the worker. `self.__SW_MANIFEST` survives as-is for step 2.
				await build({
					configFile: false,
					root,
					logLevel: "warn",
					publicDir: false,
					define: { "process.env.NODE_ENV": JSON.stringify("production") },
					build: {
						outDir,
						emptyOutDir: false,
						target: "es2022",
						minify: true,
						lib: { entry: resolve(root, swSrc), formats: ["iife"], name: "sw", fileName: () => SW_FILE },
					},
				});

				// 2. Replace the injection point with the precache manifest.
				const { count, size, warnings } = await injectManifest({
					swSrc: swDest,
					swDest,
					globDirectory: outDir,
					// No html: a precached document would be served cache-first, ahead of
					// src/sw.ts's NetworkOnly navigation rule.
					globPatterns: ["**/*.{js,css,png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}", "manifest.json"],
					globIgnores: ["**/*.map", SW_FILE],
					injectionPoint: "self.__SW_MANIFEST",
					// Hashed filenames under assets/ never need a cache-busting revision.
					dontCacheBustURLsMatching: /^assets\//,
					maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				});
				for (const warning of warnings) this.warn(warning);
				this.info(`${SW_FILE}: precached ${count} files (${(size / 1024).toFixed(0)} KB)`);
			},
		},
	};
}
