/**
 * Client-safe TaskStatus enum.
 *
 * Lives in `~/lib/` so client components can import it without dragging
 * Drizzle into the browser bundle via the `~/server/db/schema` barrel
 * (TSS-2 rule). The schema file (`task.schema.ts`) imports and
 * re-exports these.
 */

export enum TaskStatus {
	ACTIVE = "ACTIVE",
	COMPLETED = "COMPLETED",
}

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];
