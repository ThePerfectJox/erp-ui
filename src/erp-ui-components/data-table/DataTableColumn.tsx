/**
 * erp-ui-components/data-table/DataTableColumn.tsx
 *
 * One header cell. Every column sorts — clicking the label cycles
 * DataTable's sort state for this column through none -> asc -> desc -> none.
 * Purely presentational: DataTable owns the actual sort state and passes
 * back only this column's current direction (or null when it's not the
 * active sort column).
 */

import type { DataTableColumnDef } from "./dataTableUtils";

interface DataTableColumnProps<T extends object> {
	column: DataTableColumnDef<T>;
	sortDirection: "asc" | "desc" | null;
	onSort: (key: Extract<keyof T, string>) => void;
}

export default function DataTableColumn<T extends object>({
	column,
	sortDirection,
	onSort,
}: DataTableColumnProps<T>) {
	const indicator = sortDirection === "asc" ? "▲" : sortDirection === "desc" ? "▼" : "⇅";

	return (
		<th className="data-table-th" scope="col" aria-sort={
			sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none"
		}>
			<button
				type="button"
				className="data-table-sort-button"
				onClick={() => onSort(column.key)}
			>
				<span>{column.label}</span>
				<span className="data-table-sort-indicator" aria-hidden="true">{indicator}</span>
			</button>
		</th>
	);
}
