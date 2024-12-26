import {
	type CspRule,
	type SecurityHeaders,
	type SecurityOptions,
	createSecurityHeaders,
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

	const mergedDirectives = { ...defaultCspDirectives };

	// Merge all rules into directives
	rules.forEach((rule) => {
		Object.entries(rule).forEach(([key, value]) => {
			if (key !== "description" && key !== "source" && value !== undefined) {
				const directiveKey = key as keyof typeof mergedDirectives;
				if (!mergedDirectives[directiveKey]) {
					mergedDirectives[directiveKey] = [];
				}
				// Split value by spaces and add each part
				const values = value.split(" ");
				values.forEach((val: string) => {
					if (!mergedDirectives[directiveKey]!.includes(val)) {
						mergedDirectives[directiveKey]!.push(val);
					}
				});
			}
		});
	});

	// Generate CSP header value
	const cspValue = Object.entries(mergedDirectives)
		.map(([key, values]) => `${key} ${values.join(" ")}`)
		.join("; ");

	return createSecurityHeaders(cspValue, {
		config: headerConfig,
		nonce,
	});
}
