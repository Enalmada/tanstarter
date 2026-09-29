import { createFileRoute } from "@tanstack/react-router";
import { DefaultLayout } from "~/components/layouts/DefaultLayout";

export const Route = createFileRoute("/tasks")({
	component: TasksLayout,
});

function TasksLayout() {
	return <DefaultLayout />;
}
