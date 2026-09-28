/**
 * Excel's row gutter: the number down the left-hand side.
 *
 * It earns its width by doing three jobs at once — it says which row you are on,
 * it shows whether that row has unsaved changes, and its bottom edge is the row's
 * resize handle.
 */

import type { ReactNode } from 'react'
import { classNames } from '../../shared/classNames'
import type { RowChangeKind } from '../core/types'

interface GridRowGutterCellProps {
	/**
	 * 1-based display position.
	 *
	 * The *view* position, not the source index, so the numbers read 1..n after a
	 * sort rather than showing where each row came from — the same as a
	 * spreadsheet, where row 1 is always the top row on screen.
	 */
	rowNumber: number

	/** Tints the gutter to show the selection covers this row. */
	isInSelection: boolean

	/** Why this row is dirty, or `null` when it is clean or the marks are hidden. */
	changeKind: RowChangeKind | null

	/** A `<ResizeHandle>`, or `null` when row resizing is off. */
	resizeHandle: ReactNode
}

const CHANGE_LABELS: Record<RowChangeKind, string> = {
	added: 'Added, not yet saved',
	edited: 'Changed, not yet saved',
}

/** A glyph as well as a colour, so the mark survives greyscale and colour blindness. */
const CHANGE_GLYPHS: Record<RowChangeKind, string> = {
	added: '+',
	edited: '*',
}

function GridRowGutterCell({ rowNumber, isInSelection, changeKind, resizeHandle }: GridRowGutterCellProps) {
	return (
		<th
			className={classNames(
				'grid-row-number',
				isInSelection && 'grid-row-number-active',
				changeKind && `grid-row-number-${changeKind}`
			)}
			scope="row"
			aria-colindex={1}
		>
			<span className="grid-row-index">{rowNumber}</span>

			{changeKind && (
				/* `title` is what makes the glyph self-explanatory the first time
				 * someone sees it — the mark is an affordance for the eye, the
				 * tooltip carries the meaning. */
				<span className="grid-row-marker" title={CHANGE_LABELS[changeKind]}>
					{CHANGE_GLYPHS[changeKind]}
				</span>
			)}

			{resizeHandle}
		</th>
	)
}

export default GridRowGutterCell
