# Data flow

How data gets from the database to a component and back.

## Reads

- Define queries once in the `queries` store (`src/utils/query/queries.ts`). A route lists the ones it needs, preloads them in its loader with `preloadQueries(context.queryClient, ...)`, and reads them in components with `useSuspenseQueries(...)`, which wraps each server function for you:

  ```ts
  function getRouteQueries(taskId: string) {
  	return [queries.task.byId(taskId)] as const;
  }

  // loader: preloadQueries(context.queryClient, getRouteQueries(params.taskId))
  // component: const [task] = useSuspenseQueries(getRouteQueries(taskId))
  ```

- React Query owns caching. The router's `defaultPreloadStaleTime` is 0, so hover-preloads defer to the query cache instead of keeping a second copy.
- The signed-in user is one query (`sessionQueryOptions()` in `src/lib/auth/session.ts`). Components call `useSessionUser()`; loaders under `_authed` read `context.user`. Do not copy the user into loader data or router context.
- Loaders run on the server for the first request and on the client afterwards. They must not import server-only modules directly; call server functions.

## Writes

- Mutations go through the helpers in `src/utils/query/mutations.ts`. They call a server function, invalidate the affected queries, and report the outcome with a toast (Base UI toast, `src/components/ui/toast.tsx`).
- After a change that affects the session user (role, profile), invalidate the session query and then `router.invalidate()` so route guards re-run.

## Forms

- Forms use TanStack Form through `src/components/ui/tanstack-form.tsx` and the field components in `src/components/form/`. Validate with a Valibot schema derived from the Drizzle table (`drizzle-valibot`, for example `createInsertSchema`), and share it between the form and the server function.
- Server-side validation is the final authority. Client validation is a convenience.
- Error text uses `text-destructive-strong` (see [UI](ui.md)).

## Server functions and the data-access layer

- The CRUD operations are one `createServerFn` per file under `src/functions/`, with the handler exported separately for unit tests; follow that for new entity-style functions. The rules (TSS-2, TSS-6, dynamic imports inside handlers, error vocabulary) are in the [tanstack-start skill](../.claude/skills/tanstack-start/SKILL.md), and `bun run check-tss-7` checks part of them mechanically.
- The generic CRUD lives in `src/functions/base-service.ts` (an entity registry) and the per-operation files `create-entity`, `find-first`, `find-many`, `update-entity`, `delete-entity`. Add a new entity to the registry rather than writing another set of handlers. Each operation applies CASL rules (`src/server/access/`): a read filter for reads and a write guard for writes.
- Throw the typed errors from `src/server/access/http-errors.ts`. The global `authErrorTranslator` middleware turns them into an HTTP status and a safe message; never attach `cause` or internal details to what reaches the client.
- Every server function that needs a user has `authMiddleware` or `freshAuthMiddleware` (see [Auth](auth.md)).
