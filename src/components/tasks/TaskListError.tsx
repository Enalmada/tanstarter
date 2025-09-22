import type { FallbackProps } from "react-error-boundary";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export function TaskListError({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="container mx-auto p-6">
			<Card>
				<CardContent className="flex flex-col items-center gap-4 p-6">
					<p className="text-lg font-medium text-destructive">Error Loading Tasks</p>
					<p className="text-sm text-muted-foreground">{error.message}</p>
					<Button onClick={() => resetErrorBoundary()}>Try Again</Button>
				</CardContent>
			</Card>
		</div>
	);
}
