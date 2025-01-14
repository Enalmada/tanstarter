import { createFileRoute } from "@tanstack/react-router";
import { DefaultLayout } from "~/components/layouts/DefaultLayout";

export const Route = createFileRoute("/tasks")({
	component: TasksLayout,
	loader: ({ context }) => ({
		user: context.user ?? null,
	}),
});

function TasksLayout() {
	const { user } = Route.useLoaderData();
	return <DefaultLayout user={user} />;
}
