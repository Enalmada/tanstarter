/**
 * TanStack Start Optimistic Mutations
 *
 * This module provides a set of hooks and utilities for handling optimistic mutations
 * in TanStack Start applications. It implements common patterns for creating, updating,
 * and deleting entities with optimistic updates, cache management, navigation, and error handling.
 *
 * Key Features:
 * - Optimistic updates for create/update/delete operations
 * - Automatic cache management for lists and detail views
 * - Consistent error handling and rollback mechanisms
 * - Integrated navigation with duplicate prevention
 * - Toast notifications for success/error states
 *
 * Core Patterns:
 * 1. Cache Management:
 *    - Lists and detail views are updated optimistically
 *    - Previous cache state is preserved for rollback
 *    - Cache is updated with server response on success
 *    - Cache is restored from snapshot on error
 *
 * 2. Navigation Flow:
 *    - Optimistic navigation on mutation start
 *    - Navigation only occurs if target differs from current location
 *    - Error navigation for returning to previous state
 *
 * 3. Error Handling:
 *    - Consistent error messages via toast notifications
 *    - Cache rollback on error
 *    - Optional error message state management
 *
 * 4. Mutation Lifecycle:
 *    - onMutate: Optimistic updates and navigation
 *    - onSettled: Cache finalization (success or rollback)
 *    - onSuccess: Success notifications and side effects
 *    - onError: Error handling and navigation
 *
 * Usage Example:
 * ```typescript
 * const { createMutation, updateMutation, deleteMutation } = useEntityMutations<Task>({
 *   entityName: "Task",
 *   subject: "Task",
 *   listKeys: [queries.task.list.queryKey],
 *   detailKey: (id) => queries.task.detail(id).queryKey,
 *   navigateTo: "/tasks",
 *   navigateBack: "/tasks/new",
 *   createOptimisticEntity: (data) => ({
 *     ...data,
 *     id: `temp-${Date.now()}`,
 *     createdAt: new Date(),
 *   })
 * });
 * ```
 *
 * Design Decisions:
 * 1. Separate hooks for create/update/delete:
 *    - Allows for specific optimistic update logic per operation
 *    - Maintains type safety for operation-specific parameters
 *    - Enables targeted cache updates based on operation
 *
 * 2. Combined hook (useEntityMutations):
 *    - Provides convenient access to all operations
 *    - Shares common configuration across operations
 *    - Reduces boilerplate in consuming components
 *
 * 3. Helper functions:
 *    - handleToast: Consistent toast notifications
 *    - handleConditionalNavigation: Smart navigation with duplicate prevention
 *    - handleCacheUpdate: Cache snapshot and cancellation
 *    - updateListCachesWithEntity: List cache manipulation
 *
 * Future Considerations:
 * - Support for batch operations
 * - Configurable retry strategies
 * - Custom cache update strategies
 * - Extended navigation options
 * - Additional mutation lifecycle hooks
 */

import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { createEntity, deleteEntity, updateEntity } from "~/functions/base-service";

// Toast configuration for consistent messaging
interface ToastConfig {
	success: {
		title: string;
		description: (entityName: string) => string;
	};
	error: {
		title: string;
		description: (error: Error) => string;
	};
}

type MutationType = "create" | "update" | "delete";

const defaultToastConfig: Record<MutationType, ToastConfig> = {
	create: {
		success: {
			title: "Success",
			description: (entityName) => `${entityName} created successfully`,
		},
		error: {
			title: "Error",
			description: (error) => error.message,
		},
	},
	update: {
		success: {
			title: "Success",
			description: (entityName) => `${entityName} updated successfully`,
		},
		error: {
			title: "Error",
			description: (error) => error.message,
		},
	},
	delete: {
		success: {
			title: "Success",
			description: (entityName) => `${entityName} deleted successfully`,
		},
		error: {
			title: "Error",
			description: (error) => error.message,
		},
	},
};

// Shared utility functions
const handleToast = (
	config: ToastConfig,
	type: "success" | "error",
	entityName: string,
	error: Error = new Error("Unknown error"),
) => {
	toast[type](config[type].title, {
		description: type === "success" ? config[type].description(entityName) : config[type].description(error),
	});
};

/**
 * Helper function to handle conditional navigation
 * Only navigates if target path is different from current location
 */
const handleConditionalNavigation = (
	navigate: ReturnType<typeof useNavigate>,
	router: ReturnType<typeof useRouter>,
	targetPath?: string,
) => {
	if (targetPath && router.state.location.href !== targetPath) {
		navigate({ to: targetPath });
	}
};

