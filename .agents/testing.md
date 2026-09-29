# Testing

Test the behavior that would hurt if it broke, at the cheapest level that can show it. Tests are written after the implementation, and are never weakened just to pass.

| Level | Where | Run | Use for |
|---|---|---|---|
| Unit | `src/**/__tests__/*.test.ts(x)` | `bun run test:unit` | Pure logic, server-function handlers (call the exported handler with `context: { user }`), guards, sanitizers, token or config invariants |
| Storybook | `*.stories.tsx` next to a component | `bun run test-storybook` | Component states and interactions, rendered in a real browser. `bun run check-stories` fails when a component has no story |
| E2E | `src/e2e/{public,member,admin}` | `bun run test:e2e` | Who may and may not open a page, and the main flows end to end |

## Unit tests

- Vitest with happy-dom. The shared setup and global mocks (session responses, env) are in `src/test/setup.ts`. The global `~/env` mock deliberately has no third-party tokens, so a handler test cannot reach an external service.
- Mock at module boundaries. Server-only modules are imported dynamically inside handlers (TSS-2), so tests spy on the module namespace rather than a destructured import; the session-helper rules are in the [tanstack-start skill](../.claude/skills/tanstack-start/SKILL.md).
- Test third-party integrations by stubbing the transport (for example `fetch`), so the real client code runs. `src/utils/__tests__/logger.test.ts` does this for Axiom.
- Guard tests can read source files to enforce a convention (`src/styles/__tests__/theme-contrast.test.ts` bans low-contrast color classes, `auth-wiring.test.ts` requires middleware on server functions). Add a negative case when you write one so it cannot pass vacuously.
- The unit config loads `.env.test` then `.env.test.local`, so the tests run against a test environment, not your development `.env`.

## E2E

- Playwright, with page objects in `src/e2e/pages/` and the conventions in [src/e2e/TESTING_BEST_PRACTICES.md](../src/e2e/TESTING_BEST_PRACTICES.md).
- Projects: `public` (signed out), `member` and `admin` (stored auth state from `src/e2e/auth/*.setup.ts`, seeded users `member@playwright.local` and `admin@playwright.local` from `bun run drizzle:seed`). Put a spec in the folder for the audience it exercises.
- The dev server must run with `PLAYWRIGHT=true`, `NODE_ENV=development` and a seeded database; Playwright's config starts it for you.
- `bun run check:e2e-specs` fails when a spec sits outside every project and would silently never run.
- Wait for hydration before interacting: a click that lands before the page hydrates is lost. Prefer retrying assertions over fixed sleeps.

## Real-browser checks

Static analysis, unit tests and CI e2e can pass while the real bundle is broken. For bundler, SSR, env or dependency changes, follow "Real-browser validation" in [workflow](workflow.md).
