#!/usr/bin/env bash
# Checks the cache headers of a running production build (bun run .output/server/index.mjs).
# Usage: scripts/check-asset-headers.sh [base-url]   (default http://localhost:3000)
#
# Every check works on a captured string, never on a pipeline that one side closes early. With
# `pipefail`, `... | head -1 | grep -q` or `... | grep -q` can report failure on a healthy response
# when the reader exits before the writer finishes (SIGPIPE), which failed CI at random; the same
# race turned a matching `grep -q immutable` into a false pass.
set -uo pipefail

BASE="${1:-http://localhost:3000}"
fail=0

headers() { # <path> -> response headers, CR removed
	curl -s -D - -o /dev/null "$BASE$1" | tr -d '\r'
}

header_value() { # <headers> -> cache-control value (lowercased), empty when absent
	awk -F': ' 'tolower($1)=="cache-control"{print tolower($2)}' <<<"$1"
}

expect() { # <path> <regex> <description>
	local all first value
	all="$(headers "$1")"
	first="${all%%$'\n'*}"
	# A 404 or fallback response must not pass just because it carries the header
	if [[ "$first" != *' 200'* ]]; then
		echo "✗ $1: not a 200 response"
		fail=1
		return
	fi
	value="$(header_value "$all")"
	if [[ "$value" =~ $2 ]]; then
		echo "✓ $1: $value"
	else
		echo "✗ $1: got '${value:-<none>}', expected $3"
		fail=1
	fi
}

home="$(curl -s "$BASE/")"
asset="$(grep -aEo '/assets/[^"]+\.js' <<<"$home" | head -n 1)"
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
	value="$(header_value "$(headers "$path")")"
	if [[ "$value" == *immutable* ]]; then
		echo "✗ $path is marked immutable"
		fail=1
	else
		echo "✓ $path is not immutable"
	fi
done

exit $fail
