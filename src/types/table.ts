import type { ReactNode } from "react";

export type CellRenderer<T, K extends keyof T> = (props: { value: T[K]; row: T }) => ReactNode;

export interface TableColumn<T, K extends keyof T = keyof T> {
	key: K;
	header: string;
	render?: CellRenderer<T, K>;
}

export type TableDefinition<T> = TableColumn<T>[];
