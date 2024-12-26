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
	},
	{
		description: "gravatar",
		"img-src": "https://gravatar.com/avatar/",
	},
];
