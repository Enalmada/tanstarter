/**
 * Service Worker Generation Script
 *
 * This script generates the service worker AFTER Nitro completes the build.
 * This is a workaround for the Serwist Vite plugin incompatibility with Nitro v3.
 *
 * TODO: Remove this script once Serwist Vite plugin works with Nitro v3
 *       See vite.config.ts and docs/sessions/serwist_support.md for details
 *
 * @see {@link https://serwist.pages.dev/docs/build/configuring}
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { injectManifest } from "@serwist/build";

const OUTPUT_DIR = resolve(process.cwd(), ".output/public");
const SW_SRC = resolve(process.cwd(), "src/sw.ts");
const SW_DEST = resolve(OUTPUT_DIR, "sw.js");

async function generateServiceWorker() {
	// Check if output directory exists (Nitro should have created it)
	if (!existsSync(OUTPUT_DIR)) {
		process.stderr.write(
			`⚠️  Output directory not found: ${OUTPUT_DIR}\n` +
				"   Skipping service worker generation.\n" +
				"   This is expected in development mode.\n",
		);
		return;
	}

	// Check if service worker source exists
	if (!existsSync(SW_SRC)) {
		process.stderr.write(`❌ Service worker source not found: ${SW_SRC}\n`);
		process.exit(1);
	}

	try {
		process.stdout.write("🔨 Generating service worker...\n");

		const { count, size, warnings } = await injectManifest({
			swSrc: SW_SRC,
			swDest: SW_DEST,
			globDirectory: OUTPUT_DIR,
			globPatterns: [
				// Cache all static assets
				"**/*.{js,css,html,png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot}",
				// Cache PWA manifest and icons
				"manifest.json",
				"icon512_*.png",
			],
			// Don't cache source maps or node_modules
			globIgnores: ["**/*.map", "**/node_modules/**"],
			// Match what's in vite config
			injectionPoint: "self.__SW_MANIFEST",
			// Increase max file size for larger bundles (default is 2MB)
			maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
		});

		process.stdout.write(`✅ Service worker generated successfully!\n`);
		process.stdout.write(`   📦 Precached ${count} files (${(size / 1024).toFixed(2)} KB)\n`);
		process.stdout.write(`   📍 Location: ${SW_DEST}\n`);

		if (warnings.length > 0) {
			process.stdout.write(`\n⚠️  Warnings:\n`);
			for (const warning of warnings) {
				process.stdout.write(`   - ${warning}\n`);
			}
		}
	} catch (error) {
		process.stderr.write(`❌ Failed to generate service worker:\n`);
		if (error instanceof Error) {
			process.stderr.write(`   ${error.message}\n`);
			if (error.stack) {
				process.stderr.write(`\n${error.stack}\n`);
			}
		}
		process.exit(1);
	}
}

// Run if called directly
if (process.argv[1]?.endsWith("generate-sw.ts")) {
	generateServiceWorker().catch((error) => {
		const errorMsg = error instanceof Error ? error.message : String(error);
		process.stderr.write(`Unexpected error: ${errorMsg}\n`);
		process.exit(1);
	});
}

export { generateServiceWorker };
