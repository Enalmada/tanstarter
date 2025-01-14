/**
 * Database schema definitions
 * Defines all database tables and their relationships
 * Includes validation schemas for data integrity
 */

import { relations } from "drizzle-orm";
import {
	integer,
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

const generateAuditingFields = () => {
	return {
		version: integer("version").default(1).notNull(),
		createdById: varchar("created_by_id"),
		createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
		updatedById: varchar("updated_by_id"),
		updatedAt: timestamp("updated_at", { mode: "date" }),
	};
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

export const UserTable = pgTable("user", {
	id: generateIdField("usr"),
	name: text(),
	// firstName: text(),
	// lastName: text(),
	avatarUrl: text("avatar_url"),
	email: text().unique().notNull(),
	role: UserRolesEnum("role")
		.default(UserRole.MEMBER)
		.$type<UserRole>()
		.notNull(),
	setupAt: timestamp("setup_at", { mode: "date" }),
	termsAcceptedAt: timestamp("terms_accepted_at", { mode: "date" }),
	...generateAuditingFields(),
});

export const usersRelations = relations(UserTable, ({ many }) => ({
	tasks: many(TaskTable),
}));

export type User = typeof UserTable.$inferSelect;
export type UserInsert = typeof UserTable.$inferInsert;

export type ClientUser = Pick<
	typeof UserTable.$inferSelect,
	"id" | "name" | "avatarUrl" | "email" | "setupAt" | "role"
>;

export const OAuthAccountTable = pgTable(
	"oauth_account",
	{
		providerId: text("provider_id"),
		providerUserId: text("provider_user_id"),
		userId: varchar("user_id")
			.notNull()
			.references(() => UserTable.id),
	},
	(table) => [
		primaryKey({ columns: [table.providerId, table.providerUserId] }),
	],
);

export const SessionTable = pgTable("session", {
	id: text().primaryKey(),
	userId: varchar("user_id")
		.notNull()
		.references(() => UserTable.id),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date",
	}).notNull(),
});

export type Session = typeof SessionTable.$inferSelect;

// Task Schema
export const TaskStatus = {
	ACTIVE: "ACTIVE",
	COMPLETED: "COMPLETED",
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

// Valibot schema for TaskStatus
export const taskStatusSchema = enum_(TaskStatus);

export const TaskTable = pgTable("task", {
	id: generateIdField("tsk"),
	title: varchar("title", { length: 256 }).notNull(),
	description: varchar("description", { length: 1024 }),
	status: text("status")
		.$type<TaskStatusType>()
		.default(TaskStatus.ACTIVE)
		.notNull(),
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

export type Task = typeof TaskTable.$inferSelect;
export type TaskInsert = typeof TaskTable.$inferInsert;

export type ClientTask = Pick<
	typeof TaskTable.$inferSelect,
	| "id"
	| "title"
	| "description"
	| "status"
	| "dueDate"
	| "userId"
	| "createdAt"
	| "updatedAt"
>;

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
export const taskFormSchema = createInsertSchema(TaskTable, {
	// Override server-managed fields to be undefined
	id: undefined_(),
	userId: undefined_(),
	createdAt: undefined_(),
	updatedAt: undefined_(),
	status: taskStatusSchema,
	dueDate: pipe(
		nullable(date()),
		transform((input) => (input ? new Date(input) : null)),
	),
});

export const userSelectSchema = createSelectSchema(UserTable, {
	role: userRoleSchema,
});

export const userInsertSchema = createInsertSchema(UserTable, {
	role: userRoleSchema,
});

// Form-specific schema that excludes server-side fields
export const userFormSchema = object({
	email: string(),
	name: nullable(string()),
	role: userRoleSchema,
});
