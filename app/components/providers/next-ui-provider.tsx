/**
 * NextUI provider component wrapper
 * Sets up NextUI theme and configuration
 * Required for NextUI components to work properly
 */

import { NextUIProvider } from "@nextui-org/react";

interface Props {
	children: React.ReactNode;
}

export function NextUIAppProvider({ children }: Props) {
	return <NextUIProvider>{children}</NextUIProvider>;
}
