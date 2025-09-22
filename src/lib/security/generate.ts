/**
 * Security header generation utilities
 * Generates CSP and other security headers
 * Handles nonce generation and policy compilation
 */

import {
	type CspRule,
	createSecurityHeaders,
	type SecurityHeaders,
	type SecurityOptions,
} from "./types";

export function generateSecurityHeaders(
	rules: CspRule[] = [],
	options: SecurityOptions = {},
): SecurityHeaders {
	const {
		isDev = process.env.NODE_ENV !== "production",
		nonce,
		headerConfig,
	} = options;

	// Base CSP directives with nonce support
	const defaultCspDirectives = {
		"default-src": ["'self'"],
		"base-uri": ["'self'"],
		"child-src": ["'none'"],
		"connect-src": isDev
			? ["'self'", "ws://localhost:*", "http://localhost:*"]
			: ["'self'"],
		"font-src": ["'self'"],
		"form-action": ["'self'"],
		"frame-ancestors": ["'none'"],
		"frame-src": ["'none'"],
		"img-src": ["'self'", "blob:", "data:"],
		"manifest-src": ["'self'"],
		"media-src": ["'self'"],
		"object-src": ["'none'"],
		"script-src": [
			"'self'",
			...(isDev ? ["'unsafe-eval'"] : []),
			...(nonce
				? [`'nonce-${nonce}'`, "'strict-dynamic'"]
				: ["'unsafe-inline'"]),
		],
		"style-src": [
			"'self'",
			...(nonce ? [`'nonce-${nonce}'`] : ["'unsafe-inline'"]),
		],
		"worker-src": ["'self'", "blob:"],
	};

	const mergedDirectives: Record<string, Set<string>> = {};

	// Initialize sets with default directives
	for (const [key, values] of Object.entries(defaultCspDirectives)) {
		mergedDirectives[key] = new Set(values);
	}

	// Merge all rules into directives using Sets for automatic deduplication
	for (const rule of rules) {
		for (const [key, value] of Object.entries(rule)) {
			if (key !== "description" && key !== "source" && value !== undefined) {
				const directiveKey = key as keyof typeof defaultCspDirectives;
				// If the directive doesn't exist yet, initialize it with default values if any
				if (!mergedDirectives[directiveKey]) {
					mergedDirectives[directiveKey] = new Set(
						defaultCspDirectives[directiveKey] || ["'self'"],
					);
				}
				// Handle both array and string values
				const values = Array.isArray(value)
					? value
					: value.split(" ").filter(Boolean);
				for (const val of values) {
					mergedDirectives[directiveKey].add(val);
				}
			}
		}
	}

	// Generate CSP header value from Sets
	const cspValue = Object.entries(mergedDirectives)
		.map(([key, valueSet]) => `${key} ${Array.from(valueSet).join(" ")}`)
		.join("; ");

	return createSecurityHeaders(cspValue, {
		...(headerConfig && { config: headerConfig }),
		...(nonce && { nonce }),
	});
}
