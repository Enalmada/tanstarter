import { Button, Card, CardBody } from "@nextui-org/react";
import type { FallbackProps } from "react-error-boundary";

export function TaskListError({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="container mx-auto p-6">
			<Card>
				<CardBody className="text-center">
					<h3 className="text-lg font-medium text-danger mb-2">
						Error Loading Tasks
					</h3>
					<p className="text-small text-default-500 mb-4">{error.message}</p>
					<Button color="primary" onPress={() => resetErrorBoundary()}>
						Try Again
					</Button>
				</CardBody>
			</Card>
		</div>
	);
}
