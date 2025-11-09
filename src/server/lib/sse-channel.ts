/**
 * SSE Channel Infrastructure
 *
 * Provides a shared broadcast channel for server-sent events.
 * Uses better-sse library for standards-compliant SSE implementation.
 */

import type { Channel } from "better-sse";
import { createChannel } from "better-sse";

/**
 * Notification event structure
 */
export type NotificationEvent = {
	type: "notification";
	message: string;
	count: number;
	timestamp: number;
};

/**
 * Global notification channel for broadcasting to all connected clients
 *
 * In-memory channel that broadcasts notification events to all active SSE sessions.
 * For production multi-server deployments, consider using Redis pub/sub instead.
 *
 * @example
 * // Broadcasting to all connected clients:
 * notificationChannel.broadcast({
 *   type: "notification",
 *   message: "New update available",
 *   count: 42,
 *   timestamp: Date.now()
 * }, "message");
 */
export const notificationChannel: Channel<NotificationEvent> = createChannel();

/**
 * Demo-only: Sequential notification counter
 *
 * WARNING: This is stored in-memory and will:
 * - Reset to 0 on server restart
 * - Not work correctly with multiple server instances
 * - Not be thread-safe under high concurrency
 *
 * For production, use:
 * - Database with auto-incrementing IDs
 * - Redis INCR command
 * - Distributed counter service
 */
export let notificationCount = 0;

/**
 * Increment and return the notification counter
 *
 * @returns The new count value
 */
export function incrementNotificationCount(): number {
	return ++notificationCount;
}

/**
 * Publish a notification event to all connected clients
 *
 * @param message - Human-readable notification message
 * @param count - Sequential notification counter
 *
 * @example
 * publishNotification("New comment added", 42);
 */
export function publishNotification(message: string, count: number): void {
	const event: NotificationEvent = {
		type: "notification",
		message,
		count,
		timestamp: Date.now(),
	};

	// Broadcast to all connected SSE sessions
	notificationChannel.broadcast(event, "message");
}
