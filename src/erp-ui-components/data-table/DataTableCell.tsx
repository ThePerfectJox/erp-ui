// One body cell. Editable columns render an always-live `<input>`; everything
// else renders as plain text.

import type { DataTableColumnDef } from "./dataTableUtils";

interface DataTableCellProps<T extends object> {
	column: DataTableColumnDef<T>;
	value: unknown;
	onChange: (rawValue: string) => void;
}

export default function DataTableCell<T extends object>({ column, value, onChange }: DataTableCellProps<T>) {
	// A column with no value for this row (missing field, stale/mismatched
	// data) should read as blank, not the literal text "undefined"/"null".
	const displayValue = value === null || value === undefined ? "" : String(value);

	if (!column.editable) {
		return <td className="data-table-cell">{displayValue}</td>;
	}

	return (
		<td className="data-table-cell data-table-cell-editable">
			<input
				type="text"
				className="data-table-cell-input"
				value={displayValue}
				onChange={(event) => onChange(event.target.value)}
			/>
		</td>
	);
}
