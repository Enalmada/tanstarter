/**
 * Loading spinner component
 * Uses Tailwind's animation utilities for a simple loading indicator
 */

import { cn } from "~/lib/utils";

export function Spinner({ className }: { className?: string }) {
	return (
		<output
			className={cn(
				"inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground",
				className,
			)}
			aria-label="Loading"
		>
			<span className="sr-only">Loading...</span>
		</output>
	);
}
