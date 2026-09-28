/**
 * Rollbar source map plugin (production builds only).
 *
 * Turns on hidden source maps for the client environment, uploads each map to
 * Rollbar, then deletes every `.map` from the client output. It runs in the
 * client environment's `writeBundle`, so the maps are gone before Nitro builds
 * the server and snapshots `.output/public`, and are never served. "hidden"
 * leaves no `sourceMappingURL` comment in the shipped JavaScript.
 *
 * Replaces `vite-plugin-rollbar`, which never uploaded anything: it only ran
 * with NODE_ENV=production, where no maps were generated, and it globbed
 * `./dist`, while the client is written to `.output/public`.
 *
 * The map's `version` must equal the client's Rollbar `code_version` (both come
 * from getBuildRelease()), and `minified_url` must match the script URL in the
 * browser's stack frames.
 *
 * Upload failures warn instead of failing the build: monitoring should never
 * block a deploy. The maps are deleted either way.
 *
 * @see {@link https://docs.rollbar.com/docs/source-maps}
 */

import { readdir, readFile, rm } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import type { Plugin } from "vite";

const DEFAULT_API_URL = "https://api.rollbar.com/api/1";
const UPLOAD_CONCURRENCY = 6;
// Rollbar rejects a longer code_version, and a map filed under a truncated one
// would never match.
const MAX_VERSION_LENGTH = 40;

interface Options {
	/** post_server_item token. The plugin is inert without one. */
	accessToken: string | undefined;
	/** Must equal the client's Rollbar `code_version`. */
	version: string | undefined;
	/** Public origin the client is served from, e.g. https://example.com. */
	appUrl: string | undefined;
	/** Rollbar API base. Overridable so the upload can be tested against a mock. */
	apiUrl?: string | undefined;
}

export function rollbarSourceMaps({ accessToken, version, appUrl, apiUrl }: Options): Plugin {
	return {
		name: "tanstarter:rollbar-sourcemaps",
		apply: (_config, { command }) => command === "build" && Boolean(accessToken),
		applyToEnvironment: (environment) => environment.name === "client",
		configEnvironment(name) {
			if (name === "client") return { build: { sourcemap: "hidden" } };
		},
		writeBundle: {
			sequential: true,
			async handler(_options, bundle) {
				const { root, base, build: buildConfig } = this.environment.config;
				const outDir = resolve(root, buildConfig.outDir);

				try {
					if (!accessToken || !version || !appUrl || version.length > MAX_VERSION_LENGTH) {
						const reason = !version
							? "no RELEASE_VERSION or FLY_IMAGE_REF"
							: !appUrl
								? "no PUBLIC_APP_URL"
								: `version "${version}" is over ${MAX_VERSION_LENGTH} characters`;
						this.warn(`source maps not uploaded to Rollbar: ${reason}`);
						return;
					}

					const endpoint = `${(apiUrl || DEFAULT_API_URL).replace(/\/+$/, "")}/sourcemap`;
					const uploads = Object.values(bundle).flatMap((output) =>
						output.type === "chunk" && output.sourcemapFileName
							? [{ jsFile: output.fileName, mapFile: output.sourcemapFileName }]
							: [],
					);

					const failures: string[] = [];
					const queue = [...uploads];
					const worker = async () => {
						for (let item = queue.shift(); item; item = queue.shift()) {
							const { jsFile, mapFile } = item;
							try {
								const form = new FormData();
								form.set("access_token", accessToken);
								form.set("version", version);
								form.set("minified_url", minifiedUrl(appUrl, base, jsFile));
								const map = await readFile(join(outDir, mapFile));
								form.set("source_map", new Blob([map], { type: "application/json" }), basename(mapFile));

								const response = await fetch(endpoint, { method: "POST", body: form });
								if (!response.ok) {
									const body = (await response.text()).slice(0, 200);
									failures.push(`${jsFile}: ${response.status} ${body}`);
								}
							} catch (error) {
								failures.push(`${jsFile}: ${error instanceof Error ? error.message : String(error)}`);
							}
						}
					};
					await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, uploads.length) }, worker));

					for (const failure of failures) this.warn(`Rollbar source map upload failed: ${failure}`);
					this.info(`Rollbar: uploaded ${uploads.length - failures.length}/${uploads.length} source maps (${version})`);
				} finally {
					// Every .map on disk, not just the bundle's: nothing under the client
					// output may keep one.
					const files = await readdir(outDir, { recursive: true });
					const maps = files.filter((file) => file.endsWith(".map"));
					await Promise.all(maps.map((file) => rm(join(outDir, file), { force: true })));
				}
			},
		},
	};
}

// Rollbar wants the URL without its scheme ("//host/path"), so http and https
// page loads both match.
function minifiedUrl(appUrl: string, base: string, fileName: string): string {
	const url = new URL(`${base.replace(/\/*$/, "/")}${fileName}`, appUrl);
	return `//${url.host}${url.pathname}`;
}
