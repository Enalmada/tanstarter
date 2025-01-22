import type { FallbackProps } from "react-error-boundary";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { Stack } from "~/components/ui/Stack";
import { Text } from "~/components/ui/Text";

export function TaskListError({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="container mx-auto p-6">
			<Card withBorder>
				<Stack align="center">
					<Text size="lg" fw={500} c="red">
						Error Loading Tasks
					</Text>
					<Text size="sm" c="dimmed" mb="md">
						{error.message}
					</Text>
					<Button onClick={() => resetErrorBoundary()}>Try Again</Button>
				</Stack>
			</Card>
		</div>
	);
}
