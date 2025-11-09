/**
 * SSE Streaming Demo Page
 *
 * Demonstrates Server-Sent Events (SSE) using @enalmada/start-streaming library.
 * Uses native browser EventSource API for simple, standards-compliant streaming.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { triggerSSENotification } from "~/functions/sse-trigger";
import type { NotificationEvent } from "~/server/lib/sse-channel";

export const Route = createFileRoute("/debug/streaming-sse")({
	component: StreamingSSEPage,
});

/**
 * SSE demo page component
 *
 * Demonstrates SSR-safe streaming with proper hydration.
 * Only renders streaming component on client-side to avoid
 * calling hooks during SSR.
 */
function StreamingSSEPage() {
	const [isClient, setIsClient] = useState(false);

	// Only render streaming component on client-side
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Show loading state during SSR
	if (!isClient) {
		return (
			<div className="min-h-screen bg-gray-50 p-8">
				<div className="max-w-4xl mx-auto">
					<div className="bg-white rounded-lg shadow-lg p-6">
						<h1 className="text-3xl font-bold mb-2">SSE Streaming Demo</h1>
						<p className="text-gray-600">Loading streaming demo...</p>
					</div>
				</div>
			</div>
		);
	}

	// Client-side only rendering
	return <SSEClient />;
}

/**
 * Client-only SSE component
 *
 * Manages real-time notification stream using native EventSource API.
 * Automatically reconnects on disconnect (built into EventSource).
 */
function SSEClient() {
	const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
	const [isTriggering, setIsTriggering] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Set up EventSource connection
	useEffect(() => {
		// Native browser EventSource API
		// Automatically handles:
		// - SSE protocol parsing
		// - Automatic reconnection with exponential backoff
		// - Connection keep-alive
		const eventSource = new EventSource("/api/sse/notifications");

		// Connection opened
		eventSource.onopen = () => {
			setIsConnected(true);
			setError(null);
		};

		// Message received
		eventSource.onmessage = (event) => {
			try {
				const notification: NotificationEvent = JSON.parse(event.data);
				setNotifications((prev) => [notification, ...prev].slice(0, 10)); // Keep last 10
			} catch (_err) {}
		};

		// Error occurred
		eventSource.onerror = (err) => {
			setIsConnected(false);
			setError("Connection lost. Reconnecting...");
			// EventSource automatically attempts to reconnect
		};

		// Cleanup on unmount
		return () => {
			eventSource.close();
		};
	}, []);

	const handleTrigger = async () => {
		setIsTriggering(true);
		try {
			await triggerSSENotification();
		} catch (_err) {
		} finally {
			setIsTriggering(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto">
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h1 className="text-3xl font-bold mb-2">SSE Streaming Demo</h1>
					<p className="text-gray-600 mb-6">
						Powered by <code className="bg-gray-100 px-2 py-1 rounded text-sm">@enalmada/start-streaming</code>
					</p>

					{/* Connection Status */}
					<div className="mb-6 p-4 bg-gray-50 rounded border">
						<h2 className="font-semibold mb-2">Connection Status</h2>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-gray-600">Connected:</span>
								<span className={`ml-2 font-semibold ${isConnected ? "text-green-600" : "text-red-600"}`}>
									{isConnected ? "✓ Yes" : "✗ No"}
								</span>
							</div>
							<div>
								<span className="text-gray-600">Status:</span>
								<span className={`ml-2 font-semibold ${error ? "text-red-600" : "text-gray-400"}`}>
									{error || "Ready"}
								</span>
							</div>
						</div>
					</div>

					{/* Trigger Button */}
					<div className="mb-6">
						<Button
							type="button"
							onClick={handleTrigger}
							disabled={isTriggering || !isConnected}
							className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
						>
							{isTriggering ? "Triggering..." : "Trigger Notification"}
						</Button>
						<p className="text-sm text-gray-600 mt-2">
							Click to trigger a notification. All connected clients will see it instantly.
						</p>
					</div>

					{/* Notifications List */}
					<div>
						<h2 className="font-semibold mb-3">Live Notifications ({notifications.length})</h2>
						{notifications.length === 0 ? (
							<div className="text-gray-500 italic p-4 bg-gray-50 rounded">
								No notifications yet. Click "Trigger Notification" to see live updates.
							</div>
						) : (
							<div className="space-y-2">
								{notifications.map((notification) => (
									<div
										key={`${notification.timestamp}-${notification.count}`}
										className="p-4 bg-blue-50 border-l-4 border-blue-600 rounded animate-fadeIn"
									>
										<div className="flex justify-between items-start">
											<div>
												<p className="font-semibold text-blue-900">{notification.message}</p>
												<p className="text-sm text-gray-600">Count: {notification.count}</p>
											</div>
											<span className="text-xs text-gray-500">
												{new Date(notification.timestamp).toLocaleTimeString()}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Technical Details */}
					<div className="mt-8 p-4 bg-gray-50 rounded border">
						<h2 className="font-semibold mb-2">How It Works</h2>
						<ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
							<li>Uses native browser EventSource API (Web Standard)</li>
							<li>Server-Sent Events (SSE) over HTTP</li>
							<li>Automatic reconnection built into browser</li>
							<li>@enalmada/start-streaming library for TanStack Start SSE integration</li>
							<li>Full TypeScript type safety end-to-end</li>
						</ul>
						<a
							href="https://github.com/Enalmada/start-streaming"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline text-sm mt-2 inline-block"
						>
							Learn more →
						</a>
					</div>
				</div>
			</div>

			{/* Simple CSS animation */}
			<style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
		</div>
	);
}
