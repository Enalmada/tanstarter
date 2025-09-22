import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

const SKELETON_ITEMS = [
	"skeleton-task-1",
	"skeleton-task-2",
	"skeleton-task-3",
] as const;

export function TaskListSkeleton() {
	return (
		<div className="container mx-auto p-6" data-testid="task-list-skeleton">
			<div className="flex flex-col gap-4">
				<div className="flex h-12 items-center justify-between">
					<Skeleton className="h-8 w-24" />
					<Skeleton className="h-10 w-28" />
				</div>
				<div className="flex flex-col gap-4">
					{SKELETON_ITEMS.map((key) => (
						<Card key={key} className="shadow-xs">
							<CardContent className="flex items-center gap-4 p-4">
								<Skeleton className="h-4 w-4 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-5 w-48" />
									<Skeleton className="h-4 w-72 text-muted-foreground" />
								</div>
								<Skeleton className="h-8 w-8 rounded-md" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
