import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "~/lib/utils";

export interface TitleProps extends ComponentPropsWithoutRef<"h1"> {
	order?: 1 | 2 | 3 | 4 | 5 | 6;
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	weight?: "normal" | "medium" | "semibold" | "bold";
}

const sizeMap = {
	xs: "text-lg",
	sm: "text-xl",
	md: "text-2xl",
	lg: "text-3xl",
	xl: "text-4xl",
};

const weightMap = {
	normal: "font-normal",
	medium: "font-medium",
	semibold: "font-semibold",
	bold: "font-bold",
};

export const Title = forwardRef<HTMLHeadingElement, TitleProps>(
	({ className, order = 1, size = "md", weight = "bold", children, ...props }, ref) => {
		const Component = `h${order}` as const;
		return (
			<Component ref={ref} className={cn("tracking-tight", sizeMap[size], weightMap[weight], className)} {...props}>
				{children}
			</Component>
		);
	},
);

Title.displayName = "Title";
