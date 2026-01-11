import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths(), tailwindcss()],
	optimizeDeps: {
		include: ["react/jsx-dev-runtime", "better-auth/minimal"],
	},
});
