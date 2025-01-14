import { Card, Group, Skeleton, Stack } from "@mantine/core";

export function TaskListSkeleton() {
	return (
		<div data-testid="task-list-skeleton">
			<Card withBorder>
				<Group justify="space-between">
					<Skeleton height={30} width={100} />
					<Skeleton height={30} width={100} />
				</Group>
				<Stack gap="md">
					{Array.from({ length: 3 }).map((_, i) => (
						<Card key={`skeleton-${Date.now()}-${i}`} withBorder>
							<Group>
								<Skeleton circle height={20} />
								<Skeleton height={20} width={200} />
							</Group>
						</Card>
					))}
				</Stack>
			</Card>
		</div>
	);
}
