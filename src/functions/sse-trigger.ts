/**
 * SSE Trigger Server Function
 *
 * Server function to manually trigger notifications for testing.
 * Broadcasts to all connected SSE clients via the notification channel.
 */

import { createServerFn } from "@tanstack/react-start";

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
export async function handleTriggerSSENotification() {
	// Dynamic import — sse-channel pulls @enalmada/start-streaming/server
	// (server-only entrypoint) and must not leak into the client bundle (TSS-2).
	const { incrementNotificationCount, publishNotification } = await import("~/server/lib/sse-channel");
	const count = incrementNotificationCount();
	publishNotification(`Notification #${count}`, count);

	return {
		success: true,
		count,
	};
}

export const triggerSSENotification = createServerFn({ method: "POST" }).handler(handleTriggerSSENotification);
