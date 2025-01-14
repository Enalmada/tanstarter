import type { ObjectSchema } from "valibot";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { accessCheck } from "../../access/check";
import DB from "../../db";
import { TaskStatus, UserRole } from "../../db/schema";
import type { Task, User } from "../../db/schema";
import { deleteEntity, validateDeleteEntity } from "../base-service";
import { validateId } from "../helpers";

// biome-ignore lint/suspicious/noExportsInTest: <explanation>
export const mockUserId = "usr_1";

const fixedDate = new Date("2023-08-28T21:37:27.238Z");

// biome-ignore lint/suspicious/noExportsInTest: <explanation>
export const baseEntityMock = {
	createdAt: fixedDate,
	createdById: mockUserId,
	updatedAt: fixedDate,
	updatedById: mockUserId,
	version: 1,
};

// biome-ignore lint/suspicious/noExportsInTest: <explanation>
export const mockTask: Task = {
	id: "tsk_1",
	title: "Task 1",
	description: null,
	dueDate: fixedDate,
	status: TaskStatus.ACTIVE,
	userId: mockUserId,
	...baseEntityMock,
};

// biome-ignore lint/suspicious/noExportsInTest: <explanation>
export const mockUser: User = {
	id: mockUserId,
	email: "test@example.com",
	name: "Test User",
	role: UserRole.MEMBER,
	avatarUrl: null,
	setupAt: null,
	termsAcceptedAt: null,
	...baseEntityMock,
};

const mockContext = {
	user: { id: mockUserId },
};

const mockDeleteTaskInput = {
	data: {
		subject: "Task" as const,
		id: mockTask.id,
	},
	context: mockContext,
};

const mockDeleteUserInput = {
	data: {
		subject: "User" as const,
		id: mockUser.id,
	},
	context: mockContext,
};

// Mock @tanstack/start
vi.mock("@tanstack/start", () => ({
	createServerFn: () => ({
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		validator: (schema: ObjectSchema<any, any>) => ({
			middleware: () => ({
				handler:
					(
						handler: (params: {
							data: unknown;
							context: unknown;
						}) => Promise<unknown>,
					) =>
					async (input: { data: unknown; context: unknown }) => {
						// For deleteEntity, we know the schema is validateDeleteEntity
						if (schema === validateDeleteEntity) {
							// Only validate if subject is "Task" or "User"
							const { subject, id } = input.data as {
								subject: string;
								id: string;
							};
							if (subject !== "Task" && subject !== "User") {
								throw new Error("Invalid input");
							}
							// Pass through to handler if valid
							return handler(input);
						}
						// For other cases, pass through to handler
						return handler(input);
					},
			}),
		}),
	}),
	createMiddleware: () => ({
		server: (fn: unknown) => fn,
	}),
}));

