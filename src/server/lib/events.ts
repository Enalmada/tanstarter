import { createEventBroadcaster } from "@enalmada/start-streaming/server";

// Create event broadcaster (memory for development)
export const broadcaster = createEventBroadcaster({
	type: "memory",
	maxListeners: 100,
});

// Event types
export type NotificationEvent = {
	type: "notification";
	message: string;
	count: number;
	timestamp: number;
};

// Domain-specific subscription
export async function* subscribeToNotifications(): AsyncGenerator<NotificationEvent> {
	const channel = "notifications";
	yield* broadcaster.subscribe<NotificationEvent>(channel);
}

// Domain-specific publish
export function publishNotification(message: string, count: number): void {
	const event: NotificationEvent = {
		type: "notification",
		message,
		count,
		timestamp: Date.now(),
	};
	broadcaster.publish("notifications", event);
}
