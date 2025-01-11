import {
	Title as MantineTitle,
	type TitleProps as MantineTitleProps,
} from "@mantine/core";
import { forwardRef } from "react";

export type TitleProps = MantineTitleProps;

export const Title = forwardRef<HTMLHeadingElement, TitleProps>(
	({ className, children, ...props }, ref) => (
		<MantineTitle ref={ref} {...(className ? { className } : {})} {...props}>
			{children}
		</MantineTitle>
	),
);

Title.displayName = "Title";
