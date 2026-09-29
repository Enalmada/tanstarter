/**
 * Fails when an e2e spec under src/e2e isn't picked up by any Playwright
 * project. A spec outside every project's testDir/testMatch is silently
 * never run (src/e2e/authenticated/ sat orphaned that way), so compare the
 * files on disk with what `playwright test --list` would actually run.
 *
 * Run: bun run check:e2e-specs (no dev server needed)
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

const E2E_DIR = "src/e2e";

type Suite = { file: string; suites?: Suite[] };

const list = spawnSync("bunx", ["playwright", "test", "--list", "--reporter=json"], {
	encoding: "utf8",
	stdio: ["ignore", "pipe", "inherit"],
	shell: process.platform === "win32",
	maxBuffer: 64 * 1024 * 1024,
});
if (list.status !== 0) {
	process.stderr.write("playwright test --list failed\n");
	process.exit(1);
}

const report = JSON.parse(list.stdout) as { suites: Suite[] };
const listed = new Set(report.suites.map((suite) => suite.file.replaceAll("\\", "/")));

// Every extension Playwright accepts for test files
const onDisk = readdirSync(E2E_DIR, { recursive: true, encoding: "utf8" })
	.map((file) => file.replaceAll("\\", "/"))
	.filter((file) => /\.(test|spec|setup)\.[cm]?[jt]sx?$/.test(file));
const orphaned = onDisk.filter((file) => !listed.has(file)).sort();

if (orphaned.length > 0) {
	process.stderr.write(
		`These specs match no Playwright project, so they never run:\n${orphaned.map((file) => `  ${E2E_DIR}/${file}`).join("\n")}\nMove them under a project's testDir (member/, admin/, public/) or delete them.\n`,
	);
	process.exit(1);
}
process.stdout.write(`All ${onDisk.length} e2e spec files run in a Playwright project.\n`);