const handleCacheUpdate = async <T>(
	queryClient: ReturnType<typeof useQueryClient>,
	keys: QueryKey[],
): Promise<{ key: QueryKey; data: T[] | undefined }[]> => {
	await Promise.all(keys.map((key) => queryClient.cancelQueries({ queryKey: key })));
	return keys.map((key) => ({
		key,
		data: queryClient.getQueryData<T[]>(key),
	}));
};

const restoreCaches = <T>(
	queryClient: ReturnType<typeof useQueryClient>,
	previousData: { key: QueryKey; data: T[] | undefined }[],
) => {
	for (const { key, data } of previousData) {
		if (data) {
			queryClient.setQueryData(key, data);
		}
	}
};

// Cache update helpers
const updateListCachesWithEntity = <T extends { id: string }>(
	queryClient: ReturnType<typeof useQueryClient>,
	keys: QueryKey[],
	entity: T,
	prepend = false,
	oldId?: string,
) => {
	for (const key of keys) {
		queryClient.setQueryData<T[]>(key, (old = []) => {
			const filtered = old.filter((item) => item.id !== (oldId ?? entity.id));
			return prepend ? [entity, ...filtered] : [...filtered, entity];
		});
	}
};

const removeFromListCaches = <T extends { id: string }>(
	queryClient: ReturnType<typeof useQueryClient>,
	keys: QueryKey[],
	entityId: string,
) => {
	for (const key of keys) {
		queryClient.setQueryData<T[]>(key, (old = []) => old.filter((item) => item.id !== entityId));
	}
};

// Mutation handler patterns for optimistic updates:
//
// Cache Update Strategy:
// 1. Create: Prepend to list (optimistic) -> Update optimistic entry with server response
// 2. Update: Replace in list/detail -> Update with server response
// 3. Delete: Remove from list/detail -> Confirm removal or restore on error
//
// Handler Flow:
// 1. onMutate: Optimistic updates
//    - Cancel in-flight queries
//    - Snapshot previous cache state
//    - Apply optimistic updates to cache
//    - Return context with previous state for rollback
//
// 2. onSettled: Final cache updates (runs after success/error)
//    - Success: Update optimistic entry with server response
//    - Error: Either invalidate queries or restore from snapshot
//    - Clean up any pending state
//
// 3. onSuccess: Side effects only (runs before onSettled)
//    - Show success notifications
//    - Navigate to success routes
//    - Clear error messages
//
// 4. onError: Side effects only (runs before onSettled)
//    - Show error notifications
//    - Navigate to error routes
//    - Set error messages
//
// Cache Update Helpers:
// - updateListCachesWithEntity: Updates/adds entity in lists (prepend option for create)
// - removeFromListCaches: Removes entity from lists
// - handleCacheUpdate: Cancels queries and snapshots previous state
// - restoreCaches: Restores previous cache state on error

interface UseDeleteEntityMutationOptions<_T extends { id: string }> {
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
	const router = useRouter();

	type MutationContext = {
		previousLists: { key: QueryKey; data: T[] | undefined }[];
		previousDetail: T | undefined;
		entityId: string;
		detailKey: QueryKey;
	};

	type Variables = DeleteEntityMutateConfig | undefined;

