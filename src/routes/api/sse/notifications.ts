/**
 * SSE Notifications API Endpoint
 *
 * Provides a Server-Sent Events (SSE) endpoint for real-time notifications.
 * Clients connect via EventSource API and receive live updates.
 */

import { createSSERouteHandler } from "@enalmada/start-streaming/server";
import { createFileRoute } from "@tanstack/react-router";
import { type NotificationEvent, notificationChannels } from "~/server/lib/sse-channel";

/**
 * SSE endpoint route configuration
 *
 * GET /api/sse/notifications - Establishes SSE connection
 *
 * Usage:
 * ```typescript
 * const eventSource = new EventSource("/api/sse/notifications");
 * eventSource.onmessage = (event) => {
 *   const notification = JSON.parse(event.data);
 *   console.log(notification);
 * };
 * ```
 */
export const Route = createFileRoute("/api/sse/notifications")({
	server: {
		handlers: {
			GET: createSSERouteHandler<Record<string, never>, NotificationEvent>({
				getChannel: () => notificationChannels.getChannel("global"),
				validateParams: () => true,
				getInitialEvent: () => ({
					type: "notification" as const,
					message: "Connected to notification stream",
					count: 0,
					timestamp: Date.now(),
				}),
			}),
		},
	},
});
