/**
 * Fails when a relative link in a tracked Markdown file points at a path that
 * doesn't exist. Docs are read by agents that follow links literally, and moving
 * a file silently strands every link to it.
 *
 * A link resolves relative to its own file, as it does when rendered. Inline
 * links, reference definitions and <angle-bracket> destinations are checked;
 * external URLs and #anchors are skipped, and code is ignored.
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

const INLINE = /\]\(\s*(?:<([^>\n]*)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
const DEFINITION = /^ {0,3}\[[^\]\n]+\]:\s*(?:<([^>\n]*)>|(\S+))/gm;
const EXTERNAL = /^([a-z][a-z0-9+.-]*:|#|\/\/)/i;

/** Blank out fenced blocks (any indent, any marker length) and inline code spans of any length. */
function stripCode(markdown: string): string {
	return markdown
		.replace(/^ *(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ *\1[`~]*[ \t]*$/gm, "")
		.replace(/(`+)(?!`)[\s\S]*?[^`]\1(?!`)/g, "");
}

const problems: string[] = [];

for (const file of tracked.stdout.split("\0").filter(Boolean)) {
	if (!existsSync(file)) continue; // deleted in the working tree
	const text = stripCode(readFileSync(file, "utf8"));
	const targets = [...text.matchAll(INLINE), ...text.matchAll(DEFINITION)].map((m) => m[1] ?? m[2]);
	for (const target of targets) {
		if (!target || EXTERNAL.test(target)) continue;
		let path = target.split(/[#?]/)[0] ?? "";
		try {
			path = decodeURIComponent(path);
		} catch {
			// keep the raw path; it is reported below if it does not exist
		}
		if (path && !existsSync(resolve(dirname(file), path))) problems.push(`${file}: ${target}`);
	}
}

if (problems.length > 0) {
	process.stderr.write(`Broken relative links:\n${problems.map((p) => `  ${p}`).join("\n")}\n`);
	process.exit(1);
}
process.stdout.write("Doc links OK\n");
