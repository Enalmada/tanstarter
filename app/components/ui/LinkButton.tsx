import { Button, type ButtonProps } from "@mantine/core";
import { Link, type LinkProps } from "@tanstack/react-router";
import { type PropsWithChildren, forwardRef } from "react";

type LinkButtonProps = Omit<ButtonProps, "component"> & Pick<LinkProps, "to">;

export const LinkButton = forwardRef<
	HTMLAnchorElement,
	PropsWithChildren<LinkButtonProps>
>(({ className, children, ...props }, ref) => (
	<Button
		component={Link}
		ref={ref}
		{...(className ? { className } : {})}
		variant="gradient"
		gradient={{ from: "blue", to: "cyan" }}
		{...props}
	>
		{children}
	</Button>
));

LinkButton.displayName = "LinkButton";
