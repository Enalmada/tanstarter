/**
 * Release version known at build time, shared by everything that must agree on
 * it: the client bundle's Rollbar `code_version` (vite.config.ts define), the
 * source map upload (scripts/vite-rollbar-sourcemaps.ts), and the deploy
 * notification (src/lib/monitoring/deploy.ts). Rollbar only applies a source
 * map to items whose `code_version` equals the upload's `version`.
 *
 * No `~/env` import: this runs inside vite.config.ts, before any app env exists.
 *
 * Returns undefined when neither variable is set, so callers skip the upload
 * instead of filing maps under a version no client reports.
 */
export function getBuildRelease(): string | undefined {
	const explicit = process.env.RELEASE_VERSION?.trim();
	if (explicit) return explicit;

	// registry.fly.io/app:deployment-XXXX -> deployment-XXXX. Same extraction as
	// getRelease() in ./release.ts, and it keeps the value under Rollbar's
	// 40-character code_version limit.
	const imageRef = process.env.FLY_IMAGE_REF?.trim();
	if (imageRef) return imageRef.split(":").pop() || imageRef;

	return undefined;
}
