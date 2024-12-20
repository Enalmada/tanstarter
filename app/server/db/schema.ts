import {
	pgTable,
	primaryKey,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

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
