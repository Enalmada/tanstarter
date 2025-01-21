import { useLayoutEffect } from "react";
import { initializeAnalytics, usePageView } from "~/utils/analytics";

export function AnalyticsProvider() {
	useLayoutEffect(() => {
		initializeAnalytics();
	}, []);

	// Track page views
	usePageView();

	return null;
}
