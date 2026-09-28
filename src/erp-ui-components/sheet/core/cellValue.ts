/**
 * Turning stored values into cell text and back again.
 *
 * Three small pure functions, and they are separated out because they are the
 * grid's only contact with the *meaning* of a value. Display, the clipboard,
 * typing and pasting all funnel through these, so a column that formats its
 * numbers formats them identically in all four places without any of those code
 * paths knowing how.
 */

import type { CellAlign, GridColumn, GridRow } from './types'

/**
 * Cell text for display and for the clipboard — always the same string.
 *
 * Deliberately one function for both. If display and copy could disagree, a
 * total shown as `18.40` would arrive in Excel as `18.4`, and a user reconciling
 * two windows would be comparing two different numbers.
 */
export function formatCell(column: GridColumn, row: GridRow): string {
	const value = row[column.key]

	if (column.format) {
		return column.format(value, row)
	}

	/* Empty rather than "null"/"undefined", which is what String() would give
	 * and what would then land in Excel. */
	if (value === null || value === undefined) {
		return ''
	}

	return String(value)
}

/** Pasted or typed text back into a stored value. */
export function parseCell(column: GridColumn, text: string): unknown {
	if (column.parse) {
		return column.parse(text)
	}

	const trimmed = text.trim()

	if (trimmed === '') {
		return null
	}

	if (column.type === 'number') {
		const asNumber = Number(trimmed)

		/* Unparseable text is kept as text rather than becoming null or NaN.
		 * Someone pasting a column with one bad cell should see the bad cell and
		 * be able to fix it, not find out later that it was thrown away. */
		return Number.isNaN(asNumber) ? text : asNumber
	}

	return text
}

/** Explicit alignment if the column set one, otherwise the one its type implies. */
export function resolveAlign(column: GridColumn): CellAlign {
	/* Numbers right, everything else left — so a column of amounts lines up on
	 * its last digit, which is the only way the magnitudes can be compared. */
	return column.align ?? (column.type === 'number' ? 'end' : 'start')
}
