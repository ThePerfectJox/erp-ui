/**
 * Column and row size arithmetic.
 *
 * The rule the whole grid rests on, stated once here: **every column has a
 * definite pixel width.** There is no flexing, no percentage, no measuring the
 * container.
 *
 * That is not a simplification, it is the point. A grid that shares out leftover
 * space between its columns cannot be resized like a spreadsheet: drag one
 * column narrower and the others quietly absorb the space, so the total never
 * changes, the grid never scrolls, and "make every column narrow" or "make every
 * column wide" are both impossible to express. Definite widths give up
 * auto-fitting and get Excel's behaviour in exchange — the widths are whatever
 * the user made them, and the container scrolls to suit.
 *
 * Filling the parent when the columns happen to be narrower than it is handled
 * in CSS instead, by a trailing filler column that soaks up the difference. See
 * `DataGrid.css`.
 */

import type { GridColumn } from './types'

/** Column key to the width the user dragged it to, in pixels. */
export type ColumnWidthOverrides = Readonly<Record<string, number>>

/** Row id to the height the user dragged it to, in pixels. */
export type RowHeightOverrides = Readonly<Record<string, number>>

/**
 * A column's width in pixels.
 *
 * Precedence is: what the user dragged, then what the caller declared, then the
 * grid's default. A dragged width always wins — once someone has sized a column
 * by hand it has to stay where they put it, which is what makes the drag feel
 * like it stuck. Double-clicking the handle drops the override and hands the
 * column back to its declared width.
 */
export function resolveColumnWidth(
	column: GridColumn,
	overrides: ColumnWidthOverrides,
	fallbackWidth: number
): number {
	return overrides[column.key] ?? column.width ?? fallbackWidth
}

/** A row's height in pixels: what the user dragged it to, or the default. */
export function resolveRowHeight(rowId: string, overrides: RowHeightOverrides, fallbackHeight: number): number {
	return overrides[rowId] ?? fallbackHeight
}

/**
 * How wide the table is: the row gutter plus every column.
 *
 * Exact, not an estimate, because `box-sizing: border-box` is set globally — so a
 * declared column width already includes that column's 1px grid line and the
 * widths sum to the table's content box with nothing left over. Without that the
 * total would run a pixel per column short and the grid would show a permanent
 * hairline horizontal scrollbar.
 */
export function measureTableWidth(
	columns: readonly GridColumn[],
	overrides: ColumnWidthOverrides,
	fallbackWidth: number,
	gutterWidth: number
): number {
	return columns.reduce(
		(total, column) => total + resolveColumnWidth(column, overrides, fallbackWidth),
		gutterWidth
	)
}

/**
 * Where a resize drag has got to: the size it started at plus how far the
 * pointer has moved, held above a floor.
 *
 * The floor is not politeness. Without it a drag past the left edge of a column
 * gives a negative width, which collapses the column to nothing and leaves no
 * handle to drag it back out with — the column is gone for the rest of the
 * session.
 */
export function resizeTo(startSize: number, delta: number, minimumSize: number): number {
	return Math.max(minimumSize, startSize + delta)
}
