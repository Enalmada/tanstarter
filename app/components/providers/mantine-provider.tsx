import {
	MantineProvider as BaseMantineProvider,
	ColorSchemeScript,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";

interface MantineProviderProps {
	children: ReactNode;
}

export function MantineProvider({ children }: MantineProviderProps) {
	return (
		<BaseMantineProvider
			defaultColorScheme="auto"
			theme={{
				primaryColor: "blue",
				defaultRadius: "md",
			}}
		>
			<Notifications />
			<ModalsProvider>{children}</ModalsProvider>
		</BaseMantineProvider>
	);
}

// Export ColorSchemeScript to be used in the root layout
export { ColorSchemeScript };
