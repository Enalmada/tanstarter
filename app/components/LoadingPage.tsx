/**
 * Generic loading page component
 * Used as a fallback during route transitions
 */

export function LoadingPage() {
	return (
		<div className="container flex min-h-[400px] items-center justify-center">
			<output
				className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
				aria-label="Loading"
			>
				<span className="sr-only">Loading...</span>
			</output>
		</div>
	);
}
