/**
 * TanStack Router Configuration
 *
 * Sets up router instance with route tree, context, and CSP nonce integration.
 *
 * ## What This File Does
 *
 * 1. Creates query client for server-state management
 * 2. Configures router with routes, context, and defaults
 * 3. Integrates CSP nonce for script execution security
 * 4. Sets up error boundaries and i18n wrapper
 *
 * ## CSP Nonce Integration
 *
 * This file is critical for Content Security Policy (CSP) security. It:
 * - Retrieves the per-request nonce from middleware (see src/start.ts)
 * - Applies the nonce to the router's SSR configuration
 * - Ensures all framework-generated <script> tags have the correct nonce
 * - Enables strict CSP (no 'unsafe-inline' for scripts in production)
 *
 * ## How Nonce Integration Works
 *
 * **Server-side (SSR):**
 * 1. Middleware generates nonce (src/start.ts)
 * 2. Nonce is passed through TanStack Start context
 * 3. `createNonceGetter()` retrieves nonce from context
 * 4. Router receives nonce via `ssr.nonce` option
 * 5. TanStack Start applies nonce to all framework <script> tags
 * 6. TanStack Start creates <meta property="csp-nonce"> with nonce value
 *
 * **Client-side (Hydration):**
 * 1. `createNonceGetter()` retrieves nonce from <meta> tag
 * 2. Client-side router has access to the same nonce
 * 3. Any client-side script generation can use the nonce if needed
 *
 * ## Why Isomorphic Nonce Getter?
 *
 * The nonce must be accessible on both server and client:
 * - **Server:** From middleware context (TanStack Start global middleware)
 * - **Client:** From meta tag (auto-created by TanStack Start)
 *
 * `createNonceGetter()` returns a function that works in both environments:
 * - Calls server function when running on server
 * - Calls client function when running in browser
 * - Returns the same nonce value in both contexts for a given request
 *
 * ## Security Model
 *
 * **Without Nonce (Insecure):**
 * ```html
 * <!-- CSP: script-src 'self' 'unsafe-inline' -->
 * <script>console.log('any inline script can run!')</script>
 * ```
 *
 * **With Nonce (Secure):**
 * ```html
 * <!-- CSP: script-src 'self' 'nonce-ABC123' -->
 * <script nonce="ABC123">console.log('only scripts with nonce can run')</script>
 * <script>console.log('blocked by CSP')</script>
 * ```
 *
 * ## CSP Header Example
 *
 * When you inspect the response headers, you'll see:
 * ```
 * Content-Security-Policy: script-src 'self' 'nonce-ABC123' 'strict-dynamic'; ...
 * ```
 *
 * And in the HTML, all framework scripts will have:
 * ```html
 * <script nonce="ABC123">...</script>
 * <meta property="csp-nonce" content="ABC123">
 * ```
 *
 * ## What Gets Nonces Applied?
 *
 * TanStack Start automatically applies the nonce to:
 * - Framework initialization scripts
 * - Route preloading scripts
 * - Hydration scripts
 * - Any <Scripts> or <ScriptOnce> components in your routes
 *
 * ## Custom Script Tags
 *
 * If you need to add custom inline scripts, access the nonce:
 * ```tsx
 * const getNonce = createNonceGetter();
 * const nonce = getNonce();
 *
 * return <script nonce={nonce}>console.log('custom script')</script>
 * ```
 *
 * ## Testing Nonce Integration
 *
 * To verify nonces are working:
 * 1. Run dev server: `bun run dev`
 * 2. Open browser DevTools
 * 3. Inspect page source (View → Developer → View Source)
 * 4. Search for `<script` tags
 * 5. Verify they have `nonce="XXXXX"` attribute
 * 6. Check <meta property="csp-nonce"> exists in <head>
 * 7. Verify CSP header includes matching nonce value
 *
 * ## Troubleshooting
 *
 * **If scripts aren't loading:**
 * - Check browser console for CSP violations
 * - Verify nonce is in CSP header (DevTools → Network → Response Headers)
 * - Verify nonce is on <script> tags (View Source)
 * - Ensure nonces match between header and scripts
 *
 * **If you see "Refused to execute inline script":**
 * - Script is missing nonce attribute
 * - Add nonce to custom scripts using `getNonce()`
 * - Or add the script source to src/config/cspRules.ts
 *
 * ## Package Reference
 *
 * - Package: @enalmada/start-secure
 * - Nonce Generator: src/start.ts (middleware)
 * - Nonce Getter: createNonceGetter()
 * - CSP Rules: src/config/cspRules.ts
 * - Docs: https://github.com/Enalmada/start-secure
 */

