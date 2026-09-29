#!/usr/bin/env bash
# Fails if the client bundle (.output/public) contains server-only code.
#
# `@tanstack/react-start/server-only` markers make the build itself fail on a
# static import of a marked module from client code; this checks the output as a
# second line of defense (an unmarked module, or a marker that was removed).
# Run after `bun run build`.
#
# Only code markers are checked: env var names legitimately appear in the
# client env schema, so they are not signals.

set -e

dir="${1:-.output/public}"
if [ ! -d "$dir" ]; then
	echo "❌ $dir not found. Run 'bun run build' first."
	exit 2
fi

# Strings that only exist in the database driver, ORM and server SDKs, plus the
# stub Vite emits when client code reaches a Node built-in (an unmarked server
# module such as an SSE channel that pulls in node:events).
markers='drizzle:entityKind
neonConfig
@neondatabase
drizzle-orm/neon
pg-pool
posthog-node
better-sse
__vite-browser-external'

status=0
while IFS= read -r marker; do
	hits=$(grep -rlF -- "$marker" "$dir" 2>/dev/null || true)
	if [ -n "$hits" ]; then
		echo "❌ server-only marker '$marker' found in the client bundle:"
		echo "$hits" | sed 's/^/     /'
		status=1
	fi
done <<EOF_MARKERS
$markers
EOF_MARKERS

if [ "$status" -eq 0 ]; then
	echo "✓ No server-only markers in the client bundle ($dir)"
fi
exit "$status"
