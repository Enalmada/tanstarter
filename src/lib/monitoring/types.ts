export interface ErrorMonitor {
	error(message: string | Error, extra?: unknown): void;
	warn(message: string | Error, extra?: unknown): void;
	info(message: string | Error, extra?: unknown): void;
	debug(message: string | Error, extra?: unknown): void;
	setUser(user: MonitorUser | null): void;
	breadcrumb(message: string, metadata?: Record<string, unknown>): void;
}

export interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export interface MonitoringConfig {
	enabled: boolean;
	environment: string;
	release?: string;
	accessToken: string;
	captureUncaught?: boolean;
	captureUnhandledRejections?: boolean;
}

export interface MonitorUser {
	id: string;
	email?: string;
	name?: string;
	role?: string;
}

export type BreadcrumbLevel = "debug" | "info" | "warning" | "error" | "critical";
