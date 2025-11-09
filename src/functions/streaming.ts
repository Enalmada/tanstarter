import { createServerFn } from "@tanstack/react-start";
import { publishNotification, subscribeToNotifications } from "~/server/lib/events";

// Server function to subscribe to notifications (streaming)
export const watchNotifications = createServerFn({ method: "POST" }).handler(async function* () {
	const subscription = subscribeToNotifications();
	for await (const event of subscription) {
		yield event;
	}
});

// Server function to trigger a notification
let notificationCount = 0;

export const triggerNotification = createServerFn({ method: "POST" }).handler(async () => {
	notificationCount++;
	publishNotification(`Notification #${notificationCount}`, notificationCount);
	return { success: true, count: notificationCount };
});
