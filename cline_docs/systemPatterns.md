# System Architecture

## Key Technical Decisions
1. File-system routing with TanStack Router
2. Hybrid SSR/CSR rendering
3. Server functions over traditional REST
4. Drizzle ORM schema-first design

## Implementation Patterns
- Session-based auth with Drizzle ORM
- Route-level error boundaries
- Type-safe server/client communication
- Optimistic UI updates
- Data layer: Drizzle + TanStack Server Functions
- Monorepo structure with Turbo