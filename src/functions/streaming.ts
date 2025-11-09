import { createServerFn } from "@tanstack/react-start";
import { publishNotification, subscribeToNotifications } from "~/server/lib/events";

// Server function to subscribe to notifications (streaming)
export const watchNotifications = createServerFn({ method: "POST" }).handler(async function* () {
	const subscription = subscribeToNotifications();

	try {
		// Yield events as they arrive from the subscription
		for await (const event of subscription) {
			yield event;
		}
	} finally {
		// Ensure proper cleanup when client disconnects or generator is closed
		// This triggers the finally block in the broadcaster's subscribe method
		await subscription.return(undefined);
	}
});

// Server function to trigger a notification
let notificationCount = 0;

export const triggerNotification = createServerFn({ method: "POST" }).handler(async () => {
	notificationCount++;
	publishNotification(`Notification #${notificationCount}`, notificationCount);
	return { success: true, count: notificationCount };
});
