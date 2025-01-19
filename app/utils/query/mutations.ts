import {
	type QueryKey,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { showToast } from "~/components/Toast";
import { deleteEntity } from "~/server/services/base-service";

interface UseDeleteEntityMutationOptions<T extends { id: string }> {
	/**
	 * The entity name (e.g. "Task", "User") used in error and success messages
	 */
	entityName: string;
	/**
	 * The entity ID to delete - if not provided, must be passed in mutate config
	 */
	entityId?: string;
	/**
	 * The subject type for the entity (e.g. "Task", "User")
	 */
	subject: "Task" | "User";
	/**
	 * Array of list query keys to update
	 */
	listKeys: QueryKey[];
	/**
	 * The detail query key for this entity
	 * Can be a static key or a function that takes the entityId and returns a key
	 */
	detailKey: QueryKey | ((entityId: string) => QueryKey);
	/**
	 * Where to navigate after successful deletion
	 * Optional - if not provided, will stay on current page
	 */
	navigateTo?: string;
	/**
	 * Where to navigate on error (usually the current entity detail page)
	 * Optional - if not provided, will stay on current page
	 */
	navigateBack?: string;
	/**
	 * Set of pending delete IDs to track loading state
	 * Optional - if not provided, loading state will not be tracked
	 */
	pendingDeleteIds?: Set<string>;
	/**
	 * Optional error message setter
	 * If provided, will be called with error message on error
	 */
	setErrorMessage?: (message: string) => void;
}

interface DeleteEntityMutateConfig {
	entityId?: string;
	detailKey?: QueryKey;
}

/**
 * Hook for handling entity deletion with optimistic updates
 * Handles cache updates, navigation, and error handling
 */
export function useDeleteEntityMutation<T extends { id: string }>({
	entityName,
	entityId: defaultEntityId,
	subject,
	listKeys,
	detailKey: defaultDetailKeyOrFn,
	navigateTo,
	navigateBack,
	pendingDeleteIds,
	setErrorMessage,
}: UseDeleteEntityMutationOptions<T>) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	type MutationContext = {
		previousLists: { key: QueryKey; data: T[] | undefined }[];
		previousDetail: T | undefined;
		entityId: string;
		detailKey: QueryKey;
	};

	// Allow calling mutate() without arguments when defaultEntityId is provided
	type Variables = DeleteEntityMutateConfig | undefined;

	return useMutation<string, Error, Variables, MutationContext>({
		mutationFn: async (config) => {
			const id = config?.entityId ?? defaultEntityId;
			if (!id) {
				throw new Error(
					"entityId must be provided either in options or mutate config",
				);
			}
			const result = await deleteEntity({
				data: { id, subject },
			});
			return result.id;
		},
		onMutate: async (config) => {
			const id = config?.entityId ?? defaultEntityId;
			if (!id) {
				throw new Error(
					"entityId must be provided either in options or mutate config",
				);
			}
			setErrorMessage?.("");

			const detailKey =
				config?.detailKey ??
				(typeof defaultDetailKeyOrFn === "function"
					? defaultDetailKeyOrFn(id)
					: defaultDetailKeyOrFn);

			pendingDeleteIds?.add(id);

			// Cancel any outgoing refetches
			await Promise.all([
				...listKeys.map((key) => queryClient.cancelQueries({ queryKey: key })),
				queryClient.cancelQueries({ queryKey: detailKey }),
			]);

			// Snapshot the previous values
			const previousLists = listKeys.map((key) => ({
				key,
				data: queryClient.getQueryData<T[]>(key),
			}));
			const previousDetail = queryClient.getQueryData<T>(detailKey);

			// Optimistically remove from list caches
			for (const key of listKeys) {
				queryClient.setQueryData<T[]>(key, (old = []) =>
					old.filter((item) => item.id !== id),
				);
			}

			// Remove detail cache
			queryClient.removeQueries({ queryKey: detailKey });

			// Navigate optimistically if navigateTo is provided
			if (navigateTo) {
				navigate({ to: navigateTo });
			}

			// Return a context object with the snapshotted values
			return { previousLists, previousDetail, entityId: id, detailKey };
		},
		onSettled: (_result, error, config, context) => {
			if (!context) return;

			const { entityId: id, detailKey } = context;

			// Only update caches if we have a successful deletion or a "not found" error
			if (!error || error?.message === `${subject} ${id} not found`) {
				// Ensure the entity is removed from all caches
				for (const key of listKeys) {
					queryClient.setQueryData<T[]>(key, (old = []) =>
						old.filter((item) => item.id !== id),
					);
				}
				queryClient.removeQueries({ queryKey: detailKey });
			}
			pendingDeleteIds?.delete(id);
		},
		onSuccess: () => {
			showToast({
				title: "Success",
				description: `${entityName} deleted successfully`,
				type: "success",
			});
			setErrorMessage?.("");
		},
		onError: (error, config, context) => {
			if (!context) return;

			const { entityId: id, detailKey } = context;

			// If entity is not found, treat it as a success case
			if (error.message === `${subject} ${id} not found`) {
				showToast({
					title: "Success",
					description: `${entityName} deleted successfully`,
					type: "success",
				});
				setErrorMessage?.("");
				return;
			}

			// For other errors, revert all caches and show error
			if (context) {
				// Restore detail cache
				if (context.previousDetail) {
					queryClient.setQueryData(detailKey, context.previousDetail);
				}

				// Restore list caches
				for (const { key, data } of context.previousLists) {
					if (data) {
						queryClient.setQueryData(key, data);
					}
				}
			}

			showToast({
				title: "Error",
				description: error.message,
				type: "error",
			});
			setErrorMessage?.(error.message);

			// Navigate back on error if navigateBack is provided
			if (navigateBack) {
				navigate({ to: navigateBack });
			}
		},
	});
}
