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
		description: "rollbar",
		"connect-src": "'self' https://api.rollbar.com https://*.rollbar.com",
		source: "/:path*",
	},
	{
		description: "imageDemo",
		"img-src": "'self' blob: data: https://images.unsplash.com",
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
	{
		description: "posthog",
		"script-src": "https://*.posthog.com",
		"connect-src": "https://*.posthog.com",
		source: "/:path*",
	},
	{
		description: "google-fonts",
		"style-src": "'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src": "'self' https://fonts.gstatic.com",
		source: "/:path*",
	},
];
