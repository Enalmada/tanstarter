import {
	Group as MantineGroup,
	type GroupProps as MantineGroupProps,
} from "@mantine/core";
import { forwardRef } from "react";

export type GroupProps = MantineGroupProps;

export const Group = forwardRef<HTMLDivElement, GroupProps>(
	({ className, children, ...props }, ref) => (
		<MantineGroup ref={ref} {...(className ? { className } : {})} {...props}>
			{children}
		</MantineGroup>
	),
);

Group.displayName = "Group";
