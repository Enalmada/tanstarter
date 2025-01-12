/**
 * Database schema definitions
 * Defines all database tables and their relationships
 * Includes validation schemas for data integrity
 */

import {
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-valibot";
import { nanoid } from "nanoid/non-secure";
import {
	date,
	enum_,
	minLength,
	nullable,
	object,
	pipe,
	string,
	transform,
	undefined_,
} from "valibot";

// Parameterized insert don't seem to respect defaultFn
export const nanoString = (prefix: string) => `${prefix}_${nanoid()}`;

const generateIdField = (prefix: string) => {
	return varchar("id")
		.$defaultFn(() => nanoString(prefix))
		.primaryKey();
};

export enum UserRole {
	MEMBER = "MEMBER",
	ADMIN = "ADMIN",
}

export const UserRolesEnum = pgEnum(
	"role",
	Object.values(UserRole) as [string, ...string[]],
);

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const userRoleSchema = enum_(UserRole);

export const user = pgTable("user", {
	id: generateIdField("usr"),
	name: text(),
	// first_name: text(),
	// last_name: text(),
	avatar_url: text(),
	email: text().unique().notNull(),
	role: UserRolesEnum("role")
		.default(UserRole.MEMBER)
		.$type<UserRole>()
		.notNull(),
	created_at: timestamp({ mode: "date" }).defaultNow().notNull(),
	updated_at: timestamp({ mode: "date" })
		.defaultNow()
		.$onUpdate(() => new Date()),
	setup_at: timestamp({ mode: "date" }),
	terms_accepted_at: timestamp({ mode: "date" }),
});

export type User = typeof user.$inferSelect;
export type UserInsert = typeof user.$inferInsert;

export type ClientUser = Pick<
	typeof user.$inferSelect,
	"id" | "name" | "avatar_url" | "email" | "setup_at"
>;

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

export type Session = typeof session.$inferSelect;

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
	created_at: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: "date" })
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type Task = typeof task.$inferSelect;
export type TaskInsert = typeof task.$inferInsert;

export type ClientTask = Pick<
	typeof task.$inferSelect,
	| "id"
	| "title"
	| "description"
	| "status"
	| "due_date"
	| "user_id"
	| "created_at"
	| "updated_at"
>;

// Valibot schemas with proper enum handling
export const taskSelectSchema = createSelectSchema(task, {
	status: taskStatusSchema,
});

export const taskInsertSchema = createInsertSchema(task, {
	status: taskStatusSchema,
});

export const taskUpdateSchema = createUpdateSchema(task, {
	status: taskStatusSchema,
});

// Form-specific schema that excludes server-side fields
export const taskFormSchema = createInsertSchema(task, {
	// Override server-managed fields to be undefined
	id: undefined_(),
	user_id: undefined_(),
	created_at: undefined_(),
	updated_at: undefined_(),
	status: taskStatusSchema,
	due_date: pipe(
		nullable(date()),
		transform((input) => (input ? new Date(input) : null)),
	),
});

export const userSelectSchema = createSelectSchema(user, {
	role: userRoleSchema,
});

export const userInsertSchema = createInsertSchema(user, {
	role: userRoleSchema,
});

// Form-specific schema that excludes server-side fields
export const userFormSchema = object({
	email: string(),
	name: nullable(string()),
	role: userRoleSchema,
});
