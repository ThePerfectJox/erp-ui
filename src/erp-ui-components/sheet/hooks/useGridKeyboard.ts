/**
 * The keyboard map.
 *
 * One handler on the table, not one per cell: the events are raised on the
 * focused cell and bubble, so a single listener covers the whole grid and there
 * is one place to read to find out what a key does.
 *
 * | Key | Does |
 * | --- | --- |
 * | arrows | move one cell |
 * | `Shift` + arrows | extend the selection |
 * | `Tab` / `Shift+Tab` | next / previous cell, wrapping at the row ends, out of the grid at the far corners |
 * | `Enter` | edit, or commit and move down |
 * | `F2` | edit |
 * | any character | starts overwriting |
 * | `Esc` | deselect |
 * | `Ctrl+A` | select everything |
 * | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | copy / cut / paste |
 * | `Delete` / `Backspace` | clear the selected cells |
 * | `Home` / `End` | first / last column of the row |
 * | `Ctrl+Home` / `Ctrl+End` | first / last cell of the grid |
 */

import type { KeyboardEvent } from 'react'
import { advanceWrapping } from '../core/gridSelection'
import type { CellRange } from '../core/gridSelection'
import type { GridEditingApi } from './useGridEditing'
import type { GridSelectionApi } from './useGridSelection'
import type { GridWriter } from './useGridWriter'

interface UseGridKeyboardOptions {
	rowCount: number
	columnCount: number
	range: CellRange | null
	isEditable: boolean
	selection: GridSelectionApi
	editing: GridEditingApi
	writer: GridWriter
}

export function useGridKeyboard({
	rowCount,
	columnCount,
	range,
	isEditable,
	selection,
	editing,
	writer,
}: UseGridKeyboardOptions): (event: KeyboardEvent<HTMLElement>) => void {
	return event => {
		/* An open editor owns the keyboard. Its own handler stops propagation, so
		 * this is belt and braces for anything raised elsewhere. */
		if (editing.isEditing || !selection.selection) {
			return
		}

		const { focus } = selection.selection
		const isExtending = event.shiftKey

		/* metaKey as well as ctrlKey, so the shortcuts work on a Mac without a
		 * second set of cases. */
		const isModified = event.ctrlKey || event.metaKey

		if (isModified && (event.key === 'a' || event.key === 'A')) {
			event.preventDefault()
			selection.selectAll()
			return
		}

		/* Copy, cut and paste are left alone. Intercepting the keystroke would mean
		 * reaching for the async clipboard API and its permission prompt; ignoring
		 * it lets the browser raise a real copy/paste event, which the clipboard
		 * handlers answer with synchronous access. */
		if (isModified && ['c', 'x', 'v', 'C', 'X', 'V'].includes(event.key)) {
			return
		}

		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault()
				selection.select({ row: focus.row - 1, column: focus.column }, isExtending)
				return

			case 'ArrowDown':
				event.preventDefault()
				selection.select({ row: focus.row + 1, column: focus.column }, isExtending)
				return

			case 'ArrowLeft':
				event.preventDefault()
				selection.select({ row: focus.row, column: focus.column - 1 }, isExtending)
				return

			case 'ArrowRight':
				event.preventDefault()
				selection.select({ row: focus.row, column: focus.column + 1 }, isExtending)
				return

			case 'Tab': {
				/* Wraps at the row ends, and deliberately never extends — Excel
				 * treats Tab as "next cell", never as "grow the selection". */
				const next = advanceWrapping(focus, event.shiftKey ? -1 : 1, rowCount, columnCount)

				/* At the very first or last cell the step is clamped, so Tab would
				 * do nothing at all. Handing it to the browser instead lets focus
				 * leave the grid, which is the only way out by keyboard — a grid
				 * that swallows every Tab is a keyboard trap (WCAG 2.1.2).
				 *
				 * The selection is not cleared here. Focus moving away raises
				 * `focusout`, and `DataGrid` clears on that in one place rather than
				 * every route out doing it separately. */
				if (next.row === focus.row && next.column === focus.column) {
					return
				}

				event.preventDefault()
				selection.select(next, false)
				return
			}

			case 'Home':
				event.preventDefault()
				selection.select(isModified ? { row: 0, column: 0 } : { row: focus.row, column: 0 }, isExtending)
				return

			case 'End':
				event.preventDefault()
				selection.select(
					isModified
						? { row: rowCount - 1, column: columnCount - 1 }
						: { row: focus.row, column: columnCount - 1 },
					isExtending
				)
				return

			case 'Enter':
			case 'F2':
				event.preventDefault()
				editing.begin(focus, null)
				return

			case 'Delete':
			case 'Backspace':
				event.preventDefault()

				if (range && isEditable) {
					writer.clearRange(range)
				}

				return

			case 'Escape':
				selection.clear()
				return

			default:
				/* A printable character starts an edit and becomes the new value.
				 * Length 1 is the test for printable — it excludes every named key
				 * ("Shift", "ArrowUp", "F5") without needing a list of them.
				 * Modifier combinations are excluded so Ctrl+P still prints. */
				if (event.key.length === 1 && !isModified) {
					event.preventDefault()
					editing.begin(focus, event.key)
				}
		}
	}
}
