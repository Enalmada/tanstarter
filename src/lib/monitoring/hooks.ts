import { clientMonitor } from "./client";
import type { ErrorMonitor } from "./types";

/**
 * Hook to access the client error monitor (PostHog-backed).
 * Provides a consistent interface regardless of monitoring provider.
 */
export function useMonitor(): ErrorMonitor {
	return clientMonitor;
}
