import { defineConfig } from "@tanstack/start/config";
import { cloudflare } from "unenv";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	vite: {
		plugins: [
			tsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
		],
	},

	server: {
		preset: "cloudflare-pages",
		unenv: cloudflare,
		// https://tanstack.com/router/latest/docs/framework/react/start/hosting#deployment
		// preset: "vercel",
	},
});
