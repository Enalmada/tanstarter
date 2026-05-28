#!/usr/bin/env bash
# TSS-2 mechanical check — fails if any createServerFn file has a
# top-level server-only import. This is the load-bearing rule
# preventing postgres-driver / Drizzle leaks into the client bundle.
#
# See .claude/skills/tanstack-start/SKILL.md for the full rule list.
#
# Portability notes (gell-v2 PR #190 R2):
# - All character classes use POSIX `[[:space:]]` etc., NOT `\s`/`\d`/`\w`.
#   BSD grep (macOS default `/usr/bin/grep`) treats `\s` as the literal
#   character "s" and silently misses `createServerFn (` with a space.
# - The script avoids `echo -e` (which `dash` prints literally) — use
#   `printf "%b\n"` when expanding backslash escapes.

set -e

# Dependency check — the multi-line + PCRE-lookahead pattern below needs
# ripgrep (POSIX grep -P is GNU-only AND can't match across lines).
if ! command -v rg >/dev/null 2>&1; then
	echo "❌ scripts/check-tss-2.sh requires ripgrep (rg)."
	echo "   Install: https://github.com/BurntSushi/ripgrep#installation"
	echo "   macOS:   brew install ripgrep"
	echo "   Ubuntu:  apt-get install ripgrep   (preinstalled on GH Actions ubuntu-latest)"
	echo "   Windows: scoop install ripgrep  /  winget install BurntSushi.ripgrep.MSVC"
	exit 2
fi

# Pre-filter to files containing createServerFn(, excluding tests and .db.ts.
# `[[:space:]]*` (not `\s*`) so this works under BSD grep too.
files=$(grep -rl 'createServerFn[[:space:]]*(' src/ 2>/dev/null \
	| grep -v '__tests__' \
	| grep -v '\.test\.' \
	| grep -v '\.db\.ts$' \
	| grep -v 'CLAUDE\.md$' \
	|| true)

if [ -z "$files" ]; then
	echo "No createServerFn files found in src/ — TSS-2 check trivially passes."
	exit 0
fi

# The TSS-2 pattern, designed to be hard to bypass.
#
# Matches every top-level import form under both quote styles:
#   `import "path"`             (side-effect)
#   `import x from "path"`      (default)
#   `import { … } from "path"`  (named — may span multiple lines)
#   `import * as x from "path"` (namespace)
#   `import x, { … } from "…"`  (mixed)
#
# Carve-outs are encoded as PCRE NEGATIVE LOOKAHEADS, not post-filter pipes.
# The earlier `grep -vE '^[0-9]+:[[:space:]]*import[[:space:]]+type'` pipe
# broke under multi-line imports — `rg --multiline` matches the whole
# `import { ... } from "..."` block as one logical hit but emits each line
# as a separate output line, and the `type` keyword on line 1 was stripped
# before the path-matched line was emitted (gell-v2 PR #190 R1).
#
# - `(?![[:space:]]+type[[:space:]])` immediately after `^import`:
#     drops `import type { ... } from "..."` regardless of multi-line shape.
# - `(?!/schema/[^"\047]*-schemas["\047])` inside the `~/server/db` branch:
#     drops the Drizzle-free `*-schemas.ts` valibot siblings.
#
# `~/server/access/http-errors` is excluded by construction — the regex
# only matches `check|ability|middleware` under `~/server/access/`.
PATTERN='^import(?![[:space:]]+type[[:space:]])([[:space:]]+[^"\047]*)?["\047](~/server/db(?!/schema/[^"\047]*-schemas["\047])(/[^"\047]*)?|~/server/access/(check|ability|middleware)|~/server/services(/[^"\047]*)?|~/server/auth(/[^"\047]*)?|~/server/lib(/[^"\047]*)?|~/functions/[^"\047/]+/[^"\047]*\.db|~/utils/logger|@tanstack/react-start/server|drizzle-orm)["\047]'

hits=0
for f in $files; do
	matches=$(rg --multiline --multiline-dotall -nP "$PATTERN" "$f" 2>/dev/null || true)
	if [ -n "$matches" ]; then
		hits=$((hits + 1))
		echo "  TSS-2 HIT: $f"
		echo "$matches" | sed 's/^/    /'
	fi
done

if [ "$hits" -gt 0 ]; then
	echo ""
	echo "❌ TSS-2 check failed: $hits files with top-level server-only imports."
	echo "   Convert each to a dynamic import inside the handler."
	echo "   See .claude/skills/tanstack-start/SKILL.md for the canonical pattern."
	exit 1
fi

count=$(printf "%s\n" "$files" | wc -l | tr -d ' ')
echo "✅ TSS-2 check passed: 0 hits across $count createServerFn files."
