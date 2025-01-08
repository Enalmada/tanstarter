/**
 * Default error boundary component
 * Handles and displays runtime errors in the application
 * Provides user-friendly error messages and retry options
 */

import { Button, Group, Stack } from "@mantine/core";
import {
	ErrorComponent,
	type ErrorComponentProps,
	Link,
	rootRouteId,
	useMatch,
	useRouter,
} from "@tanstack/react-router";

export function DefaultCatchBoundary({ error }: Readonly<ErrorComponentProps>) {
	const router = useRouter();
	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId,
	});

	console.error(error);

	return (
		<Stack className="min-w-0 flex-1 items-center justify-center gap-6 p-4">
			<ErrorComponent error={error} />
			<Group>
				<Button
					onClick={() => {
						router.invalidate();
					}}
				>
					Try Again
				</Button>
				{isRoot ? (
					<Button component={Link} to="/" variant="outline">
						Home
					</Button>
				) : (
					<Button
						variant="outline"
						onClick={() => {
							window.history.back();
						}}
					>
						Go Back
					</Button>
				)}
			</Group>
		</Stack>
	);
}
