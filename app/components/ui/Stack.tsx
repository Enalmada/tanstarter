import {
	Stack as MantineStack,
	type StackProps as MantineStackProps,
} from "@mantine/core";
import { forwardRef } from "react";

export type StackProps = MantineStackProps;

export const Stack = forwardRef<HTMLDivElement, StackProps>(
	({ className, children, ...props }, ref) => (
		<MantineStack ref={ref} {...(className ? { className } : {})} {...props}>
			{children}
		</MantineStack>
	),
);

Stack.displayName = "Stack";
