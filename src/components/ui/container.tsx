import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "~/lib/utils";

export interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
	size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
	xs: "max-w-(--breakpoint-sm)",
	sm: "max-w-(--breakpoint-md)",
	md: "max-w-(--breakpoint-lg)",
	lg: "max-w-(--breakpoint-xl)",
	xl: "max-w-(--breakpoint-2xl)",
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
	({ className, size = "md", children, ...props }, ref) => (
		<div ref={ref} className={cn("mx-auto w-full px-4", sizeMap[size], className)} {...props}>
			{children}
		</div>
	),
);

Container.displayName = "Container";
