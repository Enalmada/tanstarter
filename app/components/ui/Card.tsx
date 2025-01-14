import {
	Card as MantineCard,
	type CardProps as MantineCardProps,
} from "@mantine/core";
import { forwardRef } from "react";

export type CardProps = MantineCardProps;

export const Card = forwardRef<HTMLDivElement, CardProps>(
	({ className, children, ...props }, ref) => (
		<MantineCard ref={ref} {...(className ? { className } : {})} {...props}>
			{children}
		</MantineCard>
	),
);

Card.displayName = "Card";
