/**
 * One column heading: the label, the sort control and the resize handle.
 *
 * Presentational. It is told whether it is sorted and which way; it does not
 * know what clicking will do next. The three-state cycle lives in
 * `core/SortState.ts`, which is the only place that has to be read to know what
 * happens on the third click.
 */

import type { ReactNode } from 'react'
import { resolveAlign } from '../core/cellValue'
import type { SortDirection } from '../../shared/sortRows'
import type { GridColumn } from '../core/types'

interface GridHeaderCellProps {
	column: GridColumn

	/** 1-based and counting the row gutter, as ARIA wants it. */
	ariaColIndex: number

	/** The direction this column is sorted, or `null` if it is not. */
	sortDirection: SortDirection | null

	isSortable: boolean

	/** A `<ResizeHandle>`, or `null` when resizing is off for this column. */
	resizeHandle: ReactNode

	onSort: () => void
}

function GridHeaderCell({ column, ariaColIndex, sortDirection, isSortable, resizeHandle, onSort }: GridHeaderCellProps) {
	return (
		<th
			className="grid-header"
			scope="col"
			aria-colindex={ariaColIndex}
			/* The one ARIA attribute that matters on a sortable header: it is how a
			 * screen reader announces the current direction rather than just
			 * "sortable". Absent — not "none" — when this column is not the sorted
			 * one, so only one header ever claims a direction. */
			aria-sort={sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
			style={{ textAlign: resolveAlign(column) }}
		>
			{isSortable ? (
				/* A real button, so the header is reachable by keyboard and announced
				 * as pressable. A click handler on the <th> alone would be neither. */
				<button type="button" className="grid-header-button" onClick={onSort}>
					<span className="grid-header-label">{column.header}</span>
					<span
						className={sortDirection ? `grid-sort-arrow grid-sort-arrow-${sortDirection}` : 'grid-sort-arrow'}
						aria-hidden="true"
					/>
				</button>
			) : (
				<span className="grid-header-label grid-header-label-static">{column.header}</span>
			)}

			{resizeHandle}
		</th>
	)
}

export default GridHeaderCell
