/**
 * erp-ui-components/data-table/DataTableRow.tsx
 *
 * One body row: a checkbox cell plus one DataTableCell per column. Purely
 * presentational — receives the already-merged "effective" (post-edit) row
 * and forwards each column's current value down; DataTable owns the actual
 * selection/edit state.
 */

import type { DataTableColumnDef } from "./dataTableUtils";
import DataTableCell from "./DataTableCell";

interface DataTableRowProps<T extends object> {
	id: string;
	columns: DataTableColumnDef<T>[];
	effectiveRow: T;
	selected: boolean;
	onToggleSelect: (id: string) => void;
	onEditCell: (id: string, key: Extract<keyof T, string>, rawValue: string) => void;
}

export default function DataTableRow<T extends object>({
	id,
	columns,
	effectiveRow,
	selected,
	onToggleSelect,
	onEditCell,
}: DataTableRowProps<T>) {
	return (
		<tr className={selected ? "data-table-row data-table-row-selected" : "data-table-row"}>
			<td className="data-table-cell data-table-checkbox-cell">
				<input
					type="checkbox"
					checked={selected}
					onChange={() => onToggleSelect(id)}
					aria-label="Select row"
				/>
			</td>
			{columns.map((column) => (
				<DataTableCell
					key={column.key}
					column={column}
					value={effectiveRow[column.key]}
					onChange={(rawValue) => onEditCell(id, column.key, rawValue)}
				/>
			))}
		</tr>
	);
}
