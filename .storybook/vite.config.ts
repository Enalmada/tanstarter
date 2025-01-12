import postcssPresetMantine from "postcss-preset-mantine";
import postcssSimpleVars from "postcss-simple-vars";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths()],
	css: {
		postcss: {
			plugins: [
				postcssPresetMantine(),
				postcssSimpleVars(),
				require("tailwindcss"),
				require("autoprefixer"),
			],
		},
	},
});
