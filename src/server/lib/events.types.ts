/**
 * Type definitions for event system
 *
 * Separated from implementation to avoid importing Node.js modules in client code
 */

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
