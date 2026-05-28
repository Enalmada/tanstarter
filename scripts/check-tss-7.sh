#!/usr/bin/env bash
# TSS-7 mechanical check — fails if any createServerFn file bypasses the
# canonical auth helpers in src/server/auth/.
#
# After consolidating to three helpers (getSessionRequest,
# getOptionalSessionUser, requireAuthedUser), the regression class is:
# a future PR re-introduces a bare `getRequest()` or a direct
# `auth.api.getSession()` call, bypassing the helpers' Playwright
# shortcut + Set-Cookie forwarding + defensive context handling.
#
# Two patterns flagged:
# 1. BARE_GETREQUEST — `getRequest()` outside `getSessionRequest`.
# 2. DIRECT_AUTH_GETSESSION — `auth.api.getSession(...)` outside the
#    helper module.
#
# Scope:
# - Defaults to ALL createServerFn files under src/.
# - If $CHANGED is set (whitespace-separated paths), only scans those.

set -e

# Determine the file set
if [ -n "${CHANGED:-}" ]; then
	# Diff-mode: intersect with createServerFn files
	all_changed="$CHANGED"
	files=""
	for f in $all_changed; do
		[ -f "$f" ] || continue
		if grep -lE 'createServerFn[[:space:]]*\(' "$f" >/dev/null 2>&1; then
			files="$files $f"
		fi
	done
else
	# Full-scan mode
	files=$(grep -rl 'createServerFn[[:space:]]*(' src/ 2>/dev/null \
		| grep -v '__tests__' \
		| grep -v '\.test\.' \
		| grep -v '\.db\.ts$' \
		| grep -v 'CLAUDE\.md$' \
		|| true)
fi

if [ -z "$files" ]; then
	echo "✅ TSS-7 check passed: no createServerFn files in scope."
	exit 0
fi

# Helper modules + test setup are by design exempt — they ARE the
# canonical helpers, or they configure the global test mock.
is_exempt() {
	case "$1" in
		src/server/auth/request.ts) return 0 ;;
		src/server/auth/session.ts) return 0 ;;
		src/server/auth/auth.ts) return 0 ;;
		src/test/setup.ts) return 0 ;;
		src/utils/test/playwright.ts) return 0 ;;
		# Better Auth route handler — different dispatch path
		src/routes/api/*) return 0 ;;
	esac
	return 1
}

hits=0
for f in $files; do
	if is_exempt "$f"; then
		continue
	fi

	# Strip lines that look like comments (`//`, ` *`, `/*`) — these are
	# typically JSDoc rationale that explicitly mentions the bypassed call
	# while explaining why the helper exists.
	#
	# Bare getRequest() — allow getSessionRequest references via grep -v
	bare=$(grep -nE 'getRequest\(\)' "$f" 2>/dev/null \
		| grep -vE '^[0-9]+:[[:space:]]*(//|\*|/\*)' \
		| grep -v 'getSessionRequest' \
		|| true)
	if [ -n "$bare" ]; then
		hits=$((hits + 1))
		echo "  BARE_GETREQUEST: $f"
		printf '%s\n' "$bare" | sed 's/^/    /'
	fi

	# Direct auth.api.getSession( call
	direct=$(grep -nE 'auth\.api\.getSession\(' "$f" 2>/dev/null \
		| grep -vE '^[0-9]+:[[:space:]]*(//|\*|/\*)' \
		|| true)
	if [ -n "$direct" ]; then
		hits=$((hits + 1))
		echo "  DIRECT_AUTH_GETSESSION: $f"
		printf '%s\n' "$direct" | sed 's/^/    /'
	fi
done

if [ "$hits" -gt 0 ]; then
	echo ""
	echo "❌ TSS-7 check failed: $hits bypassed-helper hits."
	echo "   Route session loading through src/server/auth/session.ts —"
	echo "   getOptionalSessionUser / requireAuthedUser — instead of calling"
	echo "   getRequest() or auth.api.getSession() directly. See"
	echo "   .claude/skills/tanstack-start/SKILL.md \"Auth helpers — single"
	echo "   source of truth (REQUIRED)\"."
	exit 1
fi

count=$(printf '%s\n' "$files" | wc -l | tr -d ' ')
echo "✅ TSS-7 check passed: 0 bypassed-helper hits across $count createServerFn files."
