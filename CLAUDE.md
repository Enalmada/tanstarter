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
```

### Database
```bash
bun run drizzle:generate  # Generate migrations after schema changes
bun run docker:up         # Start Docker containers
```

## Quality Requirements

After any code changes, you MUST run:
1. `bun run check-types`
2. `bun run lint`
3. `bun run test:unit`
4. `bun run drizzle:generate` (if database schema changed)

Pre-commit hooks (LeftHook) automatically enforce these checks.

## Code Style

- **Tabs for indentation** (not spaces)
- **Double quotes** for strings
- No console.log statements allowed
- Use `drizzle-valibot` for schema validation
- Server-side validation is the final authority

## Important Files

- `app/server/db/schema.ts` - Database schema (triggers migration generation)
- `biome.json` - Linting configuration

## Pull Request Guidelines

- **NO Claude Code signatures** - Do not include "🤖 Generated with [Claude Code]" or similar signatures in PR descriptions, commit messages, or any project documentation