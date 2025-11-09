import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

export const Route = createFileRoute("/debug/streaming")({
	component: StreamingDebugPage,
});

// Lazy load the client component to avoid SSR issues
const StreamingClient = lazy(() => import("./streaming-client"));

function StreamingDebugPage() {
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
						<h1 className="text-3xl font-bold mb-2">Real-time Streaming Demo</h1>
						<p className="text-gray-600">Loading streaming demo...</p>
					</div>
				</div>
			</div>
		);
	}

	// Client-side only component with Suspense
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50 p-8">
					<div className="max-w-4xl mx-auto">
						<div className="bg-white rounded-lg shadow-lg p-6">
							<h1 className="text-3xl font-bold mb-2">Real-time Streaming Demo</h1>
							<p className="text-gray-600">Loading...</p>
						</div>
					</div>
				</div>
			}
		>
			<StreamingClient />
		</Suspense>
	);
}
