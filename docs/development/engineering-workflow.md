# Engineering Workflow

Notes on the day-to-day workflow for landing changes safely in this codebase.

## Quality gates (run before pushing)

```bash
bun run check-types    # tsc --noEmit
bun run lint           # biome check --fix
bun run check-tss-2    # bundle-leak check (createServerFn files only)
bun run test:unit      # vitest
```

`bun run check` runs the whole turbo pipeline including storybook and e2e.

## Real-browser validation for bundling-shaped PRs

When a PR touches any of the following, run real-browser validation **before** merging:

- [vite.config.ts](vite.config.ts) or any other bundler config
- The dynamic-import / shim layer
- Anything chunk-graph-shaped (manual chunks, side-effect annotations, externals)
- SSR boundaries
- Env-validation ([env.config.ts](env.config.ts), [src/env.ts](src/env.ts))
- The TSS-2 carve-outs (`~/lib/`, `~/server/access/http-errors`, `~/server/db/schema/*-schemas.ts`)
- Major framework upgrades (TanStack Start, Vite, Nitro)

Static analysis + unit tests + CI E2E all pass against shapes that can still crash in the real browser bundle. The right validation surface is a **preview deploy** (Fly review app), not a local `bun run start` — `.env.test.local` is intentionally missing prod vars.

Drive the preview URL with a real browser, watch the console, scan the rendered DOM. Hypotheses worth verifying:

- `typeof Buffer === "undefined"` while the UI renders cleanly (validates the dynamic-import layer is the only bundle-leak defense, not a `vite.config.ts` `Buffer` shim).
- No `Failed to resolve import` or `Cannot read properties of undefined` in the browser console.
- SSR hydration matches the client render for the changed routes.
- Env validation passes during client hydration of pages that touch the modified config.
- No `postgres-js` / `drizzle:entityKind` strings in the eager client chunks: `grep -lE 'postgres-js|drizzle:entityKind' .output/public/assets/main-*.js` returns nothing.

For the Fly review-app workflow, see [.github/workflows/fly-review.yml](.github/workflows/fly-review.yml).

## Server function patterns

For createServerFn structure, the HTTP error vocabulary, and the TSS rule set, see the [tanstack-start skill](.claude/skills/tanstack-start/SKILL.md).