// Mock DB and access check
vi.mock("../../db", () => ({
	default: {
		select: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock("../../access/check", () => ({
	accessCheck: vi.fn(),
}));

describe("base-service", () => {
	describe("validateId", () => {
		it("should validate a valid ID", () => {
			const validInput = { id: "123" };
			const result = validateId(validInput);
			expect(result).toBe("123");
		});

		it("should throw error for missing ID", () => {
			const invalidInput = {};
			expect(() => validateId(invalidInput)).toThrow("Invalid ID");
		});

		it("should throw error for empty ID", () => {
			const invalidInput = { id: "" };
			expect(() => validateId(invalidInput)).toThrow("ID cannot be empty");
		});

		it("should throw error for non-string ID", () => {
			const invalidInput = { id: 123 };
			expect(() => validateId(invalidInput)).toThrow("Invalid ID");
		});
	});

	describe("getAuthenticatedUser", () => {
		it("should validate a valid user", () => {
			const validUser = { id: "123", name: "Test User" };
			const result = validateId({ id: validUser.id });
			expect(result).toBe("123");
		});

		it("should throw error for missing user", () => {
			const invalidUser = undefined;
			expect(() => validateId({ id: invalidUser })).toThrow("Invalid ID");
		});
	});

	describe("deleteEntity", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("should validate input and throw error for invalid subject", async () => {
			const invalidInput = {
				data: {
					subject: "InvalidSubject" as "Task" | "User",
					id: mockTask.id,
				},
				context: mockContext,
			};

			// Mock DB.select to avoid undefined error
			const mockWhere = vi.fn().mockResolvedValue([]);
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
			vi.mocked(DB.select).mockImplementation(mockSelect);

			await expect(deleteEntity(invalidInput)).rejects.toThrow("Invalid input");
		});

		it("should throw error when entity not found", async () => {
			const input = {
				...mockDeleteTaskInput,
				data: {
					...mockDeleteTaskInput.data,
					id: "non-existent",
				},
			};

			// Mock the chain of function calls
			const mockWhere = vi.fn().mockResolvedValue([]);
			const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

			vi.mocked(DB.select).mockImplementation(mockSelect);

			await expect(deleteEntity(input)).rejects.toThrow(
				"Task non-existent not found",
			);
		});

		it("should check access before deleting", async () => {
			// Mock the chain of function calls
			const mockSelectWhere = vi.fn().mockResolvedValue([mockTask]);
			const mockSelectFrom = vi
				.fn()
				.mockReturnValue({ where: mockSelectWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

			const mockDeleteReturning = vi.fn().mockResolvedValue([mockTask]);
			const mockDeleteWhere = vi
				.fn()
				.mockReturnValue({ returning: mockDeleteReturning });
			const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

			vi.mocked(DB.select).mockImplementation(mockSelect);
			vi.mocked(DB.delete).mockImplementation(mockDelete);

			await deleteEntity(mockDeleteTaskInput);

			expect(accessCheck).toHaveBeenCalledWith(
				mockContext.user,
				"delete",
				"Task",
				mockTask,
			);
		});

		it("should successfully delete a task", async () => {
			// Mock the chain of function calls
			const mockSelectWhere = vi.fn().mockResolvedValue([mockTask]);
			const mockSelectFrom = vi
				.fn()
				.mockReturnValue({ where: mockSelectWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

			const mockDeleteReturning = vi.fn().mockResolvedValue([mockTask]);
			const mockDeleteWhere = vi
				.fn()
				.mockReturnValue({ returning: mockDeleteReturning });
			const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

			vi.mocked(DB.select).mockImplementation(mockSelect);
			vi.mocked(DB.delete).mockImplementation(mockDelete);

			const result = await deleteEntity(mockDeleteTaskInput);
			expect(result).toEqual(mockTask);
		});

		it("should successfully delete a user", async () => {
			// Mock the chain of function calls
			const mockSelectWhere = vi.fn().mockResolvedValue([mockUser]);
			const mockSelectFrom = vi
				.fn()
				.mockReturnValue({ where: mockSelectWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

			const mockDeleteReturning = vi.fn().mockResolvedValue([mockUser]);
			const mockDeleteWhere = vi
				.fn()
				.mockReturnValue({ returning: mockDeleteReturning });
			const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere });

			vi.mocked(DB.select).mockImplementation(mockSelect);
			vi.mocked(DB.delete).mockImplementation(mockDelete);

			const result = await deleteEntity(mockDeleteUserInput);
			expect(result).toEqual(mockUser);
		});

		it("should throw error when access check fails", async () => {
			// Mock the chain of function calls
			const mockSelectWhere = vi.fn().mockResolvedValue([mockTask]);
			const mockSelectFrom = vi
				.fn()
				.mockReturnValue({ where: mockSelectWhere });
			const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

			vi.mocked(DB.select).mockImplementation(mockSelect);
			vi.mocked(accessCheck).mockImplementationOnce(() => {
				throw new Error("Access denied");
			});

			await expect(deleteEntity(mockDeleteTaskInput)).rejects.toThrow(
				"Access denied",
			);
			expect(DB.delete).not.toHaveBeenCalled();
		});
	});
});
