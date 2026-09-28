/**
 * One data cell, and the editor when it is the cell being edited.
 *
 * Presentational, with one piece of judgement in it: a press that landed *inside*
 * an open editor is not a cell press. Without that distinction, clicking into the
 * middle of the text you are typing to fix a character reads as "select this
 * cell", which moves focus to the `<td>`, blurs the input and commits the edit
 * half-finished.
 */

import type { KeyboardEvent, MouseEvent } from 'react'
import { classNames } from '../../shared/classNames'
import { formatCell, resolveAlign } from '../core/cellValue'
import type { CellAddress } from '../core/gridSelection'
import type { GridColumn, GridRow } from '../core/types'

interface GridCellProps {
	column: GridColumn
	row: GridRow

	/** Visual position. What every gesture is expressed in. */
	rowIndex: number
	columnIndex: number

	/** 1-based and counting the row gutter, as ARIA wants it. */
	ariaColIndex: number

	/** Inside the selected range. */
	isSelected: boolean

	/** *The* active cell — where typing goes and what the arrows move from. */
	isFocused: boolean

	/** Carries the grid's single tab stop. See the note on the roving tabindex. */
	isTabStop: boolean

	/** The editor's text while this cell is being edited, `null` when it is not. */
	editDraft: string | null

	onPress: (event: MouseEvent<HTMLElement>, address: CellAddress) => void
	onHover: (address: CellAddress) => void
	onOpenEditor: (address: CellAddress) => void
	onDraftChange: (draft: string) => void
	onEditorKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
	onEditorCommit: () => void
}

function GridCell({
	column,
	row,
	rowIndex,
	columnIndex,
	ariaColIndex,
	isSelected,
	isFocused,
	isTabStop,
	editDraft,
	onPress,
	onHover,
	onOpenEditor,
	onDraftChange,
	onEditorKeyDown,
	onEditorCommit,
}: GridCellProps) {
	const address: CellAddress = { row: rowIndex, column: columnIndex }
	const isEditing = editDraft !== null

	/** True for an event raised by the editor rather than by the cell itself. */
	const isFromEditor = (event: MouseEvent<HTMLElement>) => isEditing && event.target !== event.currentTarget

	return (
		<td
			className={classNames(
				'grid-cell',
				isSelected && 'grid-cell-selected',
				isFocused && 'grid-cell-focused',
				column.isReadOnly && 'grid-cell-readonly'
			)}
			role="gridcell"
			aria-colindex={ariaColIndex}
			aria-selected={isSelected}
			aria-readonly={column.isReadOnly ? true : undefined}
			/* How `select` finds the cell to focus. A query beats a ref per cell:
			 * hundreds of refs to keep in step against one lookup per keystroke. */
			data-row={rowIndex}
			data-column={columnIndex}
			/* Roving tabindex: exactly one cell is tabbable, so Tab enters and leaves
			 * the grid as a single stop instead of walking every cell. */
			tabIndex={isTabStop ? 0 : -1}
			style={{ textAlign: resolveAlign(column) }}
			onMouseDown={event => {
				if (isFromEditor(event)) {
					return
				}

				onPress(event, address)
			}}
			onMouseEnter={() => onHover(address)}
			onDoubleClick={event => {
				/* Double-clicking a word inside the editor selects it. It must not also
				 * be read as "open the editor", which would reset the draft. */
				if (isFromEditor(event)) {
					return
				}

				onOpenEditor(address)
			}}
		>
			{isEditing ? (
				<input
					className="grid-editor"
					value={editDraft}
					/* Autofocus rather than an effect, so focus arrives on the render
					 * that creates the input instead of one frame later. */
					autoFocus
					aria-label={`${column.header}, row ${rowIndex + 1}`}
					onChange={event => onDraftChange(event.target.value)}
					onKeyDown={onEditorKeyDown}
					/* Clicking away commits rather than discarding. Losing typing to a
					 * stray click is the kind of thing that makes people distrust a
					 * grid. Escape is the way to abandon an edit. */
					onBlur={onEditorCommit}
				/>
			) : (
				formatCell(column, row)
			)}
		</td>
	)
}

export default GridCell
