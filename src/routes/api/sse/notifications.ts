/**
 * SSE Notifications API Endpoint
 *
 * Provides a Server-Sent Events (SSE) endpoint for real-time notifications.
 * Clients connect via EventSource API and receive live updates.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createSession } from "better-sse";
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
					// Create SSE session from request using Fetch API
					// better-sse automatically handles:
					// - Setting appropriate headers (text/event-stream)
					// - Connection keep-alive
					// - Proper event formatting
					const session = await createSession(request);

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
					// This is critical for preventing memory leaks
					session.once("disconnected", () => {
						notificationChannel.deregister(session);
					});

					// Return the Response object from the session
					// This contains the SSE stream that will be sent to the client
					return session.getResponse();
				} catch (_error) {
					return new Response("Failed to establish SSE connection", {
						status: 500,
					});
				}
			},
		},
	},
});
