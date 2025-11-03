/**
 * TanStack Start Configuration
 *
 * This file configures the TanStack Start instance with global request middleware,
 * including Content Security Policy (CSP) and security headers.
 *
 * ## What This Does
 *
 * 1. Creates a TanStack Start instance with middleware
 * 2. Registers CSP middleware that runs on EVERY request
 * 3. Generates a unique nonce for each request (for script execution)
 * 4. Sets security headers on every response
 *
 * ## Security Architecture
 *
 * **Per-Request Flow:**
 * 1. Request comes in → Middleware executes
 * 2. Generate unique cryptographic nonce (random 128-bit value)
 * 3. Build CSP header with nonce + service rules from cspRules.ts
 * 4. Set CSP and other security headers on response
 * 5. Pass nonce through context to router (see src/router.tsx)
 * 6. Router applies nonce to all framework-generated <script> tags
 * 7. Only scripts with matching nonce can execute
 *
 * ## Security Headers Set
 *
 * - **Content-Security-Policy:** Controls which resources can load/execute
 * - **X-Frame-Options:** Prevents clickjacking (denies iframe embedding)
 * - **X-Content-Type-Options:** Prevents MIME-sniffing attacks
 * - **Referrer-Policy:** Controls referrer information sent with requests
 * - **X-XSS-Protection:** Legacy XSS protection (for older browsers)
 * - **Strict-Transport-Security:** Forces HTTPS (production only)
 * - **Permissions-Policy:** Restricts browser features (camera, microphone, etc.)
 *
 * ## Development vs Production
 *
 * **Development Mode (isDev: true):**
 * - Allows 'unsafe-eval' for source maps and dev tools
 * - Allows WebSocket connections for Hot Module Replacement (HMR)
 * - Allows http:// and https:// for CDN scripts during development
 * - No HSTS header (allows HTTP for local development)
 *
 * **Production Mode (isDev: false):**
 * - Strict nonce-based CSP (no 'unsafe-eval')
 * - Only explicitly allowed external resources
 * - HSTS enabled (forces HTTPS)
 * - All security headers at maximum strictness
 *
 * ## CSP Rules
 *
 * Base directives (strict by default) are defined in @enalmada/start-secure.
 * Service-specific rules are defined in src/config/cspRules.ts.
 * These are merged together to create the final CSP header.
 *
 * ## Why Middleware Pattern?
 *
 * Using TanStack Start's global middleware ensures:
 * - Headers are set on EVERY response (no routes can bypass security)
 * - Nonce is generated fresh for EVERY request (unique per request)
 * - Middleware runs before routing (early in request lifecycle)
 * - Nonce can be passed through context to router
 *
 * ## Nonce Flow
 *
 * 1. Middleware generates nonce → passes to router via context
 * 2. Router receives nonce → applies to framework scripts (src/router.tsx)
 * 3. TanStack Start creates <meta property="csp-nonce"> with nonce value
 * 4. Client-side code can access nonce from meta tag if needed
 *
 * ## Package Reference
 *
 * - Package: @enalmada/start-secure
 * - Middleware API: createCspMiddleware()
 * - CSP Rules: src/config/cspRules.ts
 * - Nonce Integration: src/router.tsx
 * - Docs: https://github.com/Enalmada/start-secure
 *
 * ## Testing Security Headers
 *
 * To verify headers are being set:
 * 1. Run dev server: `bun run dev`
 * 2. Open browser DevTools → Network tab
 * 3. Click on any request to this server
 * 4. Check Response Headers → Look for "content-security-policy"
 * 5. Verify nonce is present: Look for 'nonce-XXXXX' in CSP header
 *
 * ## Troubleshooting CSP Violations
 *
 * If you see CSP violation warnings in the browser console:
 * 1. Identify which resource is being blocked
 * 2. Add appropriate rule to src/config/cspRules.ts
 * 3. Restart dev server
 * 4. Verify the resource now loads
 *
 * Example violation: "Refused to load script from 'https://cdn.example.com'"
 * Solution: Add { description: 'example-cdn', 'script-src': 'https://cdn.example.com' }
 */

import { createCspMiddleware } from "@enalmada/start-secure";
import { createStart } from "@tanstack/react-start";
import { cspRules } from "~/config/cspRules";

/**
 * TanStack Start instance with CSP middleware
 *
 * The middleware is registered in requestMiddleware array to run on every request.
 * Multiple middleware can be added here - they execute in array order.
 */
export const startInstance = createStart(() => ({
	requestMiddleware: [
		// CSP + Security Headers Middleware
		// Generates unique nonce per request, builds CSP header, sets security headers
		createCspMiddleware({
			// Service-specific CSP rules (merged with base directives)
			rules: cspRules,

			// Development mode options (affects CSP strictness)
			// - true: Allows unsafe-eval, WebSocket, HTTP/HTTPS for dev tools
			// - false: Strict CSP for production security
			options: { isDev: process.env.NODE_ENV !== "production" },
		}),

		// Add additional middleware here if needed
		// Example: authentication, logging, rate limiting, etc.
	],
}));
