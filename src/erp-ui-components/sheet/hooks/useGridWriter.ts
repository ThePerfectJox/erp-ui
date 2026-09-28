/**
 * The only way data gets changed.
 *
 * Typing in a cell, pasting a block and pressing Delete are all one operation —
 * "write this rectangle of text starting here" — so they are one function.
 * Read-only columns, the grid's bounds, the visual-to-source mapping and the
 * dirty set are therefore respected identically by all three, and only one of
 * them has to be got right.
 */

import { parseCell } from '../core/cellValue'
import { rangeSize } from '../core/gridSelection'
import type { CellRange } from '../core/gridSelection'
import type { GridChangeInfo, GridColumn, GridDirtyRows, GridRow, GridViewRow, RowChangeKind } from '../core/types'

/** A rectangle of text to write. Outer array is rows. */
export type WriteBlock = readonly (readonly string[])[]

export interface GridWriter {
	/**
	 * Writes a block of text starting at a visual cell.
	 *
	 * Silently skips what it cannot write — read-only columns, and rows past the
	 * end unless the grid may grow. Skipping rather than refusing the whole write
	 * is deliberate: pasting a five-column block over a table whose third column
	 * is calculated should fill the four it can.
	 */
	writeBlock: (visualTop: number, left: number, block: WriteBlock) => void

	/** Blanks every cell in a range. */
	clearRange: (range: CellRange) => void
}

interface UseGridWriterOptions {
	rows: readonly GridRow[]
	columns: readonly GridColumn[]
	viewRows: readonly GridViewRow[]
	isEditable: boolean
	canGrowOnPaste?: boolean
	dirtyRows: GridDirtyRows
	identify: (row: GridRow, sourceIndex: number) => string
	publishDirtyRows: (next: Map<string, RowChangeKind>) => void

	/** Adds appended source rows to the display order, so a sort keeps its shape. */
	appendToOrder: (sourceIndices: readonly number[]) => void

	onChange?: (rows: GridRow[], change: GridChangeInfo) => void
}

export function useGridWriter({
	rows,
	columns,
	viewRows,
	isEditable,
	canGrowOnPaste,
	dirtyRows,
	identify,
	publishDirtyRows,
	appendToOrder,
	onChange,
}: UseGridWriterOptions): GridWriter {
	const writeBlock = (visualTop: number, left: number, block: WriteBlock) => {
		if (!onChange || !isEditable) {
			return
		}

		/* Copied before writing: `rows` is a prop and mutating it would change the
		 * parent's state behind its back, which React does not see and will not
		 * re-render for. */
		const nextRows: GridRow[] = rows.map(row => ({ ...row }))
		const nextDirty = new Map(dirtyRows)
		const changedRowIds: string[] = []
		const appendedOrder: number[] = []

		let hasChanged = false

		block.forEach((blockRow, rowOffset) => {
			const visualIndex = visualTop + rowOffset

			let sourceIndex: number
			let isNewRow = false

			if (visualIndex < viewRows.length) {
				sourceIndex = viewRows[visualIndex].sourceIndex
			} else if (canGrowOnPaste) {
				/* Every column present, so the new row's shape matches the existing
				 * ones — a row missing keys reads as undefined everywhere
				 * downstream. */
				const blank: GridRow = {}

				for (const column of columns) {
					blank[column.key] = null
				}

				sourceIndex = nextRows.length
				nextRows.push(blank)
				appendedOrder.push(sourceIndex)
				isNewRow = true
			} else {
				return
			}

			let hasRowChanged = false

			blockRow.forEach((text, columnOffset) => {
				const column = columns[left + columnOffset]

				if (!column || column.isReadOnly) {
					return
				}

				const nextValue = parseCell(column, text)

				/* Compared before writing, so re-entering the same value does not
				 * mark a row dirty. Retyping a value and getting an unsaved-changes
				 * warning for it is the kind of small lie that stops people trusting
				 * the indicator at all. */
				if (nextRows[sourceIndex][column.key] === nextValue) {
					return
				}

				nextRows[sourceIndex][column.key] = nextValue
				hasRowChanged = true
			})

			if (!hasRowChanged) {
				return
			}

			hasChanged = true

			const rowId = identify(nextRows[sourceIndex], sourceIndex)

			changedRowIds.push(rowId)

			/* "added" outranks "edited". A row that was pasted in and then typed
			 * over is still an insert, and downgrading it to an update would make
			 * the save PATCH a record the server has never seen. */
			nextDirty.set(rowId, isNewRow || nextDirty.get(rowId) === 'added' ? 'added' : 'edited')
		})

		if (!hasChanged) {
			return
		}

		appendToOrder(appendedOrder)
		onChange(nextRows, { changedRowIds, dirtyRows: nextDirty })
		publishDirtyRows(nextDirty)
	}

	return {
		writeBlock,

		clearRange: range => {
			const size = rangeSize(range)
			const blanks = Array.from({ length: size.rows }, () => Array.from({ length: size.columns }, () => ''))

			writeBlock(range.top, range.left, blanks)
		},
	}
}
