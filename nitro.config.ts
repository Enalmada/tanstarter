import { defineConfig } from "nitro/config";

export default defineConfig({
	// Bun is the production runtime (Dockerfile CMD: `bun run .output/server/index.mjs`).
	// Pin the preset explicitly: otherwise Nitro auto-detects it from whichever runtime
	// runs `vite build`. Vite's bin has a `node` shebang, so on a machine with Node
	// installed the build gets `node-server`, which traces only the "node" export
	// condition (e.g. react-dom/server.node.js). Bun then resolves the "bun" condition
	// at runtime (react-dom/server.bun.js), which was never copied into .output, and
	// every SSR request 500s with "Cannot find module 'react-dom/server'".
	preset: "bun",
	// PostHog error tracking: Nitro's error hook, and a flush on shutdown
	plugins: ["./src/server/monitoring/nitro-plugin.ts"],
	// Cache headers for static files (checked against a build by scripts/check-asset-headers.sh).
	// Vite content-hashes everything in /assets, so it is safe to cache for a year. The service
	// worker and the manifest keep their names, so they must be revalidated on every load or
	// clients would keep an old worker after a deploy.
	routeRules: {
		"/assets/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
		"/sw.js": { headers: { "cache-control": "no-cache" } },
		"/manifest.json": { headers: { "cache-control": "no-cache" } },
	},
});
