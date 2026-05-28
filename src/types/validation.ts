import { date, nullish, object, picklist, string } from "valibot";
// Import from `~/lib/` (not `~/server/db/schema`) so this client-consumed module
// doesn't pull Drizzle into the browser bundle (TSS-2).
import { TaskStatus } from "~/lib/enums/task-status";
import { UserRole } from "~/lib/enums/user-role";

// Task validation schema
export const taskFormSchema = object({
	title: string(),
	description: nullish(string()),
	dueDate: nullish(date()),
	status: picklist([TaskStatus.ACTIVE, TaskStatus.COMPLETED]),
	userId: string(),
	version: nullish(string()),
});

// User validation schema
export const userFormSchema = object({
	email: string(),
	name: nullish(string()),
	role: picklist([UserRole.MEMBER, UserRole.ADMIN]),
	version: nullish(string()),
});
