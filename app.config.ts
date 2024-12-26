import { defineConfig } from "@tanstack/start/config";
import { cloudflare } from "unenv";
import tsConfigPaths from "vite-tsconfig-paths";
import { cspRules } from "./app/lib/security/cspRules";
import { generateSecurityHeaders } from "./app/lib/security/generate";

export default defineConfig({
	vite: {
		// ssr: { external: ["drizzle-orm"] },
		plugins: [
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
		],
		envPrefix: ["PUBLIC_"],
	},
	server: {
		preset: "cloudflare-pages",
		unenv: cloudflare,
		routeRules: {
			"/**": {
				headers: {
					...generateSecurityHeaders(cspRules),
				},
			},
		},
	},
});
