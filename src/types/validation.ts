import { date, nullish, number, object, picklist, string, union } from "valibot";
// Import from `~/lib/` (not `~/server/db/schema`) so this client-consumed module
// doesn't pull Drizzle into the browser bundle (TSS-2).
import { TaskStatus } from "~/lib/enums/task-status";
import { UserRole } from "~/lib/enums/user-role";

// `version` arrives as the DB integer from defaultValues, or as a string once a
// hidden input has round-tripped it; updateEntity coerces either.
const formVersion = nullish(union([number(), string()]));

// Task validation schema
export const taskFormSchema = object({
	title: string(),
	description: nullish(string()),
	dueDate: nullish(date()),
	status: picklist([TaskStatus.ACTIVE, TaskStatus.COMPLETED]),
	userId: string(),
	version: formVersion,
});

// User validation schema
export const userFormSchema = object({
	email: string(),
	name: nullish(string()),
	role: picklist([UserRole.MEMBER, UserRole.ADMIN]),
	version: formVersion,
});
