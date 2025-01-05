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
			"https://picsum.photos/200/300 https://fastly.picsum.photos/ https://i.pravatar.cc/",
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
