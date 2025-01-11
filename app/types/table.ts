export type CellRenderer<T> = (props: {
	value: any;
	row: T;
}) => React.ReactNode;

export interface TableColumn<T> {
	key: keyof T;
	header: string;
	render?: CellRenderer<T>;
}

export type TableDefinition<T> = TableColumn<T>[];
