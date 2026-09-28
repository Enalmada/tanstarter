#!/usr/bin/env bash
# Scan git changes for committed secrets with Betterleaks (https://github.com/betterleaks/betterleaks).
# Ported from UseFrank/frank#41.
#
#   bun run scan:secrets              commits on this branch that aren't on origin/main, plus staged changes
#   bun run scan:secrets --staged     staged changes only
#   bun run scan:secrets --pre-commit staged changes, skipped with a warning if betterleaks is missing (lefthook)
#   bun run scan:secrets <from>..<to> a commit range (CI)
#
# False positives: add a `betterleaks:allow` comment on the line, or add the finding's
# fingerprint to a .betterleaksignore file at the repo root (one per line).
set -euo pipefail

if ! command -v betterleaks >/dev/null 2>&1; then
	if [ "${1:-}" = "--pre-commit" ]; then
		echo "⚠️  betterleaks not installed, skipping the secret scan (CI still runs it)." >&2
		echo "   Install: winget install Betterleaks.Betterleaks (Windows) or brew install betterleaks (macOS)" >&2
		exit 0
	fi
	echo "❌ betterleaks is not installed. Install it, then re-run:" >&2
	echo "   Windows: winget install Betterleaks.Betterleaks" >&2
	echo "   macOS:   brew install betterleaks" >&2
	echo "   Linux:   https://github.com/betterleaks/betterleaks/releases" >&2
	exit 2
fi

scan() { betterleaks git --no-banner --redact "$@" .; }

case "${1:-}" in
--staged | --pre-commit)
	scan --pre-commit --staged
	;;
"")
	if ! base=$(git merge-base origin/main HEAD 2>/dev/null); then
		echo "❌ origin/main not found. Run 'git fetch origin main' first." >&2
		exit 1
	fi
	scan --log-opts="$base..HEAD"
	scan --pre-commit --staged
	;;
*)
	# Fail on an unknown ref rather than passing a range Betterleaks can't resolve.
	# An empty but valid range (nothing new to scan) is fine.
	if ! git rev-list --count "$1" >/dev/null 2>&1; then
		echo "❌ Not a valid commit range: $1" >&2
		exit 1
	fi
	scan --log-opts="$1"
	;;
esac
