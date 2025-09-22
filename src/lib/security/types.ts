/**
 * Security-related TypeScript type definitions
 * Defines types for CSP rules and security headers
 * Includes configuration interfaces for security options
 */

export interface CspRule {
	description?: string;
	source?: string;
	"base-uri"?: string;
	"child-src"?: string;
	"connect-src"?: string;
	"default-src"?: string;
	"font-src"?: string;
	"form-action"?: string;
	"frame-ancestors"?: string;
	"frame-src"?: string;
	"img-src"?: string;
	"manifest-src"?: string;
	"media-src"?: string;
	"object-src"?: string;
	"script-src"?: string;
	"style-src"?: string;
	"worker-src"?: string;
}

export interface SecurityOptions {
	isDev?: boolean;
	nonce?: string;
	headerConfig?: SecurityHeadersConfig;
}

export interface SecurityHeadersConfig {
	"X-Frame-Options"?: string;
	"X-Content-Type-Options"?: string;
	"Referrer-Policy"?: string;
	"X-XSS-Protection"?: string;
	"Strict-Transport-Security"?: string;
	"Permissions-Policy"?: string;
	"X-Powered-By"?: string;
}

export interface SecurityHeaders {
	"Content-Security-Policy": string;
	"X-Frame-Options": string;
	"X-Content-Type-Options": string;
	"Referrer-Policy": string;
	"X-XSS-Protection": string;
	"Strict-Transport-Security": string;
	"Permissions-Policy": string;
	"X-Powered-By"?: string;
	"x-nonce"?: string;
}

export const defaultSecurityHeadersConfig: Required<Omit<SecurityHeadersConfig, "X-Powered-By">> = {
	// Prevent clickjacking
	"X-Frame-Options": "DENY",
	// Prevent MIME-sniffing
	"X-Content-Type-Options": "nosniff",
	// Control referrer information
	"Referrer-Policy": "strict-origin-when-cross-origin",
	// Legacy XSS protection
	"X-XSS-Protection": "1; mode=block",
	// Force HTTPS
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
	// Control browser features
	"Permissions-Policy":
		"accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
};

export interface CreateSecurityHeadersOptions {
	config?: SecurityHeadersConfig;
	nonce?: string;
}

export function createSecurityHeaders(cspValue: string, options: CreateSecurityHeadersOptions = {}): SecurityHeaders {
	const { config = {}, nonce } = options;

	// Merge default config with provided overrides and ensure required fields
	const finalConfig = {
		...defaultSecurityHeadersConfig,
		...config,
	};

	// Ensure all required fields have values
	const headers: SecurityHeaders = {
		"Content-Security-Policy": cspValue,
		"X-Frame-Options": finalConfig["X-Frame-Options"] || defaultSecurityHeadersConfig["X-Frame-Options"],
		"X-Content-Type-Options":
			finalConfig["X-Content-Type-Options"] || defaultSecurityHeadersConfig["X-Content-Type-Options"],
		"Referrer-Policy": finalConfig["Referrer-Policy"] || defaultSecurityHeadersConfig["Referrer-Policy"],
		"X-XSS-Protection": finalConfig["X-XSS-Protection"] || defaultSecurityHeadersConfig["X-XSS-Protection"],
		"Strict-Transport-Security":
			finalConfig["Strict-Transport-Security"] || defaultSecurityHeadersConfig["Strict-Transport-Security"],
		"Permissions-Policy": finalConfig["Permissions-Policy"] || defaultSecurityHeadersConfig["Permissions-Policy"],
	};

	// Only add optional headers if they're explicitly set
	if ("X-Powered-By" in finalConfig && finalConfig["X-Powered-By"] !== undefined) {
		headers["X-Powered-By"] = finalConfig["X-Powered-By"];
	}

	if (nonce) {
		headers["x-nonce"] = nonce;
	}

	return headers;
}
