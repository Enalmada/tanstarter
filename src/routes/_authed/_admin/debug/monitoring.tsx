import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "~/components/ui/button";
import { throwExpectedServerError, throwUnexpectedServerError } from "~/functions/debug-monitoring";
import { useMonitor } from "~/lib/monitoring/hooks";
import { reportError } from "~/lib/monitoring/report";

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

export const Route = createFileRoute("/_authed/_admin/debug/monitoring")({
	component: MonitoringDebug,
});

function MonitoringDebug() {
	const monitor = useMonitor();
	const [stepCount, setStepCount] = useState(0);
	const [serverResult, setServerResult] = useState<string | null>(null);

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
		monitor.breadcrumb("Starting async operation");
		// Unhandled rejection: PostHog autocapture reports it
		await Promise.reject(new Error("Test async error"));
	};

	const triggerCaughtError = async () => {
		try {
			monitor.breadcrumb("Starting API call");
			const response = await fetch("/api/non-existent-endpoint");
			if (!response.ok) throw new Error(`API returned ${response.status}`);
		} catch (error) {
			monitor.error("API error caught:", error);
		}
	};

	const callServer = async (fn: () => Promise<unknown>, label: string) => {
		try {
			await fn();
			setServerResult(`${label}: no error`);
		} catch (error) {
			setServerResult(`${label}: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
		}
	};

	const addStep = () => {
		const count = stepCount + 1;
		setStepCount(count);
		monitor.breadcrumb(`Test step ${count}`, { count });
	};

	return (
		<div className="container max-w-2xl mx-auto py-8">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<h1 className="text-3xl font-bold tracking-tight">Monitoring Debug</h1>
					<p className="text-sm text-muted-foreground">
						Errors go to PostHog when <code>PUBLIC_POSTHOG_API_KEY</code> is set and <code>APP_ENV</code> isn't{" "}
						<code>development</code>. Watch for <code>$exception</code> requests in the network tab.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">Exception Steps</h2>
					<p className="text-sm text-muted-foreground">Attached to the next captured exception.</p>
					<Button onClick={addStep}>Add Step ({stepCount})</Button>
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">Error Boundary Test</h2>
					<ErrorBoundary
						fallback={<ErrorFallback />}
						onError={(error) => reportError(error, { source: "debug-boundary" })}
					>
						<BuggyComponent />
					</ErrorBoundary>
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">Direct Error Tests</h2>
					<Button onClick={triggerError} variant="destructive">
						Trigger Uncaught Error
					</Button>
					<Button onClick={triggerAsyncError} variant="destructive">
						Trigger Unhandled Rejection
					</Button>
					<Button onClick={triggerCaughtError} variant="destructive">
						Trigger Caught API Error
					</Button>
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">Server Function Tests (admin only)</h2>
					<Button onClick={() => callServer(() => throwUnexpectedServerError(), "Unexpected")} variant="destructive">
						Throw Unexpected Server Error (reported)
					</Button>
					<Button onClick={() => callServer(() => throwExpectedServerError(), "Expected")} variant="outline">
						Throw Expected 404 (not reported)
					</Button>
					{serverResult ? <p className="text-sm text-muted-foreground">{serverResult}</p> : null}
				</div>

				<div className="flex flex-col gap-4">
					<h2 className="font-bold">Monitor Message Tests</h2>
					<Button onClick={triggerMonitorError} variant="destructive">
						Send Error Message
					</Button>
					<Button onClick={triggerMonitorWarning} variant="outline">
						Send Warning Message
					</Button>
					<Button onClick={triggerMonitorInfo}>Send Info Message (step)</Button>
				</div>
			</div>
		</div>
	);
}
