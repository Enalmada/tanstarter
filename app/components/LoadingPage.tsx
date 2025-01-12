/**
 * Generic loading page component
 * Used as a fallback during route transitions
 */

import { Center, Loader } from "@mantine/core";

export function LoadingPage() {
	return (
		<div className="container mx-auto p-6">
			<Center>
				<Loader size="md" role="progressbar" />
			</Center>
		</div>
	);
}
