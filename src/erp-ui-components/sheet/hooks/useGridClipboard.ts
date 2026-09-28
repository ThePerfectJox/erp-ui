/**
 * Copy, cut and paste against Excel.
 *
 * These are handlers for the browser's own `copy`/`cut`/`paste` events, which is
 * the whole design: inside those events `clipboardData` is synchronously
 * readable and writable, with no permission prompt and no secure-context
 * requirement. `navigator.clipboard` needs both. The keyboard handler
 * deliberately lets `Ctrl+C` through untouched so that these fire.
 *
 * The formats themselves — the TSV and HTML flavours Excel actually speaks —
 * live in `core/clipboard.ts`.
 */

import type { ClipboardEvent } from 'react'
import { formatCell } from '../core/cellValue'
import { readFromClipboard, writeToClipboard } from '../core/clipboard'
import { clampAddress, pasteTargetSize } from '../core/gridSelection'
import type { CellRange, CellSelection } from '../core/gridSelection'
import type { GridColumn, GridViewRow } from '../core/types'
import type { GridWriter } from './useGridWriter'

export interface GridClipboardApi {
	handleCopy: (event: ClipboardEvent<HTMLElement>) => void
	handleCut: (event: ClipboardEvent<HTMLElement>) => void
	handlePaste: (event: ClipboardEvent<HTMLElement>) => void

	/** The selected cells as text. Also used by Delete, via the writer. */
	readSelectionAsMatrix: () => string[][]
}

interface UseGridClipboardOptions {
	columns: readonly GridColumn[]
	viewRows: readonly GridViewRow[]
	range: CellRange | null
	rowCount: number
	columnCount: number
	isEditing: boolean
	isEditable: boolean
	canGrowOnPaste?: boolean
	writer: GridWriter
	replaceSelection: (selection: CellSelection) => void
}

export function useGridClipboard({
	columns,
	viewRows,
	range,
	rowCount,
	columnCount,
	isEditing,
	isEditable,
	canGrowOnPaste,
	writer,
	replaceSelection,
}: UseGridClipboardOptions): GridClipboardApi {
	const readSelectionAsMatrix = (): string[][] => {
		if (!range) {
			return []
		}

		const matrix: string[][] = []

		for (let rowIndex = range.top; rowIndex <= range.bottom; rowIndex += 1) {
			const line: string[] = []

			for (let columnIndex = range.left; columnIndex <= range.right; columnIndex += 1) {
				line.push(formatCell(columns[columnIndex], viewRows[rowIndex].row))
			}

			matrix.push(line)
		}

		return matrix
	}

	return {
		readSelectionAsMatrix,

		handleCopy: event => {
			/* While an editor is open the events belong to it, so the browser's own
			 * text copy inside the input keeps working. */
			if (isEditing || !range) {
				return
			}

			event.preventDefault()
			writeToClipboard(event.clipboardData, readSelectionAsMatrix())
		},

		handleCut: event => {
			if (isEditing || !range) {
				return
			}

			event.preventDefault()
			writeToClipboard(event.clipboardData, readSelectionAsMatrix())

			if (isEditable) {
				writer.clearRange(range)
			}
		},

		handlePaste: event => {
			if (isEditing || !range || !isEditable) {
				return
			}

			const pasted = readFromClipboard(event.clipboardData)

			if (pasted.length === 0) {
				return
			}

			event.preventDefault()

			const pastedColumns = Math.max(...pasted.map(pastedRow => pastedRow.length))
			const target = pasteTargetSize(range, pasted.length, pastedColumns)

			/* Built to the target size rather than pasted as-is, so a single copied
			 * cell fills the whole selected range — Excel's behaviour, and the
			 * fastest way to set one value down a column. The modulo also repeats a
			 * ragged block cleanly instead of leaving holes. */
			const block = Array.from({ length: target.rows }, (_unused, rowOffset) =>
				Array.from({ length: target.columns }, (_alsoUnused, columnOffset) => {
					const sourceRow = pasted[rowOffset % pasted.length]

					return sourceRow[columnOffset % sourceRow.length] ?? ''
				})
			)

			writer.writeBlock(range.top, range.left, block)

			/* The selection grows to cover what landed, so it is obvious what just
			 * changed — and a follow-up Ctrl+C copies exactly the pasted block. */
			const reachableRows = canGrowOnPaste ? Math.max(rowCount, range.top + target.rows) : rowCount

			replaceSelection({
				anchor: { row: range.top, column: range.left },
				focus: clampAddress(
					{ row: range.top + target.rows - 1, column: range.left + target.columns - 1 },
					reachableRows,
					columnCount
				),
			})
		},
	}
}
