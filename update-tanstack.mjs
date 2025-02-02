#!/usr/bin/env node

import { execSync } from "node:child_process";
async function updateTanstack() {
	try {
		// Remove patches directory
		try {
			await fs.rm("patches", { recursive: true, force: true });
			console.info("✓ Removed patches directory");
		} catch (e) {
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
		console.info("✓ Removed patchedDependencies from package.json");

		// Run initial patch command
		execSync("bun patch @tanstack/start-config", { stdio: "inherit" });
		console.info("✓ Created initial patch");

		// Modify the config file
		const configPath = "node_modules/@tanstack/start-config/dist/index.js";
		let configContent = await fs.readFile(configPath, "utf8");
		configContent = configContent.replace(
			/(.*viteReact\(opts\.react\),.*)/,
			"//$1",
		);
		await fs.writeFile(configPath, configContent);
		console.info("✓ Modified config file");

		// Commit the patch
		execSync("bun patch --commit @tanstack/start-config", { stdio: "inherit" });
		console.info("✓ Committed patch");

		console.info("\n✨ TanStack patch update completed successfully!");
	} catch (error) {
		console.error("\n❌ Error:", error.message);
		process.exit(1);
	}
}

updateTanstack();
