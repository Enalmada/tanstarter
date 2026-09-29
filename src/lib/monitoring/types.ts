export interface ErrorMonitor {
	error(message: string | Error, extra?: unknown): void;
	warn(message: string | Error, extra?: unknown): void;
	info(message: string | Error, extra?: unknown): void;
	debug(message: string | Error, extra?: unknown): void;
	setUser(user: MonitorUser | null): void;
	breadcrumb(message: string, metadata?: Record<string, unknown>): void;
}

export interface MonitorUser {
	id: string;
	email?: string;
	name?: string;
	role?: string;
}
