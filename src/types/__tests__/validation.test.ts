import { safeParse } from "valibot";
import { describe, expect, it } from "vitest";
import { TaskStatus } from "~/lib/enums/task-status";
import { UserRole } from "~/lib/enums/user-role";
import { taskFormSchema, userFormSchema } from "../validation";

// Admin forms pass the DB integer `version` as a default value, and hidden
// inputs can hand it back as a string. Rejecting the number made the admin
// user edit form fail validation before it ever submitted.
describe("form schemas accept version as number or string", () => {
	const user = { email: "a@example.test", name: "A", role: UserRole.MEMBER };
	const task = { title: "t", status: TaskStatus.ACTIVE, userId: "usr_1" };

	it.each([1, "1", null, undefined])("user version %s", (version) => {
		expect(safeParse(userFormSchema, { ...user, version }).success).toBe(true);
	});

	it.each([1, "1", null, undefined])("task version %s", (version) => {
		expect(safeParse(taskFormSchema, { ...task, version }).success).toBe(true);
	});

	it("still rejects a non-numeric type", () => {
		expect(safeParse(userFormSchema, { ...user, version: true }).success).toBe(false);
	});
});
