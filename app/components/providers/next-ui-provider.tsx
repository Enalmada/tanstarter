import { NextUIProvider } from "@nextui-org/react";

interface Props {
	children: React.ReactNode;
}

export function NextUIAppProvider({ children }: Props) {
	return <NextUIProvider>{children}</NextUIProvider>;
}
