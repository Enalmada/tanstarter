/**
 * Authentication schema definitions
 * User, Session, Account, and Verification tables for Better Auth
 */

import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-valibot";
import { nanoid } from "nanoid/non-secure";
import { enum_, nullable, number, pipe, transform } from "valibot";

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

// User Schema
export enum UserRole {
	MEMBER = "MEMBER",
	ADMIN = "ADMIN",
}

export const UserRolesEnum = pgEnum("role", Object.values(UserRole) as [string, ...string[]]);

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const userRoleSchema = enum_(UserRole);

export const UserTable = pgTable("user", {
	id: generateIdField("usr"),
	email: text().unique().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	name: text(),
	image: text("image"),
	role: UserRolesEnum("role").default(UserRole.MEMBER).$type<UserRole>().notNull(),
	...generateAuditingFields(),
});

// Note: Relations with TaskTable are defined in task.schema.ts to avoid circular imports

export type User = typeof UserTable.$inferSelect;
export type UserInsert = typeof UserTable.$inferInsert;

export const userSelectSchema = createSelectSchema(UserTable, {
	role: userRoleSchema,
});

export const userInsertSchema = createInsertSchema(UserTable, {
	role: userRoleSchema,
});

export const userUpdateSchema = createUpdateSchema(UserTable, {
	role: userRoleSchema,
});

// Form-specific schema that excludes server-side fields
export const userFormSchema = pipe(
	createInsertSchema(UserTable, {
		role: userRoleSchema,
		version: nullable(number()),
	}),
	transform((input) => ({
		...input,
		id: undefined,
		emailVerified: undefined,
		image: undefined,
		createdAt: undefined,
		updatedAt: undefined,
		createdById: undefined,
		updatedById: undefined,
	})),
);

// Session Schema
export const SessionTable = pgTable("session", {
	id: generateIdField("ses"),
	expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at", { mode: "date" }).notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => UserTable.id, { onDelete: "cascade" }),
});

export const sessionRelations = relations(SessionTable, ({ one }) => ({
	user: one(UserTable, {
		fields: [SessionTable.userId],
		references: [UserTable.id],
	}),
}));

export type Session = typeof SessionTable.$inferSelect;

// Account Schema
export const AccountTable = pgTable("account", {
	id: generateIdField("acc"),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => UserTable.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
		mode: "date",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at", { mode: "date" }).notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

export const accountRelations = relations(AccountTable, ({ one }) => ({
	user: one(UserTable, {
		fields: [AccountTable.userId],
		references: [UserTable.id],
	}),
}));

// Verification Schema
export const VerificationTable = pgTable("verification", {
	id: generateIdField("ver"),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
	createdAt: timestamp("created_at", { mode: "date" }),
	updatedAt: timestamp("updated_at", { mode: "date" }),
});
