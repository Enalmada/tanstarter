/**
 * Default error boundary component
 * Handles and displays runtime errors in the application
 * Provides user-friendly error messages and retry options
 */

import {
	ErrorComponent,
	type ErrorComponentProps,
	rootRouteId,
	useMatch,
	useRouter,
} from "@tanstack/react-router";
import { Button, Group, LinkButton, Stack } from "~/components/ui";

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
					<LinkButton to="/" variant="outline">
						Home
					</LinkButton>
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
