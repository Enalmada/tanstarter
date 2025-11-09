import { createEventBroadcaster } from "@enalmada/start-streaming/server";
import type { NotificationEvent, WatchNotificationsInput } from "./events.types";

// Re-export types for convenience
export type { NotificationEvent, WatchNotificationsInput };

/**
 * Event broadcaster for real-time notifications
 * Uses in-memory EventEmitter for development/single-server deployments
 *
 * For production multi-server deployments, use Redis:
 * @example
 * createEventBroadcaster({
 *   type: 'redis',
 *   url: process.env.UPSTASH_REDIS_URL!,
 *   token: process.env.UPSTASH_REDIS_TOKEN!,
 * })
 */
export const broadcaster = createEventBroadcaster({
	type: "memory",
	maxListeners: 100,
});

/**
 * Subscribe to notification events
 *
 * Returns an async generator that yields NotificationEvent objects
 * as they are published. Automatically cleans up EventEmitter listener
 * when the generator is closed.
 *
 * @returns Async generator yielding notification events
 *
 * @example
 * const subscription = subscribeToNotifications();
 * for await (const event of subscription) {
 *   console.log('New notification:', event.message);
 * }
 */
export async function* subscribeToNotifications(): AsyncGenerator<NotificationEvent> {
	const channel = "notifications";
	yield* broadcaster.subscribe<NotificationEvent>(channel);
}

/**
 * Publish a notification event to all subscribers
 *
 * Broadcasts the notification to all active streaming connections.
 * Uses EventEmitter for in-memory pub/sub.
 *
 * @param message - Human-readable notification message
 * @param count - Sequential notification counter
 *
 * @example
 * publishNotification('New comment added', 42);
 */
export function publishNotification(message: string, count: number): void {
	const event: NotificationEvent = {
		type: "notification",
		message,
		count,
		timestamp: Date.now(),
	};
	broadcaster.publish("notifications", event);
}