	return useMutation<string, Error, Variables, MutationContext>({
		mutationFn: async (config) => {
			const id = config?.entityId ?? defaultEntityId;
			if (!id) {
				throw new Error("entityId must be provided either in options or mutate config");
			}
			const result = await deleteEntity({
				data: { id, subject },
			});
			return result.id;
		},
		onMutate: async (config) => {
			const id = config?.entityId ?? defaultEntityId;
			if (!id) {
				throw new Error("entityId must be provided either in options or mutate config");
			}
			setErrorMessage?.("");

			const detailKey =
				config?.detailKey ??
				(typeof defaultDetailKeyOrFn === "function" ? defaultDetailKeyOrFn(id) : defaultDetailKeyOrFn);

			pendingDeleteIds?.add(id);

			// Cancel queries and snapshot previous values
			const previousLists = await handleCacheUpdate<T>(queryClient, listKeys);
			await queryClient.cancelQueries({ queryKey: detailKey });
			const previousDetail = queryClient.getQueryData<T>(detailKey);

			// Optimistically remove from list caches
			removeFromListCaches(queryClient, listKeys, id);

			// Remove detail cache
			queryClient.removeQueries({ queryKey: detailKey });

			// Navigate optimistically if navigateTo is provided and different from current path
			handleConditionalNavigation(navigate, router, navigateTo);

			return { previousLists, previousDetail, entityId: id, detailKey };
		},
		onSettled: (_result, error, _config, context) => {
			if (!context) return;

			const { entityId: id, detailKey } = context;

			if (error && error?.message !== `${subject} ${id} not found`) {
				// On error (except not found), restore previous cache state
				restoreCaches(queryClient, context.previousLists);
				if (context.previousDetail) {
					queryClient.setQueryData(detailKey, context.previousDetail);
				} else {
					queryClient.removeQueries({ queryKey: detailKey });
				}
			} else {
				// On success or not found, ensure removal from cache
				removeFromListCaches(queryClient, listKeys, id);
				queryClient.removeQueries({ queryKey: detailKey });
			}

			pendingDeleteIds?.delete(id);
		},
		onSuccess: (_id, _config, _context) => {
			// Only handle side effects
			handleToast(defaultToastConfig.delete, "success", entityName);
			setErrorMessage?.("");
		},
		onError: (error, _config, _context) => {
			// If entity not found, treat as success
			if (error.message === `${subject} ${_context?.entityId} not found`) {
				handleToast(defaultToastConfig.delete, "success", entityName);
				setErrorMessage?.("");
				return;
			}

			// Only handle side effects
			handleToast(defaultToastConfig.delete, "error", entityName, error);
			setErrorMessage?.(error.message);

			handleConditionalNavigation(navigate, router, navigateBack);
		},
	});
}

interface UseUpdateEntityMutationOptions<T extends { id: string }> {
	/**
	 * The entity name (e.g. "Task", "User") used in error and success messages
	 */
	entityName: string;
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
	 * Where to navigate after successful update
	 * Optional - if not provided, will stay on current page
	 */
	navigateTo?: string;
	/**
	 * Where to navigate on error (usually the current entity detail page)
	 * Optional - if not provided, will stay on current page
	 */
	navigateBack?: string;
	/**
	 * Optional error message setter
	 * If provided, will be called with error message on error
	 */
	setErrorMessage?: (message: string) => void;
	/**
	 * The entity to update - used for id and optimistic updates
	 * Optional if provided in mutate call
	 */
	entity?: T;
	/**
	 * Function to create an optimistic entity from the update data
	 * If not provided, will spread update data over existing entity
	 */
	createOptimisticEntity?: (entity: T, updateData: Record<string, unknown>) => T;
}

/**
 * Hook for handling entity updates with optimistic updates
 * Handles cache updates, navigation, and error handling
 */
export function useUpdateEntityMutation<
	T extends { id: string },
	TData extends Record<string, unknown> = Record<string, unknown>,
