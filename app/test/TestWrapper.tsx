import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";

interface TestWrapperProps {
	children: ReactNode;
}

export function TestWrapper({ children }: TestWrapperProps) {
	return (
		<MantineProvider defaultColorScheme="light">{children}</MantineProvider>
	);
}
