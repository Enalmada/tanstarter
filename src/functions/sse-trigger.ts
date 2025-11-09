/**
 * SSE Trigger Server Function
 *
 * Server function to manually trigger notifications for testing.
 * Broadcasts to all connected SSE clients via the notification channel.
 */

import { createServerFn } from "@tanstack/react-start";
import { incrementNotificationCount, publishNotification } from "~/server/lib/sse-channel";

/**
 * Server function to trigger a new notification
 *
 * Publishes a notification event to all connected SSE clients.
 * Increments the demo counter and broadcasts to all subscribers.
 *
 * @returns Success status and current notification count
 *
 * @example
 * // Client usage:
 * const result = await triggerSSENotification();
 * console.log('Triggered notification #', result.count);
 */
export const triggerSSENotification = createServerFn({ method: "POST" }).handler(async () => {
	const count = incrementNotificationCount();
	publishNotification(`Notification #${count}`, count);

	return {
		success: true,
		count,
	};
});
