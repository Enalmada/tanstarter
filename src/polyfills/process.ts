/**
 * Process polyfill for browser environments
 * Provides minimal process.env support for Storybook tests
 */

// Define process globally if it doesn't exist
if (typeof process === "undefined") {
	(globalThis as typeof globalThis & { process: typeof process }).process = {
		env: {},
	} as typeof process;
}

export {};
