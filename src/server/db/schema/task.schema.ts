/**
 * Task schema definitions
 * Task management related tables and types
 */

import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-valibot";
import { date, nullable, picklist, pipe, transform } from "valibot";
import { nanoString, UserTable } from "./auth.schema";

const generateIdField = (prefix: string) => {
	return varchar("id")
		.$defaultFn(() => nanoString(prefix))
		.primaryKey();
};

const generateAuditingFields = () => {
	return {
		version: integer("version").default(1).notNull(),
		createdById: varchar("created_by_id"),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
		updatedById: varchar("updated_by_id"),
		updatedAt: timestamp("updated_at", { mode: "date" }),
	};
};

// Task Schema
export enum TaskStatus {
	ACTIVE = "ACTIVE",
	COMPLETED = "COMPLETED",
}

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskTable = pgTable("task", {
	id: generateIdField("tsk"),
	title: varchar("title", { length: 256 }).notNull(),
	description: varchar("description", { length: 1024 }),
	status: text("status").$type<TaskStatus>().default(TaskStatus.ACTIVE).notNull(),
	dueDate: timestamp("due_date", { mode: "date" }),
	userId: varchar("user_id")
		.notNull()
		.references(() => UserTable.id, { onDelete: "cascade" }),
	...generateAuditingFields(),
});

export const taskRelations = relations(TaskTable, ({ one }) => ({
	user: one(UserTable, {
		fields: [TaskTable.userId],
		references: [UserTable.id],
	}),
}));

export const usersRelations = relations(UserTable, ({ many }) => ({
	tasks: many(TaskTable),
}));

export type Task = typeof TaskTable.$inferSelect;
export type TaskInsert = typeof TaskTable.$inferInsert;

export type ClientTask = Pick<
	typeof TaskTable.$inferSelect,
	"id" | "title" | "description" | "status" | "dueDate" | "userId" | "createdAt" | "updatedAt"
>;

// Valibot schema for TaskStatus
export const taskStatusSchema = picklist([TaskStatus.ACTIVE, TaskStatus.COMPLETED]);

// Valibot schemas with proper enum handling
export const taskSelectSchema = createSelectSchema(TaskTable, {
	status: taskStatusSchema,
});

export const taskInsertSchema = createInsertSchema(TaskTable, {
	status: taskStatusSchema,
});

export const taskUpdateSchema = createUpdateSchema(TaskTable, {
	status: taskStatusSchema,
});

// Form-specific schema that excludes server-side fields
export const taskFormSchema = pipe(
	createInsertSchema(TaskTable, {
		status: taskStatusSchema,
		dueDate: pipe(
			nullable(date()),
			transform((input) => (input ? new Date(input) : null)),
		),
	}),
	transform((input) => ({
		...input,
		id: undefined,
		createdAt: undefined,
		updatedAt: undefined,
		createdById: undefined,
		updatedById: undefined,
	})),
);
