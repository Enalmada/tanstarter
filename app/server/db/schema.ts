/**
 * Database schema definitions
 * Defines all database tables and their relationships
 * Includes validation schemas for data integrity
 */

import {
	pgTable,
	primaryKey,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-valibot";
import { nanoid } from "nanoid/non-secure";
import { date, enum_, nullable, object, string, undefined_ } from "valibot";

// Parameterized insert don't seem to respect defaultFn
export const nanoString = (prefix: string) => `${prefix}_${nanoid()}`;

const generateIdField = (prefix: string) => {
	return varchar("id")
		.$defaultFn(() => nanoString(prefix))
		.primaryKey();
};

export const user = pgTable("user", {
	id: generateIdField("usr"),
	name: text(),
	// first_name: text(),
	// last_name: text(),
	avatar_url: text(),
	email: text().unique().notNull(),

	created_at: timestamp().defaultNow().notNull(),
	updated_at: timestamp()
		.defaultNow()
		.$onUpdate(() => new Date()),
	setup_at: timestamp(),
	terms_accepted_at: timestamp(),
});

export const oauthAccount = pgTable(
	"oauth_account",
	{
		provider_id: text(),
		provider_user_id: text(),
		user_id: varchar()
			.notNull()
			.references(() => user.id),
	},
	(table) => [
		primaryKey({ columns: [table.provider_id, table.provider_user_id] }),
	],
);

export const session = pgTable("session", {
	id: text().primaryKey(),
	user_id: varchar()
		.notNull()
		.references(() => user.id),
	expires_at: timestamp({
		withTimezone: true,
		mode: "date",
	}).notNull(),
});

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;

export type ClientUser = Pick<
	typeof user.$inferSelect,
	"id" | "name" | "avatar_url" | "email" | "setup_at"
>;

// Task Schema
export const TaskStatus = {
	ACTIVE: "ACTIVE",
	COMPLETED: "COMPLETED",
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

// Valibot schema for TaskStatus
export const taskStatusSchema = enum_(TaskStatus);

export const task = pgTable("task", {
	id: generateIdField("tsk"),
	title: varchar("title", { length: 256 }).notNull(),
	description: varchar("description", { length: 1024 }),
	status: text("status")
		.$type<TaskStatusType>()
		.default(TaskStatus.ACTIVE)
		.notNull(),
	due_date: timestamp("due_date", { mode: "date" }),
	user_id: varchar("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	created_at: timestamp("created_at").defaultNow().notNull(),
	updated_at: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;

// Valibot schemas with proper enum handling
export const taskSelectSchema = createSelectSchema(task, {
	status: taskStatusSchema,
});

export const taskInsertSchema = createInsertSchema(task, {
	status: taskStatusSchema,
});

// Form-specific schema that excludes server-side fields
export const taskFormSchema = createInsertSchema(task, {
	// Override server-managed fields to be undefined
	id: undefined_(),
	user_id: undefined_(),
	created_at: undefined_(),
	updated_at: undefined_(),
});
