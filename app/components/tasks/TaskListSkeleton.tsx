import { Button } from "@nextui-org/react";
import { Link } from "@tanstack/react-router";
import { Spinner } from "~/components/Spinner";

export function TaskListSkeleton() {
	return (
		<div className="container mx-auto p-6">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold">Tasks</h1>
				<Button
					as={Link}
					to="/tasks/new"
					color="primary"
					variant="solid"
					size="lg"
				>
					New Task
				</Button>
			</div>
			<div className="flex justify-center">
				<Spinner />
			</div>
		</div>
	);
}
