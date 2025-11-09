/**
 * SSE Notifications API Endpoint
 *
 * Provides a Server-Sent Events (SSE) endpoint for real-time notifications.
 * Clients connect via EventSource API and receive live updates.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createResponse } from "better-sse";
import { notificationChannel } from "~/server/lib/sse-channel";

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
export const Route = createFileRoute("/api/sse/notifications" as any)({
	server: {
		handlers: {
			GET: async ({ request }) => {
				try {
					// Create SSE response using better-sse's Fetch API helper
					// The callback is invoked once the session is connected and active
					return createResponse(request, (session) => {
						// Register session to broadcast channel
						// All events sent to the channel will be forwarded to this session
						notificationChannel.register(session);

						// Send initial connection confirmation
						session.push(
							{
								type: "notification",
								message: "Connected to notification stream",
								count: 0,
								timestamp: Date.now(),
							},
							"message",
						);

						// Handle cleanup when client disconnects
						// Note: better-sse auto-deregisters on disconnect, but we explicitly
						// deregister here for clarity and defensive programming
						session.once("disconnected", () => {
							notificationChannel.deregister(session);
						});
					});
				} catch (error) {
					return new Response(
						`Failed to establish SSE connection: ${error instanceof Error ? error.message : String(error)}`,
						{
							status: 500,
						},
					);
				}
			},
		},
	},
});
