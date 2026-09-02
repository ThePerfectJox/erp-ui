/**
 * erp-ui-components/data-table/dataTableUtils.ts
 *
 * Plain data logic for the data-table module — no React, no JSX. Row
 * normalization, sorting and the value comparator live here instead of
 * inline in DataTable.tsx so that component stays focused on rendering and
 * wiring, and this logic can be read (and tested) on its own.
 */

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableColumnDef<T extends object> {
	key: Extract<keyof T, string>;
	label: string;
	editable?: boolean;
}

export interface DataTableSortState<T extends object> {
	key: Extract<keyof T, string>;
	direction: DataTableSortDirection;
}

export interface NormalizedRow<T> {
	id: string;
	original: T;
}

/**
 * Array data: `getRowId(row)` if given, else `${idNamespace}-row-${index}`.
 * Dictionary data: its own keys, `getRowId` is not consulted.
 */
export function normalizeRows<T extends object>(
	data: T[] | Record<string, T>,
	getRowId: ((row: T) => string) | undefined,
	idNamespace: string,
): NormalizedRow<T>[] {
	if (Array.isArray(data)) {
		return data.map((row, index) => ({
			id: getRowId ? getRowId(row) : `${idNamespace}-row-${index}`,
			original: row,
		}));
	}
	return Object.entries(data).map(([key, row]) => ({ id: key, original: row }));
}

/** Numbers compare numerically, everything else via localeCompare; nils always sort last. */
export function compareValues(a: unknown, b: unknown): number {
	const aNil = a === null || a === undefined;
	const bNil = b === null || b === undefined;
	if (aNil || bNil) return aNil && bNil ? 0 : aNil ? 1 : -1;
	if (typeof a === "number" && typeof b === "number") return a - b;
	return String(a).localeCompare(String(b));
}

/** Sorts by the *effective* (post-edit) value of the sorted column. Returns `rows` unchanged when `sortState` is null. */
export function sortRows<T extends object>(
	rows: NormalizedRow<T>[],
	edits: Record<string, Partial<T>>,
	sortState: DataTableSortState<T> | null,
): NormalizedRow<T>[] {
	if (!sortState) return rows;
	const directionMultiplier = sortState.direction === "asc" ? 1 : -1;
	return [...rows].sort((a, b) => {
		// `edits[id]` types as `Partial<T>` rather than `Partial<T> | undefined` because
		// noUncheckedIndexedAccess is off — but `{ ...undefined }` is a safe no-op at runtime.
		const aValue = ({ ...a.original, ...edits[a.id] } as T)[sortState.key];
		const bValue = ({ ...b.original, ...edits[b.id] } as T)[sortState.key];
		return compareValues(aValue, bValue) * directionMultiplier;
	});
}

/** Coerces an edited input string back to the original value's type, so sort stays consistent post-edit. */
export function coerceEditedValue(originalValue: unknown, rawValue: string): unknown {
	if (typeof originalValue === "number") {
		const parsed = Number(rawValue);
		return Number.isNaN(parsed) ? rawValue : parsed;
	}
	if (typeof originalValue === "boolean") return rawValue === "true";
	return rawValue;
}
