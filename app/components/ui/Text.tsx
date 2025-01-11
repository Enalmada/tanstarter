import {
	Text as MantineText,
	type TextProps as MantineTextProps,
} from "@mantine/core";
import { type PropsWithChildren, forwardRef } from "react";

export type TextProps = MantineTextProps;

export const Text = forwardRef<HTMLDivElement, PropsWithChildren<TextProps>>(
	({ className, children, ...props }, ref) => (
		<MantineText ref={ref} {...(className ? { className } : {})} {...props}>
			{children}
		</MantineText>
	),
);

Text.displayName = "Text";
