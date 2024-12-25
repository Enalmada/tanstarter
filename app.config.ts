import { defineConfig } from "@tanstack/start/config";
import { cloudflare } from "unenv";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	vite: {
		// ssr: { external: ["drizzle-orm"] },
		plugins: [
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
		],
		// Define which env vars are available at build time
		// define: {
		//			"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		//		},
		envPrefix: ["PUBLIC_"],
	},

	server: {
		preset: "cloudflare-pages",
		unenv: cloudflare,
	},
});
