import { Divider } from "@nextui-org/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardIndex,
});

function DashboardIndex() {
	return (
		<div className="flex flex-col gap-4">
			<h2 className="text-2xl font-semibold">Dashboard Overview</h2>
			<Divider />
			<p className="text-default-600">
				Welcome to your dashboard! This is a protected page at:
			</p>
			<code className="rounded-md bg-default-100 px-2 py-1 text-sm">
				routes/dashboard/index.tsx
			</code>
		</div>
	);
}
