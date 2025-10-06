import { eq } from "drizzle-orm";
import db from "~/server/db";
import { type UserRole, UserTable } from "~/server/db/schema";

/**
 * Data access layer for user-related database operations.
 * This file isolates ORM queries from business logic.
 */

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * Get user by ID
 * @param userId - User ID to fetch
 * @returns User object or undefined if not found
 */
export async function getUserById(userId: string) {
	return db.select().from(UserTable).where(eq(UserTable.id, userId)).limit(1);
}

// ============================================================================
// WRITE OPERATIONS
// ============================================================================

/**
 * Update user role and metadata
 * @param userId - User ID to update
 * @param role - New role to assign
 * @param updatedById - ID of user making the update
 * @returns Updated user object
 */
export async function updateUserRole(userId: string, role: UserRole, updatedById: string) {
	return db
		.update(UserTable)
		.set({
			role,
			updatedAt: new Date(),
			updatedById,
		})
		.where(eq(UserTable.id, userId))
		.returning();
}
