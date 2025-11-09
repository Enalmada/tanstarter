/**
 * Streaming Server Functions
 *
 * TanStack Start async generators for real-time notification streaming.
 * Demonstrates proper input validation, cleanup, and type safety.
 */

import { createServerFn } from "@tanstack/react-start";
import {
	type NotificationEvent,
	publishNotification,
	subscribeToNotifications,
	type WatchNotificationsInput,
} from "~/server/lib/events";

/**
 * Validate input for watchNotifications
 *
 * @param data - Raw input data to validate
 * @returns Validated input object (empty object as no params required)
 * @throws Error if validation fails
 */
function validateWatchNotificationsInput(data: unknown): WatchNotificationsInput {
	// Accept null/undefined and convert to empty object (no params needed for global notifications)
	if (data === null || data === undefined) {
		return {};
	}

	// Ensure it's an object if provided
	if (typeof data !== "object") {
		throw new Error("Invalid input: expected object, null, or undefined");
	}

	// Currently no required fields, but validate structure
	return {};
}

/**
 * Handler for watchNotifications streaming
 *
 * Async generator that yields NotificationEvent objects as they occur.
 * Automatically cleans up subscription when client disconnects.
 *
 * @param params - Handler parameters with validated data
 * @returns AsyncGenerator yielding notification events
 */
async function* handleWatchNotifications({ data }: { data: WatchNotificationsInput }) {
	const subscription = subscribeToNotifications();

	try {
		// Yield events as they arrive from the subscription
		for await (const event of subscription) {
			yield event satisfies NotificationEvent;
		}
	} finally {
		// Ensure proper cleanup when client disconnects or generator is closed
		// This triggers the finally block in the broadcaster's subscribe method
		await subscription.return(undefined);
	}
}

/**
 * Server function that streams notification events
 *
 * Establishes a long-lived HTTP connection using NDJSON format.
 * Automatically reconnects on disconnect with exponential backoff.
 *
 * @example
 * // Client usage:
 * const stream = useAutoReconnectStream({
 *   streamFn: watchNotifications,
 *   params: {},
 *   onData: (event) => {
 *     console.log('New notification:', event.message);
 *   },
 * });
 */
export const watchNotifications = createServerFn({ method: "POST" })
	.inputValidator(validateWatchNotificationsInput)
	.handler(handleWatchNotifications);

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
let notificationCount = 0;

/**
 * Server function to trigger a new notification
 *
 * Publishes a notification event to all connected streaming clients.
 * Increments the demo counter and broadcasts to all subscribers.
 *
 * @returns Success status and current notification count
 *
 * @example
 * // Client usage:
 * const result = await triggerNotification();
 * console.log('Triggered notification #', result.count);
 */
export const triggerNotification = createServerFn({ method: "POST" }).handler(async () => {
	notificationCount++;
	publishNotification(`Notification #${notificationCount}`, notificationCount);
	return { success: true, count: notificationCount };
});
