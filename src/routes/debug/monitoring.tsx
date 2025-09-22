import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useMonitor } from "~/lib/monitoring/hooks";
import { ErrorBoundary } from "~/lib/monitoring/rollbar";
import type { MonitorUser } from "~/lib/monitoring/types";

function BuggyComponent() {
	const [shouldError, setShouldError] = useState(false);

	if (shouldError) {
		throw new Error("This is a test error from BuggyComponent");
	}

	return (
		<Button onClick={() => setShouldError(true)} variant="destructive">
			Trigger Error Boundary
		</Button>
	);
}

function ErrorFallback() {
	return <p className="text-destructive">Error boundary caught an error!</p>;
}

export const Route = createFileRoute("/debug/monitoring")({
	component: MonitoringDebug,
});

const testUsers: MonitorUser[] = [
	{
		id: "1",
		email: "test@example.com",
		name: "Test User",
		role: "user",
	},
	{
		id: "2",
		email: "admin@example.com",
		name: "Admin User",
		role: "admin",
	},
];

function MonitoringDebug() {
	const monitor = useMonitor();
	const [currentUserIndex, setCurrentUserIndex] = useState<number | null>(null);
	const [breadcrumbCount, setBreadcrumbCount] = useState(0);

	const triggerError = () => {
		throw new Error("Test error from button click");
	};

	const triggerMonitorError = () => {
		monitor.error("Test error message", { source: "manual test" });
	};

	const triggerMonitorWarning = () => {
		monitor.warn("Test warning message", { source: "manual test" });
	};

	const triggerMonitorInfo = () => {
		monitor.info("Test info message", { source: "manual test" });
	};

	const triggerAsyncError = async () => {
		try {
			monitor.breadcrumb("Starting async operation");
			await Promise.reject(new Error("Test async error"));
		} catch (error) {
			monitor.breadcrumb("Async operation failed");
			monitor.error("Async error caught:", error);
			throw error;
		}
	};

	const triggerApiError = async () => {
		try {
			monitor.breadcrumb("Starting API call");
			await fetch("/api/non-existent-endpoint");
		} catch (error) {
			monitor.breadcrumb("API call failed");
			monitor.error("API error caught:", error);
			throw error;
		}
	};

	const setTestUser = (index: number | null) => {
		monitor.breadcrumb("Changing test user", { index });
		setCurrentUserIndex(index);
		monitor.setUser(index === null ? null : testUsers[index]);
	};

	const addBreadcrumb = () => {
		const count = breadcrumbCount + 1;
		setBreadcrumbCount(count);
		monitor.breadcrumb(`Test breadcrumb ${count}`, {
			count,
			timestamp: new Date().toISOString(),
		});
	};

	return (
		<div className="container max-w-2xl mx-auto py-8">
			<div className="flex flex-col gap-8">
				<h1 className="text-3xl font-bold tracking-tight">Monitoring Debug</h1>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">User Context Test</h2>
					<Button
						onClick={() => setTestUser(0)}
						variant={currentUserIndex === 0 ? "default" : "secondary"}
					>
						Set Regular User
					</Button>
					<Button
						onClick={() => setTestUser(1)}
						variant={currentUserIndex === 1 ? "default" : "secondary"}
					>
						Set Admin User
					</Button>
					<Button
						onClick={() => setTestUser(null)}
						variant={currentUserIndex === null ? "default" : "secondary"}
					>
						Clear User
					</Button>
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">Breadcrumb Test</h2>
					<Button onClick={addBreadcrumb}>
						Add Breadcrumb ({breadcrumbCount})
					</Button>
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">Error Boundary Test</h2>
					<ErrorBoundary fallback={<ErrorFallback />}>
						<BuggyComponent />
					</ErrorBoundary>
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">Direct Error Tests</h2>
					<Button onClick={triggerError} variant="destructive">
						Trigger Uncaught Error
					</Button>
					<Button onClick={triggerAsyncError} variant="destructive">
						Trigger Async Error
					</Button>
					<Button onClick={triggerApiError} variant="destructive">
						Trigger API Error
					</Button>
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">Monitor Message Tests</h2>
					<Button onClick={triggerMonitorError} variant="destructive">
						Send Error Message
					</Button>
					<Button onClick={triggerMonitorWarning} variant="outline">
						Send Warning Message
					</Button>
					<Button onClick={triggerMonitorInfo}>Send Info Message</Button>
				</div>
			</div>
		</div>
	);
}
