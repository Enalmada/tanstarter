import {
	Container as MantineContainer,
	type ContainerProps as MantineContainerProps,
} from "@mantine/core";
import { forwardRef } from "react";

export type ContainerProps = MantineContainerProps;

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
	({ className, children, ...props }, ref) => (
		<MantineContainer
			ref={ref}
			{...(className ? { className } : {})}
			{...props}
		>
			{children}
		</MantineContainer>
	),
);

Container.displayName = "Container";
