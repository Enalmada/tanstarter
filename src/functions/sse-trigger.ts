/**
 * SSE Trigger Server Function
 *
 * Server function to manually trigger notifications for testing.
 * Broadcasts to all connected SSE clients via the notification channel.
 */

import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { authMiddleware } from "~/functions/auth-middleware";

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
export const handleTriggerSSENotification = createServerOnlyFn(async () => {
	// Dynamic import — sse-channel pulls @enalmada/start-streaming/server
	// (server-only entrypoint) and must not leak into the client bundle (TSS-2).
	const { incrementNotificationCount, publishNotification } = await import("~/server/lib/sse-channel");
	const count = incrementNotificationCount();
	publishNotification(`Notification #${count}`, count);

	return {
		success: true,
		count,
	};
});

// Broadcasts to every connected listener, so signed-in users only.
export const triggerSSENotification = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.handler(handleTriggerSSENotification);
