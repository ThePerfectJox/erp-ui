// Self-contained sortable/selectable/inline-editable table — state lives
// here via plain useState (no controlling hook, no context), sort/compare/
// edit logic lives in ./dataTableUtils.ts. Unchecking a row's checkbox (or
// "select all") reverts that row's edits back to its original data.

import { useId, useState, type ReactNode } from "react";
import {
	coerceEditedValue,
	normalizeRows,
	sortRows,
	type DataTableColumnDef,
	type DataTableSortState,
} from "./dataTableUtils";
import DataTableColumn from "./DataTableColumn";
import DataTableRow from "./DataTableRow";

import "./index.css";

export interface DataTableProps<T extends object> {
	/** DOM id for the table's root container. Falls back to useId() when omitted. */
	id?: string;
	data: T[] | Record<string, T>;
	columns: DataTableColumnDef<T>[];
	/** Only consulted when `data` is an array — dictionary keys are the row ids otherwise. */
	getRowId?: (row: T) => string;
	/** Fires with the current (possibly edited) row objects, and their ids, whenever selection changes. */
	onSelectionChange?: (selectedRows: T[], selectedIds: string[]) => void;
	/** Rendered below the table, fully built and wired by the caller. */
	actions?: ReactNode;
}

export default function DataTable<T extends object>({
	id,
	data,
	columns,
	getRowId,
	onSelectionChange,
	actions,
}: DataTableProps<T>) {
	const uniqueId = useId();
	const finalId = id ?? uniqueId;

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [edits, setEdits] = useState<Record<string, Partial<T>>>({});
	const [sortState, setSortState] = useState<DataTableSortState<T> | null>(null);

	const normalizedRows = normalizeRows(data, getRowId, finalId);
	const sortedRows = sortRows(normalizedRows, edits, sortState);

	function notifySelectionChange(nextSelectedIds: Set<string>, nextEdits: Record<string, Partial<T>>) {
		if (!onSelectionChange) return;
		const selectedRows = normalizedRows
			.filter((row) => nextSelectedIds.has(row.id))
			.map((row) => ({ ...row.original, ...nextEdits[row.id] }) as T);
		onSelectionChange(selectedRows, Array.from(nextSelectedIds));
	}

	function handleSort(key: Extract<keyof T, string>) {
		setSortState((previous) => {
			if (!previous || previous.key !== key) return { key, direction: "asc" };
			if (previous.direction === "asc") return { key, direction: "desc" };
			return null;
		});
	}

	function handleToggleSelect(rowId: string) {
		const isSelected = selectedIds.has(rowId);
		const nextSelectedIds = new Set(selectedIds);
		let nextEdits = edits;

		if (isSelected) {
			nextSelectedIds.delete(rowId);
			if (rowId in edits) {
				nextEdits = { ...edits };
				delete nextEdits[rowId];
			}
		} else {
			nextSelectedIds.add(rowId);
		}

		setSelectedIds(nextSelectedIds);
		if (nextEdits !== edits) setEdits(nextEdits);
		notifySelectionChange(nextSelectedIds, nextEdits);
	}

	function handleSelectAll(checked: boolean) {
		if (checked) {
			const nextSelectedIds = new Set(normalizedRows.map((row) => row.id));
			setSelectedIds(nextSelectedIds);
			notifySelectionChange(nextSelectedIds, edits);
			return;
		}

		const nextEdits = { ...edits };
		selectedIds.forEach((rowId) => {
			delete nextEdits[rowId];
		});
		setEdits(nextEdits);
		setSelectedIds(new Set());
		notifySelectionChange(new Set(), nextEdits);
	}

	function handleEditCell(rowId: string, key: Extract<keyof T, string>, rawValue: string) {
		const row = normalizedRows.find((candidate) => candidate.id === rowId);
		const originalValue = row ? row.original[key] : undefined;
		const coerced = coerceEditedValue(originalValue, rawValue);

		const nextEdits = { ...edits, [rowId]: { ...edits[rowId], [key]: coerced } };
		const nextSelectedIds = selectedIds.has(rowId) ? selectedIds : new Set(selectedIds).add(rowId);

		setEdits(nextEdits);
		if (nextSelectedIds !== selectedIds) setSelectedIds(nextSelectedIds);
		notifySelectionChange(nextSelectedIds, nextEdits);
	}

	const allSelected = normalizedRows.length > 0 && selectedIds.size === normalizedRows.length;

	return (
		<div className="data-table-container" id={finalId}>
			<table className="data-table">
				<thead>
					<tr>
						<th className="data-table-th data-table-checkbox-cell" scope="col">
							<input
								type="checkbox"
								checked={allSelected}
								onChange={(event) => handleSelectAll(event.target.checked)}
								aria-label="Select all rows"
							/>
						</th>
						{columns.map((column) => (
							<DataTableColumn
								key={column.key}
								column={column}
								sortDirection={sortState?.key === column.key ? sortState.direction : null}
								onSort={handleSort}
							/>
						))}
					</tr>
				</thead>
				<tbody>
					{sortedRows.map((row) => (
						<DataTableRow
							key={row.id}
							id={row.id}
							columns={columns}
							effectiveRow={{ ...row.original, ...edits[row.id] } as T}
							selected={selectedIds.has(row.id)}
							onToggleSelect={handleToggleSelect}
							onEditCell={handleEditCell}
						/>
					))}
				</tbody>
			</table>
			{actions && <div className="data-table-actions">{actions}</div>}
		</div>
	);
}