>({
	entityName,
	entity: defaultEntity,
	subject,
	listKeys,
	detailKey: defaultDetailKeyOrFn,
	navigateTo,
	navigateBack,
	setErrorMessage,
	createOptimisticEntity,
}: UseUpdateEntityMutationOptions<T>) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const router = useRouter();

	type MutationContext = {
		previousLists: { key: QueryKey; data: T[] | undefined }[];
		previousDetail: T | undefined;
		entityId: string;
		detailKey: QueryKey;
	};

	type MutateVariables = {
		entity?: T;
		data: TData;
	};

	return useMutation<T, Error, MutateVariables, MutationContext>({
		mutationFn: async ({ entity, data }) => {
			const targetEntity = entity ?? defaultEntity;
			if (!targetEntity) {
				throw new Error("entity must be provided either in options or mutate call");
			}
			const result = await updateEntity({
				data: {
					id: targetEntity.id,
					subject,
					data,
				},
			});
			return result as T;
		},
		onMutate: async ({ entity, data }) => {
			const targetEntity = entity ?? defaultEntity;
			if (!targetEntity) {
				throw new Error("entity must be provided either in options or mutate call");
			}
			setErrorMessage?.("");

			const detailKey =
				typeof defaultDetailKeyOrFn === "function" ? defaultDetailKeyOrFn(targetEntity.id) : defaultDetailKeyOrFn;

			// Cancel queries and snapshot previous values
			const previousLists = await handleCacheUpdate<T>(queryClient, listKeys);
			await queryClient.cancelQueries({ queryKey: detailKey });
			const previousDetail = queryClient.getQueryData<T>(detailKey);

			// Create optimistic entity
			const optimisticEntity = createOptimisticEntity
				? createOptimisticEntity(targetEntity, data)
				: {
						...targetEntity,
						...data,
					};

			// Optimistically update list caches
			updateListCachesWithEntity(queryClient, listKeys, optimisticEntity);

			// Update detail cache
			queryClient.setQueryData(detailKey, optimisticEntity);

			// Navigate optimistically if navigateTo is provided and different from current path
			handleConditionalNavigation(navigate, router, navigateTo);

			return {
				previousLists,
				previousDetail,
				entityId: targetEntity.id,
				detailKey,
			};
		},
		onSettled: (result, error, _variables, context) => {
			if (!context) return;

			const { detailKey, entityId } = context;

			if (error) {
				// On error, restore previous cache state
				restoreCaches(queryClient, context.previousLists);
				if (context.previousDetail) {
					queryClient.setQueryData(detailKey, context.previousDetail);
				} else {
					queryClient.removeQueries({ queryKey: detailKey });
				}
			} else if (result) {
				// On success, update both list and detail caches with server response
				// Use entityId to ensure we replace the correct entry even if ID changed
				updateListCachesWithEntity(queryClient, listKeys, result, false, entityId);

				// Update detail cache with real entity
				const realDetailKey =
					typeof defaultDetailKeyOrFn === "function" ? defaultDetailKeyOrFn(result.id) : defaultDetailKeyOrFn;
				queryClient.setQueryData(realDetailKey, result);

				// Remove the old detail cache if ID changed
				if (detailKey !== realDetailKey) {
					queryClient.removeQueries({ queryKey: detailKey });
				}
			}
		},
		onSuccess: (_result, _variables, _context) => {
			// Only handle side effects
			handleToast(defaultToastConfig.update, "success", entityName);
			setErrorMessage?.("");
		},
		onError: (error, _variables, _context) => {
			// Only handle side effects
			handleToast(defaultToastConfig.update, "error", entityName, error);
			setErrorMessage?.(error.message);

			handleConditionalNavigation(navigate, router, navigateBack);
		},
	});
}

interface UseCreateEntityMutationOptions<
	T extends { id: string },
	TData extends Record<string, unknown> = Record<string, unknown>,
> {
	/**
	 * The entity name (e.g. "Task", "User") used in error and success messages
	 */
	entityName: string;
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
	 * Where to navigate after successful creation
	 * Optional - if not provided, will stay on current page
	 */
	navigateTo?: string;
	/**
	 * Where to navigate on error (usually the form page)
	 * Optional - if not provided, will stay on current page
	 */
	navigateBack?: string;
	/**
	 * Optional error message setter
	 * If provided, will be called with error message on error
	 */
	setErrorMessage?: (message: string) => void;
	/**
	 * Function to create an optimistic entity from the create data
	 * Required to handle optimistic updates properly
	 */
	createOptimisticEntity: (data: TData) => T;
}

/**
 * Hook for handling entity creation with optimistic updates
 * Handles cache updates, navigation, and error handling
 */
export function useCreateEntityMutation<
	T extends { id: string },
	TData extends Record<string, unknown> = Record<string, unknown>,
