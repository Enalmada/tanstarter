# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TanStarter is a production-ready starter template for TanStack Start applications using TypeScript.

## Key Technologies

- **TanStack Start** - Full-stack React framework
- **TanStack Router** - Type-safe routing with code generation
- **TanStack Query** - Server state management
- **Drizzle ORM + PostgreSQL** - Type-safe database operations
- **shadcn/ui** - Component library
- **Tailwind CSS v4** - CSS-first configuration (no config file)
- **Biome** - Linting and formatting

## Essential Commands

### Development
```bash
bun dev                    # Start dev server (includes Docker)
bun run check-types       # TypeScript type checking
bun run lint              # Biome linting with auto-fix
bun run test:unit         # Unit tests
bun run knip              # Unused files/exports/dependencies
bun run test:e2e          # Playwright (seeded users; see src/e2e/TESTING_BEST_PRACTICES.md)
```

### Database
```bash
bun run drizzle:generate  # Generate migrations after schema changes
bun run docker:up         # Start Docker containers
bun run drizzle:seed      # Seed the Playwright e2e users (dev DB only)
```

## Quality Requirements

After any code changes, you MUST run:
1. `bun run check-types`
2. `bun run lint`
3. `bun run test:unit`
4. `bun run knip` (fails on new unused code; don't add to its baseline)
5. `bun run drizzle:generate` (if database schema changed)

Pre-commit hooks (LeftHook) automatically enforce these checks.

## Code Style

- **Tabs for indentation** (not spaces)
- **Double quotes** for strings
- No console.log statements allowed
- Use `drizzle-valibot` for schema validation
- Server-side validation is the final authority

## Important Files

- `src/server/db/schema/` - Database schema (changes trigger migration generation)
- `biome.jsonc` - Linting configuration

## Pull Request Guidelines

- **NO Claude Code signatures** - Do not include "🤖 Generated with [Claude Code]" or similar signatures in PR descriptions, commit messages, or any project documentation