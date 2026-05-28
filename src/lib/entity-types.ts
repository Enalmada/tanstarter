/**
 * Client-safe entity type vocabulary.
 *
 * Lives in `~/lib/` (not `~/server/access/`) so it can be top-level
 * imported from `createServerFn` files without dragging CASL / Drizzle
 * into the client bundle (TSS-2 rule).
 *
 * The CASL ability module (`~/server/access/ability.ts`) re-exports
 * this so existing imports keep working; new code should import the
 * vocabulary from here directly.
 */

/* clone-code ENTITY_HOOK
{
  "addType": "<%= h.changeCase.pascalCase(name) %>"
}
*/
export const ENTITY_TYPES = ["Task", "User"] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
