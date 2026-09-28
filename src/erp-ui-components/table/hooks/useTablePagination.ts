/**
 * Paging, kept outside the table on purpose.
 *
 * `ViewTable` renders whatever rows it is given and has no idea whether they are a page
 * of something larger. That separation is what lets the same table serve a 12-row list
 * with no pager, a 500-row list paged in the browser, and a 50,000-row list paged on the
 * server — none of which the table has to know about.
 *
 * ```tsx
 * const pager = useTablePagination({ totalRows: rows.length, pageSize: 20 })
 *
 * <ViewTable caption="Orders" columns={COLUMNS} rows={pager.slice(rows)} />
 * <TablePagination {...pager} />
 * ```
 *
 * For server-side paging, pass the server's total and slice nothing — feed the table the
 * rows the server returned and let `page` drive the next request.
 */

import { useState } from 'react'
import { clampPage, pageCount, pageRange, pageSlice } from '../core/pagination'
import type { PageRange } from '../core/pagination'

export interface TablePaginationApi {
	/** The current page, 1-based and always inside the range that exists. */
	page: number

	pageSize: number

	/** How many pages the row count needs. At least 1. */
	pageCount: number

	/** `{ first, last, total }` for the "21–40 of 137" readout. */
	range: PageRange

	/** False when everything fits on one page — the pager renders nothing. */
	hasPages: boolean

	goToPage: (page: number) => void
	goToPreviousPage: () => void
	goToNextPage: () => void

	/**
	 * The rows for the current page.
	 *
	 * Skip it for server-side paging, where the rows handed to the table are already the
	 * page.
	 */
	slice: <TRow>(rows: readonly TRow[]) => TRow[]
}

interface UseTablePaginationOptions {
	/** Total rows across every page. For server paging this is the server's count. */
	totalRows: number

	/** Rows per page. Defaults to 20. */
	pageSize?: number

	/** Controlled page. */
	page?: number

	onPageChange?: (page: number) => void

	/** Starting page when uncontrolled. Defaults to 1. */
	defaultPage?: number
}

export function useTablePagination({
	totalRows,
	pageSize = 20,
	page,
	onPageChange,
	defaultPage = 1,
}: UseTablePaginationOptions): TablePaginationApi {
	const [uncontrolledPage, setUncontrolledPage] = useState(defaultPage)

	const isControlled = page !== undefined

	/* Clamped on the way out rather than corrected in state. The row count can shrink
	 * under a page number — someone filters a list while on page 7 — and clamping here
	 * means they land on the last page with rows instead of a blank table, without this
	 * hook having to run an effect to notice and write back a corrected page. */
	const currentPage = clampPage(isControlled ? page : uncontrolledPage, totalRows, pageSize)

	const total = pageCount(totalRows, pageSize)

	const goToPage = (nextPage: number) => {
		const clamped = clampPage(nextPage, totalRows, pageSize)

		if (!isControlled) {
			setUncontrolledPage(clamped)
		}

		onPageChange?.(clamped)
	}

	return {
		page: currentPage,
		pageSize,
		pageCount: total,
		range: pageRange(totalRows, currentPage, pageSize),
		hasPages: total > 1,
		goToPage,
		goToPreviousPage: () => goToPage(currentPage - 1),
		goToNextPage: () => goToPage(currentPage + 1),
		slice: rows => pageSlice(rows, currentPage, pageSize),
	}
}
