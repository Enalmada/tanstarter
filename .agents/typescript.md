# TypeScript

`bun run check-types` runs `tsc --noEmit` (TypeScript 7) with `strict`, `strictNullChecks` and `exactOptionalPropertyTypes`. Type errors cannot ship.

- Prefer inference. Annotate function boundaries (exported functions, props, server-function inputs and outputs), not every local.
- Avoid casts. If you need one, prefer `satisfies` or a narrowing check first. Reserve `as unknown as X` for test doubles and third-party typing gaps, and comment why.
- Do not use `any`. Use `unknown` and narrow.
- Do not redefine types the schema already gives you: import them from `~/server/db/schema/*` or `~/lib/entity-types`, and use enums (`UserRole.ADMIN`) instead of string literals.
- With `exactOptionalPropertyTypes`, an optional prop does not accept an explicit `undefined`. Spread conditionally (`...(value ? { key: value } : {})`) or type the prop as `T | undefined`. Wrapper components should declare explicit prop interfaces instead of spreading a library's props through.
- Keep types next to where they are used; share only what is genuinely shared.
- Server-only modules start with `import "@tanstack/react-start/server-only";` and are imported dynamically from anything a client route can reach (TSS-2, see the [tanstack-start skill](../.claude/skills/tanstack-start/SKILL.md)).
- Client-safe constants (enums, error hint types) live under `~/lib/` so both sides can import them.
