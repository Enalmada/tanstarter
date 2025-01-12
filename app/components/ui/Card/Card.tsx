import { Paper, type PaperProps } from "@mantine/core";
import { forwardRef } from "react";

export interface CardProps extends PaperProps {
	children?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
	return <Paper ref={ref} radius="md" {...props} />;
});

Card.displayName = "Card";
