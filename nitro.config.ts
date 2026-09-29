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
});
