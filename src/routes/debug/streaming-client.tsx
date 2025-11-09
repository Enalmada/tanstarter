import { useAutoReconnectStream } from "@enalmada/start-streaming/client";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { triggerNotification, watchNotifications } from "~/functions/streaming";

export default function StreamingClient() {
	const [notifications, setNotifications] = useState<
		Array<{
			type: string;
			message: string;
			count: number;
			timestamp: number;
		}>
	>([]);
	const [isTriggering, setIsTriggering] = useState(false);

	// Set up streaming connection
	const stream = useAutoReconnectStream({
		streamFn: watchNotifications,
		params: {} as never,
		pauseOnHidden: true,

		// Handle incoming events
		onData: (event: { type: string; message: string; count: number; timestamp: number }) => {
			setNotifications((prev) => [event, ...prev].slice(0, 10)); // Keep last 10
		},

		onConnect: () => {},

		onDisconnect: () => {},

		onError: (error: Error, attempt: number) => {},

		maxRetries: 10,
		baseDelay: 1000,
		maxDelay: 30000,
	});

	const handleTrigger = async () => {
		setIsTriggering(true);
		try {
			await triggerNotification();
		} finally {
			setIsTriggering(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto">
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h1 className="text-3xl font-bold mb-2">Real-time Streaming Demo</h1>
					<p className="text-gray-600 mb-6">
						Powered by <code className="bg-gray-100 px-2 py-1 rounded text-sm">@enalmada/start-streaming</code>
					</p>

					{/* Connection Status */}
					<div className="mb-6 p-4 bg-gray-50 rounded border">
						<h2 className="font-semibold mb-2">Connection Status</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div>
								<span className="text-gray-600">Connected:</span>
								<span className={`ml-2 font-semibold ${stream.isConnected ? "text-green-600" : "text-red-600"}`}>
									{stream.isConnected ? "✓ Yes" : "✗ No"}
								</span>
							</div>
							<div>
								<span className="text-gray-600">Reconnecting:</span>
								<span className={`ml-2 font-semibold ${stream.isReconnecting ? "text-yellow-600" : "text-gray-400"}`}>
									{stream.isReconnecting ? "⟳ Yes" : "—"}
								</span>
							</div>
							<div>
								<span className="text-gray-600">Attempts:</span>
								<span className="ml-2 font-semibold">{stream.reconnectAttempt}</span>
							</div>
							<div>
								<span className="text-gray-600">Error:</span>
								<span className={`ml-2 font-semibold ${stream.error ? "text-red-600" : "text-gray-400"}`}>
									{stream.error ? "✗ Error" : "—"}
								</span>
							</div>
						</div>
					</div>

					{/* Trigger Button */}
					<div className="mb-6">
						<Button
							type="button"
							onClick={handleTrigger}
							disabled={isTriggering}
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
										key={notification.timestamp}
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
							<li>Uses TanStack Start's native async generator streaming</li>
							<li>NDJSON format over HTTP (not EventSource/SSE)</li>
							<li>Auto-reconnection with exponential backoff + jitter</li>
							<li>Pauses when tab is hidden (Page Visibility API)</li>
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
