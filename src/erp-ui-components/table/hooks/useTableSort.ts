/**
 * Which column the table is sorted by, and the rows in that order.
 */

import { useMemo, useState } from 'react'
import { computeOrder, cycleSort } from '../../shared/sortRows'
import { resolveSortValue } from '../core/cellText'
import type { TableColumn, TableRow, TableSort } from '../core/types'

export interface TableSortApi {
	/** The sort to show in the headers, or `null` for the order the rows arrived in. */
	sort: TableSort | null

	/** The rows in display order. The same array when nothing is sorted. */
	sortedRows: readonly TableRow[]

	/** Cycles a column: ascending, descending, back to the original order. */
	sortByColumn: (column: TableColumn) => void
}

interface UseTableSortOptions {
	rows: readonly TableRow[]
	columns: readonly TableColumn[]

	/**
	 * Controlled sort. Supplied means the **caller** owns both the state and the
	 * ordering — see the note below.
	 */
	sort?: TableSort | null

	/** Fires with the next sort. Required for the controlled form to be any use. */
	onSortChange?: (sort: TableSort | null) => void

	/** Starting sort when uncontrolled. A list report usually opens sorted. */
	defaultSort?: TableSort | null

	/** Turns sorting off entirely. Headers render as plain text. */
	isDisabled?: boolean
}

/**
 * -----------------------------------------------------------------------------
 * Controlled sorting is not just "who holds the state"
 * -----------------------------------------------------------------------------
 * When `sort` is supplied this hook **stops reordering the rows**. It reports which
 * column is sorted so the header can draw its arrow, and calls `onSortChange`, and
 * hands `rows` back untouched.
 *
 * That is the point of it. A list report over ten thousand rows sorts on the server:
 * the click goes out as a query parameter, new rows come back already ordered, and a
 * client-side sort on top would either be wasted work or — if the page only holds the
 * first fifty of those rows — actively wrong, because sorting one page of a sorted set
 * is not sorting the set.
 *
 * Uncontrolled, it sorts in memory, which is right for the few hundred rows that are
 * already on the client.
 */
export function useTableSort({
	rows,
	columns,
	sort,
	onSortChange,
	defaultSort = null,
	isDisabled,
}: UseTableSortOptions): TableSortApi {
	const [uncontrolledSort, setUncontrolledSort] = useState<TableSort | null>(defaultSort)

	const isControlled = sort !== undefined
	const activeSort = isControlled ? sort : uncontrolledSort

	const sortedRows = useMemo(() => {
		/* Controlled means the rows arrive in the order they should be shown in. */
		if (isControlled || isDisabled || !activeSort) {
			return rows
		}

		const column = columns.find(candidate => candidate.key === activeSort.columnKey)

		/* The sorted column is gone — the caller changed its column set while a sort was
		 * applied. Falling back to the original order is the only honest reading; the
		 * alternative is sorting by a column nobody can see. */
		if (!column) {
			return rows
		}

		const order = computeOrder(
			rows,
			row => resolveSortValue(column, row),
			activeSort.direction,
			column.compare
		)

		return order.map(index => rows[index])
	}, [rows, columns, activeSort, isControlled, isDisabled])

	return {
		sort: isDisabled ? null : activeSort,
		sortedRows,

		sortByColumn: column => {
			if (isDisabled || column.isSortable === false) {
				return
			}

			const nextSort = cycleSort(activeSort, column.key)

			if (!isControlled) {
				setUncontrolledSort(nextSort)
			}

			onSortChange?.(nextSort)
		},
	}
}
