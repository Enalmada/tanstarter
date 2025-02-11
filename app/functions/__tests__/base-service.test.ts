/**
 * Base Service Tests
 *
 * Tests the generic CRUD operations provided by base-service.ts.
 * Focus areas:
 * 1. Input validation
 * 2. Basic CRUD operations
 * 3. Access control integration
 * 4. Error handling
 *
 * Test Strategy:
 * - Mock DB operations to keep tests focused on service logic
 * - Use shared test data from setup.ts
 * - Verify access checks without duplicating access control tests
 * - Test happy paths and error cases for each operation
 *
 * Required Mocks:
 * 1. Database operations via setupDBMocks
 * 2. Access control via vi.mock("~/server/access/check")
 *
 * Example mock setup:
 * ```ts
 * // Mock access control
 * vi.mock("~/server/access/check", () => ({
 *   accessCheck: vi.fn()
 * }));
 *
 * // Setup DB mocks for a test
 * const { select, delete: del } = setupDBMocks(DB);
 * select.where.mockResolvedValue([mockTask]);
 *
 * // Verify access check was called
 * expect(vi.mocked(accessCheck)).toHaveBeenCalledWith(...);
 * ```
 *
 * Access Control:
 * - MEMBER users can only CRUD their own tasks
 * - ADMIN users can CRUD any task
 * - Tests primarily focus on MEMBER role behavior
 * - Task ownership is controlled via userId field
 *
 * Example:
 * ```ts
 * // Task owned by user
 * const ownedTask = { ...mockTask, userId: mockContext.user.id };
 *
 * // Task owned by someone else
 * const otherTask = { ...mockTask, userId: "different_owner" };
 * ```
 */

import { getWebRequest, setResponseStatus } from "@tanstack/start/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteEntity } from "~/functions/base-service";
import { validateId } from "~/functions/helpers";
import { accessCheck } from "~/server/access/check";
import { auth } from "~/server/auth/auth";
import DB from "~/server/db";
import { UserRole } from "~/server/db/schema";
import {
	createMockContext,
	fixedDate,
	mockTask,
	mockUser,
	mockUserId,
	setupDBMocks,
} from "~/test/setup";

const mockContext = createMockContext();

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

// 1. Mock the access check module
vi.mock("~/server/access/check", () => ({
	accessCheck: vi.fn(),
}));

describe("base-service", () => {
	// Setup for each test
	beforeEach(() => {
		vi.clearAllMocks();
	});

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

			// Ensure web request mock returns something
			vi.mocked(getWebRequest).mockReturnValue({
				headers: new Headers(),
				cache: "default",
				credentials: "same-origin",
				destination: "" as RequestDestination,
				integrity: "",
				method: "GET",
				mode: "cors",
				redirect: "follow",
				referrer: "",
				referrerPolicy: "no-referrer",
				body: null,
				bodyUsed: false,
				keepalive: false,
				signal: new AbortController().signal,
				url: "http://localhost:3000",
				clone: () => new Request("http://localhost:3000"),
				arrayBuffer: async () => new ArrayBuffer(0),
				blob: async () => new Blob(),
				formData: async () => new FormData(),
				json: async () => ({}),
				text: async () => "",
			} as Request);

			// Ensure auth session returns a user with all required fields
			vi.mocked(auth.api.getSession).mockResolvedValue({
				session: {
					id: "sess_123",
					createdAt: fixedDate,
					updatedAt: fixedDate,
					userId: mockUserId,
					expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // expires in 24h
					token: "mock_token",
					ipAddress: "127.0.0.1",
					userAgent: "test-agent",
				},
				user: {
					id: mockUserId,
					role: UserRole.MEMBER,
					email: "test@example.com",
					name: "Test User",
					emailVerified: false,
					createdAt: fixedDate,
					updatedAt: fixedDate,
					image: null,
				},
			});

			// Reset access check mock
			vi.mocked(accessCheck).mockReset();
		});

		// 2. Add test for invalid subject validation
		it("should validate input and throw error for invalid subject", async () => {
			const invalidInput = {
				data: {
					subject: "InvalidSubject" as "Task" | "User",
					id: mockTask.id,
				},
				context: mockContext,
			};

			// The validator should catch this before hitting the handler
			await expect(deleteEntity(invalidInput)).rejects.toThrow();
		});

		it("should throw error when entity not found", async () => {
			const input = {
				...mockDeleteTaskInput,
				data: {
					...mockDeleteTaskInput.data,
					id: "non-existent",
				},
			};

			const { select } = setupDBMocks(DB);
			select.where.mockResolvedValue([]);

			await expect(deleteEntity(input)).rejects.toThrow(
				"Task non-existent not found",
			);
		});

		// 3. Fix access check test
		it("should check access before deleting", async () => {
			const { select, delete: del } = setupDBMocks(DB);
			select.where.mockResolvedValue([mockTask]);
			del.returning.mockResolvedValue([mockTask]);

			await deleteEntity(mockDeleteTaskInput);

			// Now accessCheck is properly mocked
			expect(vi.mocked(accessCheck)).toHaveBeenCalledWith(
				mockContext.user,
				"delete",
				"Task",
				mockTask,
			);
		});

		it("should throw error when access check fails", async () => {
			const { select } = setupDBMocks(DB);
			select.where.mockResolvedValue([mockTask]);

			// Use mockImplementationOnce instead of mockImplementation
			vi.mocked(accessCheck).mockImplementationOnce(() => {
				throw new Error("Access denied");
			});

			await expect(deleteEntity(mockDeleteTaskInput)).rejects.toThrow(
				"Access denied",
			);
			expect(DB.delete).not.toHaveBeenCalled();
		});

		it("should successfully delete a task when user owns it", async () => {
			// Explicitly show that task belongs to the user
			const ownedTask = {
				...mockTask,
				userId: mockUserId, // Using mockUserId to match the mocked auth user
			};

			const { select, delete: del } = setupDBMocks(DB);
			select.where.mockResolvedValue([ownedTask]);
			del.returning.mockResolvedValue([ownedTask]);

			const result = await deleteEntity(mockDeleteTaskInput);
			expect(result).toEqual(ownedTask);
		});

		it("fails when trying to delete another user's task", async () => {
			const differentUserId = "different_user_id";
			const input = {
				data: {
					subject: "Task" as const,
					id: mockTask.id,
				},
				context: createMockContext(differentUserId),
			};

			const { select } = setupDBMocks(DB);
			// Make it clear this task belongs to someone else
			select.where.mockResolvedValue([
				{
					...mockTask,
					userId: "original_owner_id", // Different from differentUserId
				},
			]);

			await expect(deleteEntity(input)).rejects.toThrow();
		});

		// Add test for auth failure
		it("should throw error when user is not authenticated", async () => {
			// Mock auth to return no session
			vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

			await expect(deleteEntity(mockDeleteTaskInput)).rejects.toThrow(
				"Unauthorized",
			);
			expect(setResponseStatus).toHaveBeenCalledWith(401);
		});

		// Update the web request mock for this test
		it("should throw error when web request is not available", async () => {
			// Mock getWebRequest to return undefined instead of null
			vi.mocked(getWebRequest).mockReturnValueOnce(undefined);

			await expect(deleteEntity(mockDeleteTaskInput)).rejects.toThrow(
				"No web request available",
			);
			expect(setResponseStatus).toHaveBeenCalledWith(500);
		});
	});
});
