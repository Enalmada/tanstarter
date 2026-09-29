/**
 * Runtime public env for the browser.
 *
 * Vite inlines client env at build time, but the Docker/Fly build has none of
 * these values (they arrive as runtime Fly secrets). Instead, the server
 * renders an allowlisted snapshot into the SSR HTML (see __root.tsx) before
 * the client entry runs, so one image works for every environment.
 *
 * Only APP_ENV and PUBLIC_* keys may ever be listed here: everything in this
 * list is readable by anyone who loads a page. NODE_ENV stays a build-time
 * constant.
 *
 * Kept free of framework imports: env.config.ts pulls this in.
 */

export const PUBLIC_RUNTIME_ENV_KEYS = ["APP_ENV", "PUBLIC_APP_URL", "PUBLIC_POSTHOG_API_KEY"] as const;

export type PublicRuntimeEnvKey = (typeof PUBLIC_RUNTIME_ENV_KEYS)[number];
export type PublicRuntimeEnv = Partial<Record<PublicRuntimeEnvKey, string>>;

const GLOBAL_KEY = "__PUBLIC_ENV__";

declare global {
	interface Window {
		__PUBLIC_ENV__?: PublicRuntimeEnv;
	}
}

/** Copy only the allowlisted, non-empty string values from `source`. */
export function pickPublicRuntimeEnv(source: Readonly<Record<string, unknown>>): PublicRuntimeEnv {
	const picked: PublicRuntimeEnv = {};
	for (const key of PUBLIC_RUNTIME_ENV_KEYS) {
		const value = source[key];
		if (typeof value === "string" && value !== "") {
			picked[key] = value;
		}
	}
	return picked;
}

/**
 * Inline script body that publishes `values` on `window`. Escapes `<` so a
 * value can never close the surrounding script tag.
 */
export function serializePublicRuntimeEnv(values: PublicRuntimeEnv): string {
	const json = JSON.stringify(values).replace(/</g, "\\u003c");
	return `window.${GLOBAL_KEY}=${json}`;
}

/** The snapshot the server rendered, or `{}` outside an SSR page (Storybook, tests). */
export function readPublicRuntimeEnv(): PublicRuntimeEnv {
	if (typeof window === "undefined") return {};
	return window.__PUBLIC_ENV__ ?? {};
}
