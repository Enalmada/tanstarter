# Workflow

How changes land safely in this codebase.

## Toolchain

The tools behind the scripts, in one place so a tool swap edits one section:

- Formatter and linter: Biome (`bun run lint`, config in `biome.jsonc`).
- Git hooks: lefthook (`lefthook.yml`): Biome, secret scan, type check, story coverage and migration check on commit.
- Task runner: turbo (`bun run check`).
- Tests: Vitest (unit), Storybook test runner, Playwright (e2e).

Everything else in these docs refers to `bun run <script>`.

## Quality gates (run before pushing)

```bash
bun run check-types    # tsc --noEmit (TypeScript 7)
bun run lint           # formatter + linter, with auto-fix
bun run test:unit      # vitest
bun run knip           # unused files, exports, dependencies (knip.jsonc)
bun run scan:secrets   # Betterleaks over this branch's commits (needs betterleaks installed)
bun run build          # production vite build (CI: .github/workflows/build.yml)
bun run check-client-leaks  # no server-only code in the client bundle (run after build)
```

`bun run check` runs the lint, type, knip, TSS-7, story, unit, Storybook and e2e gates. The build, client-leak, i18n, doc-link and secret checks are separate (CI runs them).

## Real-browser validation for bundling-shaped PRs

When a PR touches any of the following, run real-browser validation **before** merging:

- [vite.config.ts](../vite.config.ts) or any other bundler config
- The dynamic-import / shim layer
- Anything chunk-graph-shaped (manual chunks, side-effect annotations, externals)
- SSR boundaries
- Env-validation ([env.config.ts](../env.config.ts), [src/env.ts](../src/env.ts))
- The TSS-2 carve-outs (`~/lib/` and `~/server/access/http-errors`)
- Major framework upgrades (TanStack Start, Vite, Nitro)

Static analysis + unit tests + CI E2E all pass against shapes that can still crash in the real browser bundle. The right validation surface is a **preview deploy** (Fly review app), not a local `bun run start` — `.env.test.local` is intentionally missing prod vars.

Drive the preview URL with a real browser, watch the console, scan the rendered DOM. Hypotheses worth verifying:

- `typeof Buffer === "undefined"` while the UI renders cleanly (validates the dynamic-import layer and the server-only markers (with `bun run check-client-leaks`) are the bundle-leak defense, not a `vite.config.ts` `Buffer` shim).
- No `Failed to resolve import` or `Cannot read properties of undefined` in the browser console.
- SSR hydration matches the client render for the changed routes.
- Env validation passes during client hydration of pages that touch the modified config.
- No `postgres-js` / `drizzle:entityKind` strings in the eager client chunks: `bun run check-client-leaks` after a build finds no driver, ORM or server-SDK markers in `.output/public`.

### Preview deploys are opt-in (`preview` label)

Preview environments (a `pr-<n>-tanstarter` Fly app plus a `pr-<n>` Neon branch) are **only created when the PR has the `preview` label**. Adding the label deploys; later pushes redeploy while the label stays. Closing the PR tears the environment down, label or not. Removing the label does not tear it down early. This keeps stacked-PR restacks from redeploying every layer and exhausting Neon's branch limit.

Two limits:

- Previews are for same-repository branches only. Fork PRs get no Fly or Neon secrets, so the workflow skips them.
- GitHub starts no workflow for events caused by `GITHUB_TOKEN`. A PR closed (or labeled) by automation using that token doesn't tear down (or deploy); delete the `pr-<n>-tanstarter` Fly app and `pr-<n>` Neon branch by hand, or have the automation use an App token.

For the Fly review-app workflow, see [.github/workflows/fly-review.yml](../.github/workflows/fly-review.yml).

## Adding a page

1. Pick the folder by audience (see "Routes and guards" in the [tanstack-start skill](../.claude/skills/tanstack-start/SKILL.md)): `src/routes/` for public pages, `_guest/` for sign-in style pages, `_authed/` for signed-in users, `_authed/_admin/` for admins. The layout's guard does the access check.
2. Read the user with `useSessionUser()` in components, or `context.user` in a loader under `_authed`.
3. Commit the regenerated `src/routeTree.gen.ts` (the dev server or `bun run build` rewrites it).
4. If the page has translatable text (or you moved a file that does), run `bun run extract` and commit the catalogs: `bun run i18n:check` (CI) fails on stale source references.
5. Add an e2e spec under `src/e2e/member`, `admin` or `public` for who may and may not open it.

## Server function patterns

For createServerFn structure, the HTTP error vocabulary, and the TSS rule set, see the [tanstack-start skill](../.claude/skills/tanstack-start/SKILL.md).
