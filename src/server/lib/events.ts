import { createEventBroadcaster } from "@enalmada/start-streaming/server";

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
 * Input type for watchNotifications server function
 * Currently empty as notifications are global, but typed for consistency
 */
export type WatchNotificationsInput = Record<string, never>;

/**
 * Event emitted when a notification is published
 */
export type NotificationEvent = {
	/** Event type discriminator */
	type: "notification";
	/** Human-readable notification message */
	message: string;
	/** Sequential notification counter */
	count: number;
	/** Unix timestamp (milliseconds) when notification was created */
	timestamp: number;
};

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
