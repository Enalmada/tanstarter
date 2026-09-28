/**
 * Authorization behavior of the generic CRUD handlers, with real CASL rules
 * (only the DB and the session are faked).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleDeleteEntity } from "~/functions/delete-entity";
import { handleFindFirst } from "~/functions/find-first";
import { handleFindMany } from "~/functions/find-many";
import { handleUpdateEntity } from "~/functions/update-entity";
import { UserRole } from "~/lib/enums/user-role";
import { BadRequestError, ConflictError, NotAuthorizedError, NotFoundError } from "~/server/access/http-errors";

const member = { id: "usr_member", role: UserRole.MEMBER };
const ownTask = { id: "tsk_own", userId: member.id, title: "mine", version: 1 };
const otherTask = { id: "tsk_other", userId: "usr_other", title: "theirs", version: 1 };

const state = vi.hoisted(() => ({
	rows: [] as Record<string, unknown>[],
	selected: [] as Record<string, unknown>[],
	deleted: vi.fn(),
	updated: vi.fn(),
}));

vi.mock("~/server/access/check", async (importOriginal) => importOriginal());

vi.mock("~/server/db", () => ({
	default: {
		select: () => ({
			from: () => ({
				where: () => {
					const result = Promise.resolve(state.selected) as Promise<unknown> & { limit: () => Promise<unknown> };
					result.limit = () => Promise.resolve(state.selected);
					return result;
				},
			}),
		}),
		delete: () => ({
			where: () => ({
				returning: async () => {
					state.deleted();
					return state.selected;
				},
			}),
		}),
		update: () => ({
			set: (values: Record<string, unknown>) => ({
				where: () => ({
					returning: async () => {
						state.updated(values);
						return [{ ...state.selected[0], ...values }];
					},
				}),
			}),
		}),
	},
}));

vi.mock("~/functions/base-service", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/functions/base-service")>();
	const { pgTable, text, integer } = await import("drizzle-orm/pg-core");
	const TaskTable = pgTable("task", {
		id: text().primaryKey(),
		userId: text("user_id"),
		title: text(),
		version: integer(),
	});
	const passthrough = { "~standard": { version: 1, vendor: "test", validate: (value: unknown) => ({ value }) } };
	return {
		...actual,
		getUser: async () => member,
		loadEntityConfig: async () => ({
			Task: {
				table: TaskTable,
				query: {
					findFirst: async () => state.rows[0],
					findMany: async () => state.rows,
				},
				schemas: { select: passthrough, insert: passthrough, update: passthrough },
			},
		}),
	};
});

vi.mock("valibot", async (importOriginal) => {
	const actual = await importOriginal<typeof import("valibot")>();
	return {
		...actual,
		// Let the fake "update" schema above pass values through untouched.
		safeParse: (schema: unknown, input: unknown) =>
			schema && typeof schema === "object" && "~standard" in schema && !("kind" in schema)
				? { success: true, output: input, issues: undefined }
				: actual.safeParse(schema as never, input),
	};
});

beforeEach(() => {
	state.rows = [];
	state.selected = [];
	state.deleted.mockClear();
	state.updated.mockClear();
});

describe("findFirst", () => {
	it("treats another user's task exactly like a missing one", async () => {
		state.rows = [otherTask];
		const forbidden = handleFindFirst({ data: { subject: "Task", where: { id: otherTask.id } } });
		await expect(forbidden).rejects.toBeInstanceOf(NotFoundError);

		state.rows = [];
		const missing = handleFindFirst({ data: { subject: "Task", where: { id: "nope" } } });
		await expect(missing).rejects.toBeInstanceOf(NotFoundError);
	});

	it("returns the caller's own task", async () => {
		state.rows = [ownTask];
		await expect(handleFindFirst({ data: { subject: "Task", where: { id: ownTask.id } } })).resolves.toEqual(ownTask);
	});

	it("rejects operator filters and unknown relations before querying", async () => {
		await expect(
			handleFindFirst({ data: { subject: "Task", where: { userId: { ne: member.id } } } }),
		).rejects.toBeInstanceOf(BadRequestError);
		await expect(
			handleFindFirst({ data: { subject: "Task", where: { id: ownTask.id }, with: { accounts: true } } }),
		).rejects.toBeInstanceOf(BadRequestError);
	});
});

describe("findMany", () => {
	it("drops rows the caller cannot read", async () => {
		state.rows = [ownTask, otherTask];
		await expect(handleFindMany({ data: { subject: "Task", where: { userId: member.id } } })).resolves.toEqual([
			ownTask,
		]);
	});

	it("forbids listing without the caller's own userId filter", async () => {
		await expect(handleFindMany({ data: { subject: "Task", where: {} } })).rejects.toBeInstanceOf(NotAuthorizedError);
	});
});

describe("deleteEntity", () => {
	it("reports another user's task as not found and does not delete it", async () => {
		state.selected = [otherTask];
		await expect(handleDeleteEntity({ data: { subject: "Task", id: otherTask.id } })).rejects.toBeInstanceOf(
			NotFoundError,
		);
		expect(state.deleted).not.toHaveBeenCalled();
	});
});

describe("updateEntity", () => {
	it("reports another user's task as not found before any version check", async () => {
		state.selected = [otherTask];
		const stale = handleUpdateEntity({ data: { subject: "Task", id: otherTask.id, data: { version: 99 } } });
		await expect(stale).rejects.toBeInstanceOf(NotFoundError);
		expect(state.updated).not.toHaveBeenCalled();
	});

	it("returns a conflict for the caller's own stale task", async () => {
		state.selected = [ownTask];
		const stale = handleUpdateEntity({ data: { subject: "Task", id: ownTask.id, data: { version: 99 } } });
		await expect(stale).rejects.toBeInstanceOf(ConflictError);
	});

	it("forbids moving the caller's task to another user", async () => {
		state.selected = [ownTask];
		const move = handleUpdateEntity({
			data: { subject: "Task", id: ownTask.id, data: { version: 1, userId: "usr_other" } },
		});
		await expect(move).rejects.toBeInstanceOf(NotAuthorizedError);
		expect(state.updated).not.toHaveBeenCalled();
	});

	it("never writes server-managed fields from the client patch", async () => {
		state.selected = [ownTask];
		await handleUpdateEntity({
			data: {
				subject: "Task",
				id: ownTask.id,
				data: { version: 1, title: "renamed", id: "tsk_hijack", createdById: "usr_other" },
			},
		});
		const written = state.updated.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(written).toMatchObject({ title: "renamed", version: 2, updatedById: member.id });
		expect(written).not.toHaveProperty("id");
		expect(written).not.toHaveProperty("createdById");
	});
});
