export interface PageInfo {
	currentPage: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
}

export interface Page<T> {
	items: T[];
	pageInfo?: PageInfo;
}
