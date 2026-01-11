import type * as React from "react";

import { cn } from "~/lib/utils";

// Note: htmlFor is passed via props spread, so linter warning is a false positive
function Label({ className, ...props }: React.ComponentProps<"label">) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: htmlFor is passed via props spread
		<label
			data-slot="label"
			className={cn(
				"gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
