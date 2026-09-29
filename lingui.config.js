import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";

export default defineConfig({
	sourceLocale: "en",
	locales: ["es", "en"],
	// Line numbers in the .po headers change on every code edit, which would
	// make `lingui check sync` fail for unrelated changes.
	format: formatter({ lineNumbers: false }),
	catalogs: [
		{
			path: "<rootDir>/src/locales/{locale}/messages",
			include: ["src"],
			// Test fixtures reuse real message ids; keep them out of the extracted catalogs
			exclude: ["**/__tests__/**", "**/*.stories.*"],
		},
	],
});
