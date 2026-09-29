/**
 * Fails when a relative link in a tracked Markdown file points at a path that
 * doesn't exist. Docs are read by agents that follow links literally, and moving
 * a file silently strands every link to it.
 *
 * A link resolves relative to its file, or relative to the repository root (the
 * skills write `src/...` that way). External URLs and #anchors are skipped, and
 * fenced or inline code is ignored.
 *
 * Run: bun run check:doc-links
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const tracked = spawnSync("git", ["ls-files", "-z", "--", "*.md"], { encoding: "utf8" });
if (tracked.status !== 0) {
	process.stderr.write("git ls-files failed\n");
	process.exit(1);
}

const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const problems: string[] = [];

for (const file of tracked.stdout.split("\0").filter(Boolean)) {
	if (!existsSync(file)) continue; // deleted in the working tree
	const text = readFileSync(file, "utf8")
		.replace(/^(```|~~~)[\s\S]*?^\1/gm, "")
		.replace(/`[^`\n]*`/g, "");
	for (const match of text.matchAll(LINK)) {
		const target = match[1];
		if (!target || /^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) continue;
		const path = decodeURIComponent(target.split(/[#?]/)[0] ?? "");
		if (!path) continue;
		if (!existsSync(resolve(dirname(file), path)) && !existsSync(resolve(path))) problems.push(`${file}: ${target}`);
	}
}

if (problems.length > 0) {
	process.stderr.write(`Broken relative links:\n${problems.map((p) => `  ${p}`).join("\n")}\n`);
	process.exit(1);
}
process.stdout.write("Doc links OK\n");