>({
	entityName,
	subject,
	listKeys,
	detailKey: defaultDetailKeyOrFn,
	navigateTo,
	navigateBack,
	setErrorMessage,
	createOptimisticEntity,
}: UseCreateEntityMutationOptions<T, TData>) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const router = useRouter();

	type MutationContext = {
		previousLists: { key: QueryKey; data: T[] | undefined }[];
		previousDetail: T | undefined;
		optimisticEntity: T;
		detailKey: QueryKey;
		tempId: string;
	};

	return useMutation<T, Error, TData, MutationContext>({
		mutationFn: async (data) => {
			const result = await createEntity({
				data: {
					subject,
					data,
				},
			});
			return result as T;
		},
		onMutate: async (data) => {
			setErrorMessage?.("");

			// Create optimistic entity with temporary ID
			const optimisticEntity = createOptimisticEntity(data);
			const tempId = optimisticEntity.id; // Store the temporary ID

			// Get detail key
			const detailKey =
				typeof defaultDetailKeyOrFn === "function" ? defaultDetailKeyOrFn(tempId) : defaultDetailKeyOrFn;

			// Cancel queries and snapshot previous values
			const previousLists = await handleCacheUpdate<T>(queryClient, listKeys);
			await queryClient.cancelQueries({ queryKey: detailKey });
			const previousDetail = queryClient.getQueryData<T>(detailKey);

			// Optimistically update list caches
			updateListCachesWithEntity(queryClient, listKeys, optimisticEntity, true);

			// Update detail cache
			queryClient.setQueryData(detailKey, optimisticEntity);

			// Navigate optimistically if navigateTo is provided and different from current path
			handleConditionalNavigation(navigate, router, navigateTo);

			return {
				previousLists,
				previousDetail,
				optimisticEntity,
				detailKey,
				tempId,
			};
		},
		onSettled: (result, error, _data, context) => {
			if (!context) return;

			const { detailKey, tempId } = context;

			if (error) {
				// On error, restore previous cache state
				restoreCaches(queryClient, context.previousLists);
				if (context.previousDetail) {
					queryClient.setQueryData(detailKey, context.previousDetail);
				} else {
					queryClient.removeQueries({ queryKey: detailKey });
				}
			} else if (result) {
				// On success, update both list and detail caches with server response
				// Update using tempId to ensure we replace the optimistic entry
				updateListCachesWithEntity(queryClient, listKeys, result, true, tempId);

				// Update detail cache with real entity
				const realDetailKey =
					typeof defaultDetailKeyOrFn === "function" ? defaultDetailKeyOrFn(result.id) : defaultDetailKeyOrFn;
				queryClient.setQueryData(realDetailKey, result);

				// Remove the temporary detail cache if different
				if (detailKey !== realDetailKey) {
					queryClient.removeQueries({ queryKey: detailKey });
				}
			}
		},
		onSuccess: (_result, _data, _context) => {
			// Only handle side effects
			handleToast(defaultToastConfig.create, "success", entityName);
			setErrorMessage?.("");
		},
		onError: (error, _data, _context) => {
			// Only handle side effects
			handleToast(defaultToastConfig.create, "error", entityName, error);
			setErrorMessage?.(error.message);

			handleConditionalNavigation(navigate, router, navigateBack);
		},
	});
}

export interface UseEntityMutationsOptions<
	T extends { id: string },
	TData extends Record<string, unknown> = Record<string, unknown>,
> {
	entityName: string;
	subject: "Task" | "User";
	listKeys: QueryKey[];
	detailKey: QueryKey | ((entityId: string) => QueryKey);
	navigateTo?: string;
	navigateBack?: string;
	setErrorMessage?: (message: string) => void;
	createOptimisticEntity?: (data: TData) => T;
	entity?: T;
	pendingDeleteIds?: Set<string>;
}

/**
 * Hook that provides create, update, and delete mutations for an entity type
 * Handles cache updates, navigation, and error handling for all operations
 */
export function useEntityMutations<
	T extends { id: string },
	TData extends Record<string, unknown> = Record<string, unknown>,
>(options: UseEntityMutationsOptions<T, TData>) {
	const {
		entityName,
		subject,
		listKeys,
		detailKey,
		navigateTo,
		navigateBack,
		setErrorMessage,
		createOptimisticEntity,
		entity,
		pendingDeleteIds,
	} = options;

	const createMutation = useCreateEntityMutation<T, TData>({
		entityName,
		subject,
		listKeys,
		detailKey,
		...(navigateTo ? { navigateTo } : {}),
		...(navigateBack ? { navigateBack } : {}),
		setErrorMessage: setErrorMessage ?? (() => {}),
		createOptimisticEntity:
			createOptimisticEntity ??
			(() => {
				throw new Error("createOptimisticEntity is required for create mutation");
			}),
	});

	const updateMutation = useUpdateEntityMutation<T, TData>({
		entityName,
		subject,
		listKeys,
		detailKey,
		...(navigateTo ? { navigateTo } : {}),
		...(navigateBack ? { navigateBack } : {}),
		setErrorMessage: setErrorMessage ?? (() => {}),
		createOptimisticEntity: (entity, data) => {
			const optimisticEntity = {
				...entity,
				...data,
			} as T & Record<string, unknown>;

			// Only increment version if it exists
			const record = optimisticEntity as Record<string, unknown>;
			if (typeof record.version === "number") {
				record.version = record.version + 1;
			}

			return optimisticEntity;
		},
		...(entity ? { entity } : {}),
	});

	const deleteMutation = useDeleteEntityMutation<T>({
		entityName,
		subject,
		listKeys,
		detailKey,
		...(navigateTo ? { navigateTo } : {}),
		...(navigateBack ? { navigateBack } : {}),
		setErrorMessage: setErrorMessage ?? (() => {}),
		pendingDeleteIds: pendingDeleteIds ?? new Set(),
	});

	return {
		createMutation,
		updateMutation,
		deleteMutation,
	};
}
