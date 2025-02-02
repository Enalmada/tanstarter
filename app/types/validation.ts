import { date, nullish, object, picklist, string } from "valibot";
import { TaskStatus, UserRole } from "~/server/db/schema";

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
