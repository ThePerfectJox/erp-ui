/**
 * The view: which rows are shown, in what order.
 *
 * Sorting is a *view*, never an edit. The rows are never moved — what changes is
 * an array of source indices saying where each row appears. That is what lets
 * `onChange` hand rows back in their original document sequence however the user
 * has the grid sorted, and it is why clicking a header can never quietly rewrite
 * a purchase order's item numbering.
 */

import { useMemo, useState } from 'react'
import { computeOrder, cycleSort } from '../core/gridSort'
import type { GridSort } from '../core/gridSort'
import type { GridColumn, GridRow, GridViewRow } from '../core/types'

export interface GridView {
	/** The rows in display order, each carrying its source index. */
	viewRows: readonly GridViewRow[]

	rowCount: number

	/**
	 * The sort to show in the headers, or `null` for document order.
	 *
	 * Not the same as the sort that was last clicked: it reads `null` while the
	 * order is stale, so the arrow disappears at the same moment the rows fall
	 * back to document order rather than claiming a sort that is not applied.
	 */
	activeSort: GridSort | null

	/** Cycles this column: ascending, descending, back to document order. */
	sortByColumn: (column: GridColumn) => void

	/** Puts freshly appended source rows at the end of the current order. */
	appendToOrder: (sourceIndices: readonly number[]) => void
}

interface UseGridViewOptions {
	rows: readonly GridRow[]
}

/**
 * Note what this hook does *not* do: it never touches the selection or the open
 * editor, even though re-sorting invalidates both. They are addressed by visual
 * position, and moving every row out from under them would leave a selection
 * highlighting cells the user never chose — with a following `Ctrl+C` copying
 * them.
 *
 * Clearing them is `DataGrid`'s job instead, in one visible line next to the sort
 * call. Done here it would need a callback, and the callback would have to come
 * from hooks that cannot exist yet — the selection needs a row count, which comes
 * from this hook's own output.
 */
export function useGridView({ rows }: UseGridViewOptions): GridView {
	const [sort, setSort] = useState<GridSort | null>(null)

	/**
	 * Source row indices in display order, or `null` for document order.
	 *
	 * Held as state rather than derived with `useMemo`, and that is the whole
	 * trick behind sorting that is usable while editing. Derived, the order would
	 * recompute the instant a sorted cell changed and the row would leap
	 * somewhere else mid-edit — taking the selection, which is addressed by
	 * visual position, onto a different record. Frozen until the user asks for a
	 * new sort, the view holds still.
	 */
	const [frozenOrder, setFrozenOrder] = useState<number[] | null>(null)

	/**
	 * A length mismatch means `rows` was replaced from outside — reloaded from the
	 * server, filtered upstream — and the frozen indices no longer refer to the
	 * rows they were computed for.
	 */
	const isOrderStale = frozenOrder !== null && frozenOrder.length !== rows.length

	const viewRows = useMemo(() => {
		/* Falling back to document order is the only safe reading of a stale
		 * order; the alternative is showing the wrong data under the right
		 * headings. */
		if (!frozenOrder || frozenOrder.length !== rows.length) {
			return rows.map((row, sourceIndex) => ({ row, sourceIndex }))
		}

		return frozenOrder.map(sourceIndex => ({ row: rows[sourceIndex], sourceIndex }))
	}, [rows, frozenOrder])

	const sortByColumn = (column: GridColumn) => {
		if (column.isSortable === false) {
			return
		}

		const nextSort = cycleSort(isOrderStale ? null : sort, column.key)

		/* An accessor rather than a key, so a derived column sorts too — see the
		 * note on `sortValue` in the column type. */
		const getValue = column.sortValue ?? ((row: GridRow) => row[column.key])

		setSort(nextSort)
		setFrozenOrder(nextSort ? computeOrder(rows, getValue, nextSort.direction, column.compare) : null)
	}

	const appendToOrder = (sourceIndices: readonly number[]) => {
		if (sourceIndices.length === 0) {
			return
		}

		/* Only meaningful while a sort is applied. Appending to the order keeps the
		 * current arrangement and drops the new rows at the bottom where they were
		 * pasted, rather than sorting them into the middle of the table the moment
		 * they appear — which would separate them from the cursor that created
		 * them. */
		setFrozenOrder(current => (current ? [...current, ...sourceIndices] : current))
	}

	return {
		viewRows,
		rowCount: viewRows.length,
		activeSort: isOrderStale ? null : sort,
		sortByColumn,
		appendToOrder,
	}
}
