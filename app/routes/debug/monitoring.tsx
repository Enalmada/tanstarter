import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMonitor } from "~/lib/monitoring/hooks";
import { ErrorBoundary } from "~/lib/monitoring/rollbar";
import type { MonitorUser } from "~/lib/monitoring/types";

function BuggyComponent() {
	const [shouldError, setShouldError] = useState(false);

	if (shouldError) {
		throw new Error("This is a test error from BuggyComponent");
	}

	return (
		<Button onClick={() => setShouldError(true)} color="red">
			Trigger Error Boundary
		</Button>
	);
}

function ErrorFallback() {
	return <Text c="red">Error boundary caught an error!</Text>;
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
		<Container size="sm">
			<Stack gap="xl">
				<Title>Monitoring Debug</Title>

				<Stack>
					<Text fw={700}>User Context Test</Text>
					<Button
						onClick={() => setTestUser(0)}
						color="blue"
						variant={currentUserIndex === 0 ? "filled" : "light"}
					>
						Set Regular User
					</Button>
					<Button
						onClick={() => setTestUser(1)}
						color="blue"
						variant={currentUserIndex === 1 ? "filled" : "light"}
					>
						Set Admin User
					</Button>
					<Button
						onClick={() => setTestUser(null)}
						color="gray"
						variant={currentUserIndex === null ? "filled" : "light"}
					>
						Clear User
					</Button>
				</Stack>

				<Stack>
					<Text fw={700}>Breadcrumb Test</Text>
					<Button onClick={addBreadcrumb} color="green">
						Add Breadcrumb ({breadcrumbCount})
					</Button>
				</Stack>

				<Stack>
					<Text fw={700}>Error Boundary Test</Text>
					<ErrorBoundary fallback={<ErrorFallback />}>
						<BuggyComponent />
					</ErrorBoundary>
				</Stack>

				<Stack>
					<Text fw={700}>Direct Error Tests</Text>
					<Button onClick={triggerError} color="red">
						Trigger Uncaught Error
					</Button>
					<Button onClick={triggerAsyncError} color="red">
						Trigger Async Error
					</Button>
					<Button onClick={triggerApiError} color="red">
						Trigger API Error
					</Button>
				</Stack>

				<Stack>
					<Text fw={700}>Monitor Message Tests</Text>
					<Button onClick={triggerMonitorError} color="red">
						Send Error Message
					</Button>
					<Button onClick={triggerMonitorWarning} color="yellow">
						Send Warning Message
					</Button>
					<Button onClick={triggerMonitorInfo} color="blue">
						Send Info Message
					</Button>
				</Stack>
			</Stack>
		</Container>
	);
}
