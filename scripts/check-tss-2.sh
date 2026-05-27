#!/usr/bin/env bash
# TSS-2 mechanical check — fails if any createServerFn file has a
# top-level server-only import. This is the load-bearing rule
# preventing postgres-driver / Drizzle leaks into the client bundle.
#
# See .claude/skills/tanstack-start/SKILL.md for the full rule list.

set -e

# Pre-filter to files containing createServerFn(, excluding tests and .db.ts
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

# The TSS-2 pattern, designed to be hard to bypass:
#
# - Matches every top-level import form:
#     `import "path"`             (side-effect)
#     `import x from "path"`      (default)
#     `import { … } from "path"`  (named)
#     `import * as x from "path"` (namespace)
#     `import x, { … } from "…"`  (mixed)
# - Supports both single and double quotes.
# - The path pattern matches the exact server-only module OR any subpath,
#   without depending on the trailing quote (the earlier `([^"]|$)` trick
#   silently missed direct imports of `~/server/db` itself).
#
# EXCLUDES the documented carve-outs via the second grep -v stage:
# - `import type { … }` lines (type-only — compile away)
# - `~/server/db/schema/*-schemas.ts` (Drizzle-free valibot siblings)
#
# `~/server/access/http-errors` is excluded by construction (the regex
# only matches `check|ability|middleware` under `~/server/access/`).
hits=0
for f in $files; do
	matches=$(grep -nE \
		"^import([[:space:]]+[^'\"]*)?['\"](~/server/db(/[^'\"]*)?|~/server/access/(check|ability|middleware)|~/server/services(/[^'\"]*)?|~/server/auth(/[^'\"]*)?|~/server/lib(/[^'\"]*)?|~/functions/[^'\"/]+/[^'\"]*\\.db|~/utils/logger|@tanstack/react-start/server|drizzle-orm)['\"]" \
		"$f" 2>/dev/null \
		| grep -vE '^[0-9]+:[[:space:]]*import[[:space:]]+type' \
		| grep -vE '~/server/db/schema/[A-Za-z-]+-schemas' \
		|| true)
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

count=$(echo "$files" | wc -l | tr -d ' ')
echo "✅ TSS-2 check passed: 0 hits across $count createServerFn files."
