/**
 * Selection geometry for the grid. All pure, so the awkward parts — clamping at
 * the edges, normalising a range dragged upwards or leftwards — can be reasoned
 * about and tested without a DOM.
 */

/** A single cell, by zero-based row and column index. */
export interface CellAddress {
	row: number
	column: number
}

/**
 * A selection as the user made it: the cell they started from and the cell they
 * ended on. `focus` may be above or to the left of `anchor`.
 *
 * Kept in this form rather than as a normalised rectangle because the anchor has
 * to survive. Shift-clicking repeatedly, or holding shift and arrowing back and
 * forth, all extend from the *original* cell — and a rectangle has forgotten
 * which corner that was.
 */
export interface CellSelection {
	anchor: CellAddress
	focus: CellAddress
}

/** A normalised inclusive rectangle. `top <= bottom` and `left <= right`. */
export interface CellRange {
	top: number
	left: number
	bottom: number
	right: number
}

/** Normalises a selection into a rectangle, whichever way it was dragged. */
export function toRange(selection: CellSelection): CellRange {
	return {
		top: Math.min(selection.anchor.row, selection.focus.row),
		bottom: Math.max(selection.anchor.row, selection.focus.row),
		left: Math.min(selection.anchor.column, selection.focus.column),
		right: Math.max(selection.anchor.column, selection.focus.column),
	}
}

export function isWithinRange(range: CellRange, row: number, column: number): boolean {
	return row >= range.top && row <= range.bottom && column >= range.left && column <= range.right
}

/** Inclusive, so a single cell is 1 × 1 rather than 0 × 0. */
export function rangeSize(range: CellRange): { rows: number; columns: number } {
	return {
		rows: range.bottom - range.top + 1,
		columns: range.right - range.left + 1,
	}
}

/**
 * Holds an address inside the grid.
 *
 * Every movement goes through this, so arrowing off an edge stops at it instead
 * of selecting a cell that is not there. Returns a valid address for an empty
 * grid too — `{ row: 0, column: 0 }` — which callers guard by checking the row
 * count before using it.
 */
export function clampAddress(address: CellAddress, rowCount: number, columnCount: number): CellAddress {
	return {
		row: Math.max(0, Math.min(address.row, rowCount - 1)),
		column: Math.max(0, Math.min(address.column, columnCount - 1)),
	}
}

/**
 * Moves an address by a step, wrapping at the row ends the way Tab does in
 * Excel: off the right edge continues on the next row, off the left edge goes
 * back to the end of the previous one. Stops dead at the very first and last
 * cell rather than wrapping around the whole grid.
 *
 * Only used for Tab and Shift+Tab. Arrow keys clamp instead — an arrow that
 * teleported you to another row would be disorienting.
 */
export function advanceWrapping(
	address: CellAddress,
	step: number,
	rowCount: number,
	columnCount: number
): CellAddress {
	if (rowCount === 0 || columnCount === 0) {
		return { row: 0, column: 0 }
	}

	/* Flattening to a single index makes the wrap fall out of the arithmetic
	 * instead of needing four boundary cases. */
	const flat = address.row * columnCount + address.column + step
	const total = rowCount * columnCount

	const clamped = Math.max(0, Math.min(flat, total - 1))

	return {
		row: Math.floor(clamped / columnCount),
		column: clamped % columnCount,
	}
}

/**
 * The block of addresses a paste would cover, given where it landed and how big
 * the pasted data is.
 *
 * Excel's rule, which this follows: pasting a single cell into a selected range
 * fills the whole range, and pasting a block anywhere else lands at the
 * top-left corner and extends as far as the data goes — regardless of how much
 * was selected. So one value can be stamped across a column, but a 3 × 4 block
 * is never silently clipped to fit a 2 × 2 selection.
 */
export function pasteTargetSize(
	selection: CellRange,
	pastedRows: number,
	pastedColumns: number
): { rows: number; columns: number } {
	if (pastedRows === 1 && pastedColumns === 1) {
		const size = rangeSize(selection)

		return { rows: size.rows, columns: size.columns }
	}

	return { rows: pastedRows, columns: pastedColumns }
}
