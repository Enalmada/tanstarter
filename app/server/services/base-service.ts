import { createServerFn } from "@tanstack/start";
import { eq } from "drizzle-orm";
import { object, picklist, string } from "valibot";
import { authMiddleware } from "~/middleware/auth-guard";
import type { SubjectType } from "../access/ability";
import { accessCheck } from "../access/check";
import DB from "../db";
import { TaskTable, UserTable } from "../db/schema";

// Map of subject types to their corresponding tables
const tables = {
	Task: TaskTable,
	User: UserTable,
} as const;

export const validateDeleteEntity = object({
	subject: picklist(["Task", "User"] as const),
	id: string(),
});

export const deleteEntity = createServerFn({ method: "POST" })
	.validator(validateDeleteEntity)
	.middleware([authMiddleware])
	.handler(async ({ data: { subject, id }, context }) => {
		const table = tables[subject as keyof typeof tables];

		const [entity] = await DB.select().from(table).where(eq(table.id, id));

		if (!entity) {
			throw new Error(`${subject} ${id} not found`);
		}

		accessCheck(context.user, "delete", subject as SubjectType, entity);

		const [result] = await DB.delete(table).where(eq(table.id, id)).returning();

		return result;
	});
