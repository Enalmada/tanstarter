import { safeParse } from "valibot";
import { describe, expect, it } from "vitest";
import { mockUserId } from "~/server/services/__tests__/base-service.test";
import {
	TaskStatus,
	UserRole,
	taskFormSchema,
	taskInsertSchema,
	taskStatusSchema,
	taskUpdateSchema,
	userFormSchema,
	userInsertSchema,
	userRoleSchema,
} from "../schema";

describe("schema validation", () => {
	describe("task schemas", () => {
		describe("taskStatusSchema", () => {
			it("should validate valid status values", () => {
				expect(safeParse(taskStatusSchema, TaskStatus.ACTIVE).success).toBe(
					true,
				);
				expect(safeParse(taskStatusSchema, TaskStatus.COMPLETED).success).toBe(
					true,
				);
			});

			it("should reject invalid status values", () => {
				expect(safeParse(taskStatusSchema, "INVALID").success).toBe(false);
				expect(safeParse(taskStatusSchema, "").success).toBe(false);
				expect(safeParse(taskStatusSchema, null).success).toBe(false);
			});
		});

		describe("taskFormSchema", () => {
			it("should validate valid task form data", () => {
				const validTask = {
					title: "Test Task",
					description: "Test Description",
					status: TaskStatus.ACTIVE,
					dueDate: new Date(),
					userId: mockUserId,
					version: 1,
				};

				const result = safeParse(taskFormSchema, validTask);
				if (!result.success) {
					console.error("Task validation failed:", {
						input: validTask,
						issues: result.issues,
					});
				}
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.output).toMatchObject({
						title: validTask.title,
						description: validTask.description,
						status: validTask.status,
						version: 1,
					});
					expect(result.output.dueDate).toBeInstanceOf(Date);
				}
			});

			it("should handle optional fields", () => {
				const minimalTask = {
					title: "Test Task",
					description: null,
					status: TaskStatus.ACTIVE,
					dueDate: null,
					userId: mockUserId,
					version: 1,
				};

				const result = safeParse(taskFormSchema, minimalTask);
				if (!result.success) {
					console.error("Task validation failed:", {
						input: minimalTask,
						issues: result.issues,
					});
				}
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.output).toMatchObject({
						title: minimalTask.title,
						description: null,
						dueDate: null,
						status: TaskStatus.ACTIVE,
						userId: mockUserId,
						version: 1,
					});
				}
			});

			it("should reject invalid task data", () => {
				const invalidTasks = [
					{}, // Missing required title
					{ title: "" }, // Empty title
					{ title: "Test", status: "INVALID" }, // Invalid status
					{ title: "Test", dueDate: "invalid-date" }, // Invalid date
				];

				for (const task of invalidTasks) {
					expect(safeParse(taskFormSchema, task).success).toBe(false);
				}
			});
		});

		describe("taskInsertSchema", () => {
			it("should validate valid insert data", () => {
				const validInsert = {
					title: "Test Task",
					description: "Test Description",
					status: TaskStatus.ACTIVE,
					userId: mockUserId,
					dueDate: new Date(),
					version: 1,
				};

				const result = safeParse(taskInsertSchema, validInsert);
				expect(result.success).toBe(true);
			});
		});

		describe("taskUpdateSchema", () => {
			it("should validate partial updates", () => {
				const validUpdates = [
					{
						title: "Updated Title",
						status: TaskStatus.ACTIVE,
						userId: mockUserId,
					},
					{
						description: null,
						status: TaskStatus.COMPLETED,
						userId: mockUserId,
					},
					{
						dueDate: new Date(),
						status: TaskStatus.ACTIVE,
						userId: mockUserId,
					},
				];

				for (const update of validUpdates) {
					expect(safeParse(taskUpdateSchema, update).success).toBe(true);
				}
			});
		});
	});

	describe("user schemas", () => {
		describe("userRoleSchema", () => {
			it("should validate valid role values", () => {
				expect(safeParse(userRoleSchema, UserRole.MEMBER).success).toBe(true);
				expect(safeParse(userRoleSchema, UserRole.ADMIN).success).toBe(true);
			});

			it("should reject invalid role values", () => {
				expect(safeParse(userRoleSchema, "INVALID").success).toBe(false);
				expect(safeParse(userRoleSchema, "").success).toBe(false);
				expect(safeParse(userRoleSchema, null).success).toBe(false);
			});
		});

		describe("userFormSchema", () => {
			it("should validate valid user form data", () => {
				const validUser = {
					email: "test@example.com",
					name: "Test User",
					role: UserRole.MEMBER,
					version: 1,
				};

				const result = safeParse(userFormSchema, validUser);
				if (!result.success) {
					console.error("User validation failed:", {
						input: validUser,
						issues: result.issues,
						schema: userFormSchema,
					});
				}
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.output).toMatchObject(validUser);
				}
			});

			it("should handle optional fields", () => {
				const minimalUser = {
					email: "test@example.com",
					role: UserRole.MEMBER,
					name: null,
					version: 1,
				};

				const result = safeParse(userFormSchema, minimalUser);
				if (!result.success) {
					console.error("User validation failed:", {
						input: minimalUser,
						issues: result.issues,
						schema: userFormSchema,
					});
				}
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.output).toMatchObject({
						...minimalUser,
						name: null,
					});
				}
			});

			it("should reject invalid user data", () => {
				const invalidUsers = [
					{}, // Missing required fields
					{ email: "invalid-email" }, // Invalid email
					{ email: "test@example.com", role: "INVALID" }, // Invalid role
				];

				for (const user of invalidUsers) {
					expect(safeParse(userFormSchema, user).success).toBe(false);
				}
			});
		});

		describe("userInsertSchema", () => {
			it("should validate valid insert data", () => {
				const validInsert = {
					email: "test@example.com",
					name: "Test User",
					role: UserRole.MEMBER,
					avatar_url: "https://example.com/avatar.jpg",
				};

				const result = safeParse(userInsertSchema, validInsert);
				expect(result.success).toBe(true);
			});
		});
	});
});
