import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import type DB from "~/server/db";
import type { Task, User } from "~/server/db/schema";
import { TaskStatus, UserRole } from "~/server/db/schema";

/**
 * Test Setup and Shared Test Data
 *
 * This file provides:
 * 1. Common test data and mock objects used across tests
 * 2. Helper functions for setting up test contexts
 * 3. Mock implementations for external dependencies
 * 4. Global test cleanup
 *
 * Key exports:
 * - mockUser, mockTask: Base test entities
 * - createMockContext: Creates auth context
 * - createMockDBResponse: Mocks DB query responses
 * - setupDBMocks: Sets up common DB mocks
 *
 * Important Testing Patterns:
 * 1. Always use setupDBMocks() for database operations
 * 2. Use vi.mocked() when verifying mock calls
 * 3. Clear mocks in beforeEach with vi.clearAllMocks()
 * 4. Mock external modules at test file level
 *
 * Example Usage:
 * ```ts
 * // Setup
 * const { select, delete: del } = setupDBMocks(DB);
 * select.where.mockResolvedValue([mockTask]);
 * const context = createMockContext(mockUser.id);
 *
 * // Mock external module
 * vi.mock("~/external/module", () => ({
 *   someFunction: vi.fn()
 * }));
 *
 * // Test with mocks
 * const result = await someFunction();
 * expect(vi.mocked(someFunction)).toHaveBeenCalled();
 * ```
 */

// ==================
// Shared Test Data
// ==================
export const mockUserId = "usr_1";
export const fixedDate = new Date("2023-08-28T21:37:27.238Z");

export const baseEntityMock = {
	createdAt: fixedDate,
	createdById: mockUserId,
	updatedAt: fixedDate,
	updatedById: mockUserId,
	version: 1,
};

export const mockUser: User = {
	id: mockUserId,
	email: "test@example.com",
	name: "Test User",
	role: UserRole.MEMBER,
	image: null,
	emailVerified: false,
	...baseEntityMock,
};

export const mockTaskId = "tsk_1";
export const mockTask: Task = {
	id: mockTaskId,
	title: "Task 1",
	description: null,
	dueDate: fixedDate,
	status: TaskStatus.ACTIVE,
	userId: mockUserId,
	...baseEntityMock,
};

// ==================
// Test Helpers
// ==================

// Helper to create a mock context with a user
export const createMockContext = (userId = mockUserId) => ({
	user: {
		id: userId,
		role: UserRole.MEMBER,
		email: "test@example.com",
		name: "Test User",
		emailVerified: false,
		createdAt: fixedDate,
		updatedAt: fixedDate,
		image: null,
	},
});

// Helper to create mock DB responses
export const createMockDBResponse = <T>(data: T | T[]) => {
	const items = Array.isArray(data) ? data : [data];
	return {
		execute: vi.fn().mockResolvedValue(items),
	};
};

// Helper to setup common DB mocks for a test
export const setupDBMocks = (db: typeof DB) => {
	const selectWhere = vi.fn();
	const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
	const select = vi.fn().mockReturnValue({ from: selectFrom });

	const deleteReturning = vi.fn();
	const deleteWhere = vi.fn().mockReturnValue({ returning: deleteReturning });
	const deleteFn = vi.fn().mockReturnValue({ where: deleteWhere });

	vi.mocked(db.select).mockImplementation(select);
	vi.mocked(db.delete).mockImplementation(deleteFn);

	return {
		select: {
			fn: select,
			from: selectFrom,
			where: selectWhere,
		},
		delete: {
			fn: deleteFn,
			where: deleteWhere,
			returning: deleteReturning,
		},
	};
};

// Type definition for server function handlers
export type ServerFnHandler = <TInput, TOutput>(
	fn: (input: TInput) => Promise<TOutput>,
) => (input: TInput) => Promise<TOutput>;

// ==================
// Global Mocks
// ==================

// Mock environment variables
vi.mock("~/env", () => {
	return {
		default: {
			DATABASE_URL: "test-db-url",
			DATABASE_AUTH_TOKEN: "test-token",
			AXIOM_TOKEN: "test-axiom-token",
		},
		buildEnv: {
			isDev: false,
			isProd: true,
		},
		env: {
			DATABASE_URL: "test-db-url",
			DATABASE_AUTH_TOKEN: "test-token",
			AXIOM_TOKEN: "test-axiom-token",
		},
	};
});

// Mock the database module with a more complete implementation
vi.mock("~/server/db", () => ({
	default: {
		select: vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					execute: vi.fn().mockResolvedValue([]),
				}),
				execute: vi.fn().mockResolvedValue([]),
				orderBy: vi.fn().mockReturnValue({
					execute: vi.fn().mockResolvedValue([]),
				}),
			}),
		}),
		insert: vi.fn().mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockReturnValue({
					execute: vi.fn().mockResolvedValue([]),
				}),
			}),
		}),
		update: vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockReturnValue({
						execute: vi.fn().mockResolvedValue([]),
					}),
				}),
			}),
		}),
		delete: vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockReturnValue({
					execute: vi.fn().mockResolvedValue([]),
				}),
			}),
		}),
		query: {
			TaskTable: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			UserTable: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
		},
	},
}));

// Mock virtual:serwist
vi.mock("virtual:serwist", () => ({
	getSerwist: () => ({
		register: vi.fn(),
		unregister: vi.fn(),
	}),
}));

// Mock server functions with a more complete implementation
vi.mock("@tanstack/react-start", () => {
	const mockHandler = vi.fn().mockImplementation((fn) => {
		return async (input: Record<string, unknown>) => {
			const contextWithUser = {
				...input,
				context: {
					user: {
						id: mockUserId,
						role: UserRole.MEMBER,
						email: "test@example.com",
						name: "Test User",
						emailVerified: false,
						createdAt: fixedDate,
						updatedAt: fixedDate,
					},
				},
			};
			return fn(contextWithUser);
		};
	});

	return {
		createServerFn: vi.fn().mockImplementation(() => ({
			handler: mockHandler,
			// biome-ignore lint/suspicious/noExplicitAny: Schema types are inherently any
			validator: (schema: any) => ({
				handler:
					(
						handler: (params: {
							data: unknown;
							context: unknown;
						}) => Promise<unknown>,
					) =>
					async (input: { data: unknown; context: unknown }) => {
						// Handle specific schema validations
						if (schema?.name === "validateDeleteEntity") {
							const { subject } = input.data as { subject: string };
							if (subject !== "Task" && subject !== "User") {
								throw new Error("Invalid input");
							}
						}
						// Always include context with user
						const inputWithContext = {
							...input,
						};
						return handler(inputWithContext);
					},
			}),
		})),
		createMiddleware: () => ({
			server: (
				fn: (params: { next: () => Promise<unknown> }) => Promise<unknown>,
			) => {
				return async (params: { next: () => Promise<unknown> }) => {
					return fn(params);
				};
			},
		}),
	};
});

// Add auth mock near the other global mocks
vi.mock("~/server/auth/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn().mockResolvedValue({
				session: {
					id: "sess_123",
					createdAt: fixedDate,
					updatedAt: fixedDate,
					userId: mockUserId,
					expiresAt: fixedDate,
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
			}),
		},
	},
}));

// Add web request mock
vi.mock("@tanstack/react-start/server", () => ({
	getWebRequest: vi.fn().mockReturnValue({
		headers: new Headers(),
	}),
	setResponseStatus: vi.fn(),
}));

// ==================
// Cleanup
// ==================
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});
