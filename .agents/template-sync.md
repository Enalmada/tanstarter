# Template sync

TanStarter sits in the middle of a chain: it borrows ideas from an upstream template, and products started from it pull changes back down. None of these repos share git history, so every change is a port by intent, not a merge. Provenance lives in [template-sync.jsonc](template-sync.jsonc).

```
mugnavo/cove  -->  tanstarter (this repo)  -->  products (e.g. frank)
```

## Reviewing an upstream template (mugnavo/cove)

1. **Fix the target.** Verify the remote URL against `source` in `template-sync.jsonc`. Do not trust a remote's name. Fetch, then resolve the ref to a full commit SHA straight away. Note the date.
2. **List the range.** Start from the last `reviewedThrough` and run `git log --oneline <reviewedThrough>..<target>` in a Cove clone. Read each commit's intent and diff, including renames and deletions. Dependency bumps alone are not a sync.
3. **Classify each change** against this repo's code, not Cove's wording:
   - *Adopt*: it fixes a problem tanstarter also has. Port it with tanstarter's conventions (envin, Biome, `~/` imports, the logger, PostHog). Confirm the claim against the installed package source in `node_modules` before you rely on it.
   - *Skip*: a tool or style choice tanstarter has made differently (varlock, Vite+, evlog, `#/` aliases, toolchain).
   - *Defer*: worth having but optional. Record it so the next review can pick it up.
4. **Implement adopted items** on a branch from `main`, one logical commit each, with tests written after the code. Run the [quality gates](../AGENTS.md#quality-gates).
5. **Record the review** in `template-sync.jsonc`: add an entry under `reviews` with the dispositions, and move `reviewedThrough` to the target.
6. **Advance `reconciledRevision` last.** Set it to the full target SHA only when every upstream change in the range is adopted, skipped or deferred on purpose, and the adopted ones are merged and validated. A reviewed target is not proof of integration, so leave it alone for a comparison-only pass or a partial one.

## How products sync from tanstarter

Products started from tanstarter (frank, for example) pull from it the same way, one level down:

- The product keeps its own sync record (frank: `.plan/plans/tanstarter-sync-<yyyy-mm>/README.md`). It names the tanstarter PR range and the `main` SHA it targets, records owner decisions, lists what the product does better and must keep, and tracks one product PR per group of tanstarter PRs, with any deviations.
- Changes land in tanstarter first, as small PRs with their reasoning in the description. The product then ports them by intent under its own rules: its base branch, its review gates, its checks.
- A change found in a product that belongs in the template goes back up as a tanstarter PR, so the next product sync brings it to everyone.
- The product records a tanstarter SHA as reconciled only after every tanstarter PR up to that SHA is ported, skipped by an owner decision or explicitly deferred.
