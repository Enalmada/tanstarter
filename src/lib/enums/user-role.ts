/**
 * Client-safe UserRole enum.
 *
 * Lives in `~/lib/` so client components can import it without dragging
 * Drizzle (`pgTable`, `drizzle-valibot`, …) into the browser bundle via
 * the `~/server/db/schema` barrel (TSS-2 rule). The schema file
 * (`auth.schema.ts`) imports and re-exports these, so existing server
 * code that imports `UserRole` from `~/server/db/schema` keeps working.
 */

export enum UserRole {
	MEMBER = "MEMBER",
	ADMIN = "ADMIN",
}

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
