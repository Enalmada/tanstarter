import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

export interface ContainerProps extends ComponentPropsWithoutRef<"div"> {
	size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
	xs: "max-w-screen-sm",
	sm: "max-w-screen-md",
	md: "max-w-screen-lg",
	lg: "max-w-screen-xl",
	xl: "max-w-screen-2xl",
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
	({ className, size = "md", children, ...props }, ref) => (
		<div
			ref={ref}
			className={cn("mx-auto w-full px-4", sizeMap[size], className)}
			{...props}
		>
			{children}
		</div>
	),
);

Container.displayName = "Container";
