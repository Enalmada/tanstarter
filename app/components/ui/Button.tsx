import {
	Button as MantineButton,
	type ButtonProps as MantineButtonProps,
} from "@mantine/core";
import type { ComponentPropsWithoutRef } from "react";
import { forwardRef } from "react";

export type ButtonProps = MantineButtonProps &
	ComponentPropsWithoutRef<"button">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, children, ...props }, ref) => (
		<MantineButton ref={ref} {...(className ? { className } : {})} {...props}>
			{children}
		</MantineButton>
	),
);

Button.displayName = "Button";
