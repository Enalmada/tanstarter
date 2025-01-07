/**
 * Content Security Policy (CSP) rules configuration
 * Defines security policies for content loading and execution
 * Includes rules for scripts, styles, and external resources
 */

import type { CspRule } from "./types";

export const cspRules: CspRule[] = [
	/*
  {
    description: "react-dev",
    "object-src": isDev ? "data:" : undefined,
    source: "/:path*",
  },
  {
    description: "nextui",
    "style-src": "'unsafe-inline'",
    source: "/:path*",
  },
  */
	{
		description: "google-auth",
		"form-action": "'self' https://accounts.google.com",
		"img-src": "https://*.googleusercontent.com",
		"connect-src": "https://*.googleusercontent.com",
		source: "/:path*",
	},
	{
		description: "sentry",
		"worker-src": "blob:",
		"connect-src": "https://o32548.ingest.sentry.io",
		source: "/:path*",
	},
	{
		description: "sampleimage",
		"img-src":
			"'self' blob: data: https://picsum.photos/200/300 https://fastly.picsum.photos/ https://i.pravatar.cc/ https://*.googleusercontent.com",
		source: "/:path*",
	},
	{
		description: "gravatar",
		"img-src": "https://gravatar.com/avatar/",
		source: "/:path*",
	},
	{
		description: "jsdelivr-cdn",
		"style-src": "'self' 'unsafe-inline' https://cdn.jsdelivr.net",
		"connect-src": "https://cdn.jsdelivr.net",
		source: "/:path*",
	},
];