import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import type { ReactNode } from "react";
import type { SessionUser } from "~/utils/auth-client";
import { DefaultCatchBoundary } from "./components/DefaultCatchBoundary";
import { NotFound } from "./components/NotFound";
import { routeTree } from "./routeTree.gen";

/**
 * CSP Nonce Access - Workaround for AsyncLocalStorage Bug
 *
 * NOTE: We do NOT use createNonceGetter() from @enalmada/start-secure because it's broken.
 * The isomorphic wrapper breaks AsyncLocalStorage, preventing access to middleware context.
 *
 * Instead, we use direct context access in getRouter() below, which aligns with the
 * official TanStack Router pattern: https://github.com/TanStack/router/discussions/3028
 *
 * See .plan/plans/tanstack_csp/CRITICAL-BUG.md for full details on the bug.
 */

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}

interface RouterContext {
	queryClient: QueryClient;
	user: SessionUser | null | undefined;
}

export async function getRouter() {
	// biome-ignore lint/suspicious/noConsole: Debug router creation timing
	console.log("[router] getRouter() called");

	// Get nonce on server (client doesn't need it, uses meta tag)
	let nonce: string | undefined;
	if (typeof window === "undefined") {
		try {
			// Dynamic import for server-only code
			const { getStartContext } = await import("@tanstack/start-storage-context");
			const context = getStartContext();
			nonce = context.contextAfterGlobalMiddlewares?.nonce;
		} catch (_error) {
			nonce = undefined;
		}
	}

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				// TODO: confirm this is the best approach
				refetchOnWindowFocus: false,
				staleTime: 1000 * 60 * 5, // 5 minutes
				gcTime: 1000 * 60 * 60 * 24, // 24 hours
			},
		},
	});

	const router = createRouter({
		routeTree,
		context: { queryClient, user: undefined } as RouterContext,
		defaultPreload: "intent",
		// TODO: confirm this is the best approach
		// react-query will handle data fetching & caching
		// https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#passing-all-loader-events-to-an-external-cache
		defaultPreloadStaleTime: 1000 * 60 * 5, // 5 minutes
		defaultErrorComponent: DefaultCatchBoundary,
		defaultNotFoundComponent: NotFound,
		scrollRestoration: true,
		defaultStructuralSharing: true,
		Wrap: ({ children }: { children: ReactNode }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>,

		/**
		 * CSP Nonce Support - Critical for Security
		 *
		 * This configuration enables Content Security Policy (CSP) nonce support for all
		 * framework-generated scripts. Without this, we would need 'unsafe-inline' in CSP.
		 *
		 * ## What This Does:
		 *
		 * 1. Retrieves the per-request nonce from middleware context (via getNonce())
		 * 2. TanStack Start applies this nonce to ALL framework scripts it generates:
		 *    - Route hydration scripts
		 *    - Framework initialization scripts
		 *    - Preload scripts
		 *    - Any <Scripts> or <ScriptOnce> components
		 * 3. Creates <meta property="csp-nonce" content="XXX"> tag in <head>
		 *
		 * ## Security Benefit:
		 *
		 * **Without nonce (insecure):**
		 * - CSP must allow 'unsafe-inline' for scripts
		 * - Any inline script can execute (XSS vulnerability)
		 *
		 * **With nonce (secure):**
		 * - CSP only allows scripts with correct nonce attribute
		 * - Inline scripts without nonce are blocked
		 * - XSS attacks are prevented (attackers can't guess the nonce)
		 *
		 * ## Example HTML Output:
		 *
		 * ```html
		 * <head>
		 *   <meta property="csp-nonce" content="ABC123XYZ">
		 * </head>
		 * <body>
		 *   <script nonce="ABC123XYZ">// Framework code - allowed</script>
		 *   <script>// Injected XSS attempt - blocked</script>
		 * </body>
		 * ```
		 *
		 * ## Nonce Flow:
		 *
		 * 1. Request arrives at server
		 * 2. Middleware generates unique nonce (src/start.ts)
		 * 3. Nonce passed to router via TanStack Start context
		 * 4. getNonce() retrieves it (server: from context, client: from meta tag)
		 * 5. Router applies nonce to all framework scripts
		 * 6. CSP header includes the same nonce value
		 * 7. Only scripts with matching nonce can execute
		 *
		 * ## Reference:
		 * - Middleware: src/start.ts
		 * - Nonce Access: Direct context access (see getRouter() above)
		 * - CSP Rules: src/config/cspRules.ts
		 * - Bug Details: .plan/plans/tanstack_csp/CRITICAL-BUG.md
		 */
		// Only include ssr.nonce if nonce has a value (exactOptionalPropertyTypes)
		...(nonce ? { ssr: { nonce } } : {}),
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
		handleRedirects: true,
		wrapQueryClient: true,
	});

	return router;
}
