import { defineConfig } from "@lingui/cli";

export default defineConfig({
	sourceLocale: "en",
	locales: ["es", "en"],
	catalogs: [
		{
			path: "<rootDir>/src/locales/{locale}/messages",
			include: ["app"],
		},
	],
});
