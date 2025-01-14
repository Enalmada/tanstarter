import { Badge } from "@mantine/core";
import { TaskStatus } from "~/server/db/schema";

interface TaskStatusBadgeProps {
	status: (typeof TaskStatus)[keyof typeof TaskStatus];
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
	switch (status) {
		case TaskStatus.ACTIVE:
			return (
				<Badge color="blue" data-test-color="blue">
					Active
				</Badge>
			);
		case TaskStatus.COMPLETED:
			return (
				<Badge color="green" data-test-color="green">
					Completed
				</Badge>
			);
		default:
			return (
				<Badge color="gray" data-test-color="gray">
					Unknown
				</Badge>
			);
	}
}
