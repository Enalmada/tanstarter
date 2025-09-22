#!/usr/bin/env node

import { execSync } from "node:child_process";

async function updateTanstack() {
	try {
		// Remove patches directory
		try {
			await fs.rm("patches", { recursive: true, force: true });
		} catch (_e) {
			// Ignore if directory doesn't exist
		}

		// Update package.json
		const packagePath = path.join(process.cwd(), "package.json");
		const packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"));
		packageJson.patchedDependencies = undefined;
		await fs.writeFile(
			packagePath,
			`${JSON.stringify(packageJson, null, 2)}\n`,
		);

		// Run initial patch command
		execSync("bun patch @tanstack/react-start-config", { stdio: "inherit" });

		// Modify the config file
		const configPath =
			"node_modules/@tanstack/react-start-config/dist/index.js";
		let configContent = await fs.readFile(configPath, "utf8");
		configContent = configContent.replace(
			/(.*viteReact\(opts\.react\),.*)/,
			"//$1",
		);
		await fs.writeFile(configPath, configContent);

		// Commit the patch
		execSync("bun patch --commit @tanstack/react-start-config", {
			stdio: "inherit",
		});
	} catch (_error) {
		process.exit(1);
	}
}

updateTanstack();
