/**
 * Content Security Policy (CSP) Rules Configuration
 *
 * This file defines CSP rules for external services and resources used in the application.
 * These rules are merged with base security directives from @enalmada/start-secure.
 *
 * ## What is CSP?
 *
 * Content Security Policy (CSP) is a security standard that helps prevent XSS attacks,
 * clickjacking, and other code injection attacks by controlling which resources can be
 * loaded and executed by the browser.
 *
 * ## How It Works
 *
 * 1. Base directives are defined in @enalmada/start-secure (strict by default)
 * 2. These service-specific rules are merged with the base directives
 * 3. A unique nonce is generated per request for script execution
 * 4. The final CSP header is sent with every response
 *
 * ## Security Model
 *
 * **Scripts (Strict):**
 * - Only scripts with the correct nonce can execute
 * - No inline scripts without nonce (production)
 * - External scripts must be explicitly allowed here
 *
 * **Styles (Pragmatic):**
 * - 'unsafe-inline' allowed (frameworks inject dynamic styles)
 * - External stylesheets must be explicitly allowed here
 *
 * ## Adding New Services
 *
 * When integrating a new external service (analytics, CDN, etc.), add a rule:
 *
 * ```typescript
 * {
 *   description: 'service-name',  // Why this rule exists
 *   'script-src': 'https://cdn.service.com',  // If service loads scripts
 *   'style-src': 'https://cdn.service.com',   // If service loads styles
 *   'connect-src': 'https://api.service.com', // If service makes requests
 *   'img-src': 'https://img.service.com',     // If service loads images
 *   'font-src': 'https://fonts.service.com',  // If service loads fonts
 * }
 * ```
 *
 * ## CSP Directives Reference
 *
 * - `script-src` - Where scripts can be loaded from
 * - `style-src` - Where stylesheets can be loaded from
 * - `connect-src` - Where XHR/fetch/WebSocket can connect to
 * - `img-src` - Where images can be loaded from
 * - `font-src` - Where fonts can be loaded from
 * - `form-action` - Where forms can submit to
 * - `frame-src` - Where iframes can be loaded from
 *
 * ## Testing CSP Changes
 *
 * 1. Add your rule below
 * 2. Start dev server: `bun run dev`
 * 3. Open browser DevTools → Console
 * 4. Look for CSP violation warnings (if any)
 * 5. Adjust rules as needed
 *
 * ## Reference
 *
 * - Package: @enalmada/start-secure
 * - CSP Docs: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 * - Middleware: src/start.ts
 * - Nonce Integration: src/router.tsx
 */

import type { CspRule } from "@enalmada/start-secure";

export const cspRules: CspRule[] = [
	// Google OAuth Authentication
	// Allows OAuth flow redirects and profile images
	{
		description: "google-auth",
		"form-action": "'self' https://accounts.google.com", // OAuth form submissions
		"img-src": "https://*.googleusercontent.com", // User profile images
		"connect-src": "https://*.googleusercontent.com", // API requests for user data
	},

	// Sentry Error Tracking
	// Allows error reporting to Sentry for monitoring
	{
		description: "sentry",
		"worker-src": "blob:", // Sentry SDK uses web workers
		"connect-src": "https://o32548.ingest.sentry.io", // Error reporting endpoint
	},

	// Rollbar Error Tracking
	// Alternative/additional error monitoring service
	{
		description: "rollbar",
		"connect-src": "'self' https://api.rollbar.com https://*.rollbar.com", // Error reporting
	},

	// Image Demonstrations & Samples
	// Used in UI demos and example components
	{
		description: "imageDemo",
		"img-src": "'self' blob: data: https://images.unsplash.com", // Demo images from Unsplash
	},
	{
		description: "sampleimage",
		"img-src":
			"'self' blob: data: https://picsum.photos/200/300 https://fastly.picsum.photos/ https://i.pravatar.cc/ https://*.googleusercontent.com",
		// Sample image services: Lorem Picsum, Pravatar (avatars), Google profile pics
	},

	// Gravatar User Avatars
	// Profile images for users with Gravatar accounts
	{
		description: "gravatar",
		"img-src": "https://*.gravatar.com/avatar/",
	},

	// jsDelivr CDN
	// Content delivery network for libraries and assets
	{
		description: "jsdelivr-cdn",
		"style-src": "https://cdn.jsdelivr.net", // External stylesheets
		"connect-src": "https://cdn.jsdelivr.net", // Asset fetching
	},

	// PostHog Analytics
	// Product analytics and feature flags
	{
		description: "posthog",
		"script-src": "https://*.posthog.com", // Analytics SDK script
		"connect-src": "https://*.posthog.com", // Analytics events API
	},

	// Google Fonts
	// Typography and custom fonts
	{
		description: "google-fonts",
		"style-src": "https://fonts.googleapis.com", // Font CSS files
		"font-src": "https://fonts.gstatic.com", // Font files (woff2, etc.)
	},
];
