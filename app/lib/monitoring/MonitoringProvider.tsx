import { useEffect } from "react";
import type { Configuration } from "rollbar";
import authClient from "~/utils/auth-client";
import { useMonitor } from "./hooks";
import { MonitoringProvider as BaseProvider } from "./rollbar";
import type { MonitorUser } from "./types";

function MonitoringUserSync() {
	const monitor = useMonitor();
	const { data: session } = authClient.useSession();

	const user = session?.user;

	useEffect(() => {
		if (!user) {
			monitor.setUser(null);
			return;
		}

		const monitorUser: MonitorUser = {
			id: user.id,
			email: user.email,
			name: user.name ?? user.email ?? undefined,
			role: user.role,
		};

		monitor.setUser(monitorUser);
	}, [monitor, user]);

	return null;
}

interface Props {
	children: React.ReactNode;
	config: Configuration;
}

export function MonitoringProvider({ children, config }: Props) {
	// Only enable on client side and respect the config's enabled setting
	const isClient = typeof window !== "undefined";
	const isEnabled = isClient && config.enabled;

	if (!isEnabled) {
		return <>{children}</>;
	}

	return (
		<BaseProvider config={config}>
			<MonitoringUserSync />
			{children}
		</BaseProvider>
	);
}
