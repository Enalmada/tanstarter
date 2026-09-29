#!/usr/bin/env bash
# Checks the cache headers of a running production build (bun run .output/server/index.mjs).
# Usage: scripts/check-asset-headers.sh [base-url]   (default http://localhost:3000)
set -uo pipefail

BASE="${1:-http://localhost:3000}"
fail=0

header() { # <path> -> cache-control value (lowercased, CR removed), empty when absent
	curl -s -D - -o /dev/null "$BASE$1" | tr -d '\r' | awk -F': ' 'tolower($1)=="cache-control"{print tolower($2)}'
}

expect() { # <path> <regex> <description>
	local value
	value="$(header "$1")"
	if echo "$value" | grep -Eq "$2"; then
		echo "✓ $1: $value"
	else
		echo "✗ $1: got '${value:-<none>}', expected $3"
		fail=1
	fi
}

asset="$(curl -s "$BASE/" | grep -aEo '/assets/[^"]+\.js' | head -1)"
if [ -z "$asset" ]; then
	echo "✗ no /assets/*.js reference found in $BASE/"
	exit 1
fi

expect "$asset" 'immutable' "immutable"
expect "/sw.js" '^no-cache$' "no-cache"
expect "/manifest.json" '^no-cache$' "no-cache"
expect "/?locale=es" 'no-store' "private, no-store (locale responses)"

# The page and the icon must never be marked immutable
for path in "/" "/favicon.ico"; do
	if header "$path" | grep -q immutable; then
		echo "✗ $path is marked immutable"
		fail=1
	else
		echo "✓ $path is not immutable"
	fi
done

exit $fail
