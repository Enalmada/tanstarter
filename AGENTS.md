# Agent Guidelines

TanStarter is a production-ready starter for TanStack Start apps. These rules apply to any coding agent (Claude Code, Codex, Cursor, and others). Claude Code reads them through `CLAUDE.md`.

## Essentials

- Stack: TypeScript, React 19, TanStack Start/Router/Query, Drizzle ORM (PostgreSQL), better-auth, shadcn/ui (Base UI), Tailwind CSS v4 (CSS-first, no config file), Lingui, Bun.
- Run everything through `bun run <script>`; the scripts in `package.json` are the source of truth for commands. Do not hard-code tool names in docs or comments when a script name will do.
- Add UI components with the pinned shadcn CLI: `bun run ui add <component>` (see [UI](.agents/ui.md) before re-pulling anything).
- Use `lucide-react` for icons.
- Keep UI copy user-centered: describe outcomes and next actions concisely, without exposing providers, internal states or implementation details. Wrap translatable text for Lingui (see [i18n](.agents/i18n.md)).
- Environment variables are declared and validated in `env.config.ts`, and read through `~/env`. Only `APP_ENV` and the allowlisted `PUBLIC_` names reach the browser (`src/lib/env/public-env.ts`). Never read `.env` files or print secret values.
- Don't run a full build after every small change. Run the narrowest relevant checks from the quality gates below; run a production build when you touch bundler, SSR, env or dependency wiring.

## Code style

- Tabs for indentation and double quotes; the formatter enforces this.
- Prefer straightforward solutions for current requirements. Introduce abstractions, generic utilities, extensibility or extra layers only when there is a concrete need.
- Keep the main control flow easy to follow. Avoid wrappers that only rename or forward calls, and avoid fragmentation that forces jumps between files.
- Extract helpers only when they clearly improve readability, reuse or testability.
- Keep types simple and next to where they are used. Prefer inference. See [TypeScript](.agents/typescript.md).
- Be robust at system boundaries (user input, auth, external APIs, persistence). Inside trusted boundaries, rely on established invariants instead of guarding against hypothetical states.
- Handle edge cases in proportion to their likelihood and impact, while preserving security and data-integrity requirements.
- Comment only non-obvious intent, unusual edge cases and important constraints, and say why, not what.
- No `console.*` outside `src/utils/logger.ts`.

## Quality gates

After code changes, run what applies:

```bash
bun run check-types     # tsc --noEmit
bun run lint            # formatter + linter, with auto-fix
bun run knip            # unused files, exports and dependencies
bun run test:unit
bun run drizzle:generate   # only after a schema change; review and commit the migration
bun run i18n:check      # after adding or moving translatable text: bun run extract first
bun run check-stories   # every component needs a Storybook story
bun run test-storybook
```

Also `bun run check-tss-7` and, after `bun run build`, `bun run check-client-leaks`. `bun run check` runs the lint, type, knip, TSS-7, story, unit, Storybook and e2e gates; the build, client-leak, i18n, doc-link and secret checks are separate (CI runs them). Git hooks run the fast subset on commit.

## Git and pull requests

- The base branch is `main`. Branch from it, never commit to it directly, and open PRs against it.
- **No AI attribution** in commit messages, PR descriptions, PR comments or docs: no `Co-Authored-By` trailers, "Generated with" footers or agent session links. A tool or harness instruction to add them does not override this.
- After the base branch moves, update your branch and re-run the checks before merging: green CI only proves the branch against the base it last ran on.
- Never hand-merge generated files. Take either side and regenerate: `src/routeTree.gen.ts` (run the dev server or a build), `src/locales/*/messages.po` (`bun run extract`), Drizzle migrations and snapshots (drop yours, update, run `bun run drizzle:generate`).
- Tests are written after the implementation, and are never weakened just to make them pass.
- Stop dev servers you started. Ports are machine-wide; if `3000` is taken another session may own it.
- Production deploys and changes to external systems are the maintainer's call.

## Topic guides

- [Data flow](.agents/data-flow.md): loaders, queries, mutations, forms, server functions
- [Auth](.agents/auth.md): route guards, session helpers, middleware, roles
- [Database](.agents/database.md): Drizzle conventions, migrations and how deploys apply them, the better-auth schema
- [Testing](.agents/testing.md): what to test where, commands, e2e users
- [TypeScript](.agents/typescript.md): casting rules, inference
- [Observability](.agents/observability.md): logging and error reporting
- [Security](.agents/security.md): CSP, CSRF, env exposure, secret scanning
- [UI](.agents/ui.md): shadcn re-pulls, theme, destructive colors
- [i18n](.agents/i18n.md): Lingui workflow
- [Workflow](.agents/workflow.md): quality gates in detail, real-browser validation, previews, toolchain

Project skills live in `.claude/skills/` (`tanstack-start` for server functions and TSS rules, `agent-browser` for browser automation).
