import { useLayoutEffect } from "react";
import { initializeAnalytics } from "~/utils/analytics";

export function AnalyticsProvider() {
	useLayoutEffect(() => {
		initializeAnalytics();
	}, []);

	return null;
}
