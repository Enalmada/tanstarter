/**
 * Polyfill for use-sync-external-store using React 19's built-in implementation
 * This replaces the external CommonJS package that Vite 7 struggles to transform
 */

import { useSyncExternalStore as useSyncExternalStoreNative } from "react";

// Re-export React 19's built-in useSyncExternalStore
export const useSyncExternalStore = useSyncExternalStoreNative;

// Implement useSyncExternalStoreWithSelector using React 19's built-in hook
export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
	subscribe: (onStoreChange: () => void) => () => void,
	getSnapshot: () => Snapshot,
	getServerSnapshot: undefined | null | (() => Snapshot),
	selector: (snapshot: Snapshot) => Selection,
	isEqual?: (a: Selection, b: Selection) => boolean,
): Selection {
	const selected = useSyncExternalStoreNative(
		subscribe,
		() => selector(getSnapshot()),
		getServerSnapshot ? () => selector(getServerSnapshot()) : undefined,
	);

	return selected;
}
