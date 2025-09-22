/**
 * Loading spinner component
 * Uses Tailwind's animation utilities for a simple loading indicator
 */

export function Spinner() {
	return (
		<output
			className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground"
			aria-label="Loading"
		/>
	);
}
