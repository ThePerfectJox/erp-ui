/**
 * Turning a stored value into the text a cell shows.
 *
 * The read-only counterpart of the grid's `cellValue.ts`, and deliberately smaller:
 * there is no `parse` here, because nothing in a report is typed in and so nothing has
 * to be read back.
 */

import type { TableCellAlign, TableColumn, TableRow } from './types'

/**
 * The cell's text.
 *
 * Used for display, and — importantly — as the value the default sort reads when a
 * column has no `sortValue`. Not used when a column has `render`, which replaces the
 * text entirely.
 */
export function formatCellText(column: TableColumn, row: TableRow): string {
	const value = row[column.key]

	if (column.format) {
		return column.format(value, row)
	}

	/* Empty rather than the words "null" or "undefined", which is what String() would
	 * give. A blank cell reads as "no value"; the word "null" reads as a bug, and on a
	 * printed report it is one. */
	if (value === null || value === undefined) {
		return ''
	}

	return String(value)
}

/** Explicit alignment if the column set one, otherwise the one its type implies. */
export function resolveCellAlign(column: TableColumn): TableCellAlign {
	/* Numbers right, everything else left — so a column of amounts lines up on its last
	 * digit, which is the only way the magnitudes can be compared down the column. */
	return column.align ?? (column.type === 'number' ? 'end' : 'start')
}

/**
 * The value a column sorts on.
 *
 * Precedence is: the column's own `sortValue`, then the raw stored value. Note that it
 * is the **raw** value rather than the formatted text — `format` is for humans, and
 * sorting `"1,200.00"` as a string puts it before `"900.00"`.
 */
export function resolveSortValue(column: TableColumn, row: TableRow): unknown {
	return column.sortValue ? column.sortValue(row) : row[column.key]
}
