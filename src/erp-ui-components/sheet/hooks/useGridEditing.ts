/**
 * The cell editor: when it is open, what is in it, and how it closes.
 *
 * Only one cell is ever editable at a time, so this is a single nullable piece of
 * state rather than anything per-cell. The draft lives here too — not in the
 * input — so that committing is a decision the grid makes, not something that
 * depends on an uncontrolled DOM node still being mounted.
 */

import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import { formatCell } from '../core/cellValue'
import type { CellAddress } from '../core/gridSelection'
import type { GridColumn, GridEdit, GridViewRow } from '../core/types'
import type { GridWriter } from './useGridWriter'

export interface GridEditingApi {
	/** Non-null only while an editor is open. */
	editing: GridEdit | null

	isEditing: boolean

	/**
	 * Opens the editor.
	 *
	 * `initialText` of `null` means carry on from the existing value — Enter, F2,
	 * a double-click. A string means the user started typing, and that character
	 * replaces the old value, as it does in Excel.
	 */
	begin: (address: CellAddress, initialText: string | null) => void

	/** Writes the draft back. `moveBy` then moves the selection relative to the cell. */
	commit: (moveBy: CellAddress | null) => void

	/** Throws the draft away. */
	cancel: () => void

	setDraft: (draft: string) => void

	handleEditorKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
}

interface UseGridEditingOptions {
	columns: readonly GridColumn[]
	viewRows: readonly GridViewRow[]
	isEditable: boolean
	writer: GridWriter

	/** Moves the selection after a commit. Supplied by the selection hook. */
	select: (address: CellAddress, isExtending: boolean) => void
}

export function useGridEditing({
	columns,
	viewRows,
	isEditable,
	writer,
	select,
}: UseGridEditingOptions): GridEditingApi {
	const [editing, setEditing] = useState<GridEdit | null>(null)

	const commit = (moveBy: CellAddress | null) => {
		if (!editing) {
			return
		}

		writer.writeBlock(editing.row, editing.column, [[editing.draft]])
		setEditing(null)

		if (moveBy) {
			select({ row: editing.row + moveBy.row, column: editing.column + moveBy.column }, false)
		}
	}

	return {
		editing,
		isEditing: editing !== null,
		commit,
		cancel: () => setEditing(null),

		begin: (address, initialText) => {
			if (!isEditable) {
				return
			}

			const column = columns[address.column]
			const viewRow = viewRows[address.row]

			if (!column || !viewRow || column.isReadOnly) {
				return
			}

			setEditing({
				row: address.row,
				column: address.column,
				draft: initialText ?? formatCell(column, viewRow.row),
			})
		},

		setDraft: draft => setEditing(current => (current ? { ...current, draft } : current)),

		handleEditorKeyDown: event => {
			/* Kept off the grid's own handler, or Enter would commit the edit and
			 * then immediately be read again as "start editing the cell below". */
			event.stopPropagation()

			if (event.key === 'Enter') {
				event.preventDefault()
				commit({ row: 1, column: 0 })
				return
			}

			if (event.key === 'Tab') {
				event.preventDefault()
				commit({ row: 0, column: event.shiftKey ? -1 : 1 })
				return
			}

			if (event.key === 'Escape') {
				event.preventDefault()
				setEditing(null)
			}
		},
	}
}
