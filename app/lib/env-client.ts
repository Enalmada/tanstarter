/**
 * Client-side environment variable access
 * Uses import.meta.env for client-side safety
 */

export const clientEnv = {
	PUBLIC_ROLLBAR_ACCESS_TOKEN: import.meta.env
		.PUBLIC_ROLLBAR_ACCESS_TOKEN as string,
	NODE_ENV: import.meta.env.MODE as string,
} as const;
