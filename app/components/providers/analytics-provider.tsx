import { useEffect } from "react";
import { initializeAnalytics } from "~/utils/analytics";

export function AnalyticsProvider() {
	useEffect(() => {
		initializeAnalytics();
	}, []);

	return null;
}
