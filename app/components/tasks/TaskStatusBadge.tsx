import { Badge } from "~/components/ui/badge";
import { TaskStatus } from "~/server/db/schema";

interface TaskStatusBadgeProps {
	status: (typeof TaskStatus)[keyof typeof TaskStatus];
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
	switch (status) {
		case TaskStatus.ACTIVE:
			return (
				<Badge
					variant="default"
					className="bg-blue-500 hover:bg-blue-600"
					data-test-color="blue"
				>
					Active
				</Badge>
			);
		case TaskStatus.COMPLETED:
			return (
				<Badge
					variant="default"
					className="bg-green-500 hover:bg-green-600"
					data-test-color="green"
				>
					Completed
				</Badge>
			);
		default:
			return (
				<Badge variant="secondary" data-test-color="gray">
					Unknown
				</Badge>
			);
	}
}
