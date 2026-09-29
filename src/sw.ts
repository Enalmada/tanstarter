/**
 * Service Worker implementation
 * Handles offline functionality and caching
 * Manages PWA features and background sync
 */

import { defaultCache } from "@serwist/vite/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. The injection point variable is
// defined as a global __SW_MANIFEST property on the self object.
declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
	}
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST ?? [],
	// Rollback: redeploying a build without /sw.js does NOT uninstall this
	// worker (the update check just fails). To remove it, ship a /sw.js that
	// calls skipWaiting(), deletes every cache, and unregisters itself.
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: [
		// Per-user responses never go in Cache Storage: page HTML (SSR renders
		// the signed-in user's data), server functions and API routes. Without
		// this, defaultCache's catch-all NetworkFirst rule keeps them for a day
		// and serves them after sign-out whenever the network is slow.
		{
			matcher: ({ request, sameOrigin, url }) =>
				sameOrigin &&
				(request.mode === "navigate" || url.pathname.startsWith("/_serverFn/") || url.pathname.startsWith("/api/")),
			handler: new NetworkOnly(),
		},
		...defaultCache,
	],
});

serwist.addEventListeners();
