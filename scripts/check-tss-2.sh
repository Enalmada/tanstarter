#!/usr/bin/env bash
# TSS-2 mechanical check — fails if any createServerFn file has a
# top-level server-only import. This is the load-bearing rule
# preventing postgres-driver / Drizzle leaks into the client bundle.
#
# See .claude/skills/tanstack-start/SKILL.md for the full rule list.

set -e

# Pre-filter to files containing createServerFn(, excluding tests and .db.ts
files=$(grep -rl 'createServerFn\s*(' src/ 2>/dev/null \
	| grep -v '__tests__' \
	| grep -v '\.test\.' \
	| grep -v '\.db\.ts$' \
	| grep -v 'CLAUDE\.md$' \
	|| true)

if [ -z "$files" ]; then
	echo "No createServerFn files found in src/ — TSS-2 check trivially passes."
	exit 0
fi

# The TSS-2 pattern. Matches top-level imports from server-only paths but
# EXCLUDES the documented carve-outs:
# - ~/server/access/http-errors (client-safe by construction)
# - ~/server/db/schema/*-schemas.ts (Drizzle-free valibot siblings)
#
# Also excludes `import type { … }` lines — type-only imports compile away.
hits=0
hit_files=""
for f in $files; do
	matches=$(grep -nE \
		'^import[[:space:]]+\{[^}]+\}[[:space:]]+from[[:space:]]+"(~/server/db([^"]|$)|~/server/access/(check|ability|middleware)|~/server/services|~/server/auth|~/server/lib|~/functions/[^"/]+/[^"]*\.db|~/utils/logger|@tanstack/react-start/server|drizzle-orm)' \
		"$f" 2>/dev/null \
		| grep -v '^[^:]*:[0-9]*:[[:space:]]*import[[:space:]]\+type' \
		| grep -v '~/server/db/schema/[A-Za-z-]*-schemas' \
		|| true)
	if [ -n "$matches" ]; then
		hits=$((hits + 1))
		hit_files+="\n  $f"
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
