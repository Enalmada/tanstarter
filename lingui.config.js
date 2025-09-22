import { defineConfig } from "@lingui/cli";

export default defineConfig({
	sourceLocale: "en",
	locales: ["es", "en"],
	format: "po",
	catalogs: [
		{
			path: "<rootDir>/src/locales/{locale}/messages",
			include: ["app"],
		},
	],
	compileNamespace: "ts",
	extractors: ["@lingui/cli/extractors/typescript"],
});
