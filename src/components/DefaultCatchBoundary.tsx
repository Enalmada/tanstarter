/**
 * Default error boundary component
 * Handles and displays runtime errors in the application
 * Provides user-friendly error messages and retry options
 */

import {
	ErrorComponent,
	type ErrorComponentProps,
	Link,
	rootRouteId,
	useMatch,
	useRouter,
} from "@tanstack/react-router";
import { Button } from "~/components/ui/button";

export function DefaultCatchBoundary({ error }: Readonly<ErrorComponentProps>) {
	const router = useRouter();
	const isRoot = useMatch({
		strict: false,
		select: (state) => state.id === rootRouteId,
	});

	return (
		<div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 p-4">
			<ErrorComponent error={error} />
			<div className="flex gap-4">
				<Button
					onClick={() => {
						router.invalidate();
					}}
				>
					Try Again
				</Button>
				{isRoot ? (
					<Button asChild variant="outline">
						<Link to="/">Home</Link>
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
			</div>
		</div>
	);
}
