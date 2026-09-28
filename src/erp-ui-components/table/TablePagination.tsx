import type { PageRange } from './core/pagination'
import './Table.css'

interface TablePaginationProps {
	/** The current page, 1-based. */
	page: number

	pageCount: number

	/** `{ first, last, total }` — what the readout describes. */
	range: PageRange

	/** False when everything fits on one page. Nothing is rendered then. */
	hasPages: boolean

	goToPreviousPage: () => void
	goToNextPage: () => void

	/**
	 * The unit being counted, plural — `"orders"`, `"items"`.
	 *
	 * Worth setting. "21–40 of 137 orders" tells the reader what they are looking at;
	 * "21–40 of 137" makes them work it out from the table above.
	 */
	rowNoun?: string
}

/**
 * The pager that goes under a `<ViewTable>`.
 *
 * ```tsx
 * const pager = useTablePagination({ totalRows: orders.length, pageSize: 20 })
 *
 * <ViewTable caption="Orders" columns={COLUMNS} rows={pager.slice(orders)} />
 * <TablePagination {...pager} rowNoun="orders" />
 * ```
 *
 * Spreadable straight from the hook, which is why the props mirror its return shape
 * rather than being a tidier subset. `slice` and `goToPage` come along unused and are
 * ignored.
 *
 * -----------------------------------------------------------------------------
 * Previous and next, and no numbered pages
 * -----------------------------------------------------------------------------
 * Numbered page buttons look more capable and are worse here. They need a truncation
 * scheme once there are more than about seven pages — `1 … 4 5 6 … 42` — and that is a
 * pile of arithmetic in service of a gesture nobody uses: people do not navigate to page
 * 23 of a list report, they refine the filter until the list is short.
 *
 * What they do need is to know *where they are*, which is the readout's job, and to be
 * able to step. The readout is a live region so stepping is announced — otherwise a
 * screen reader user presses Next and hears nothing, because the page number is not
 * where their focus is.
 */
function TablePagination({
	page,
	pageCount,
	range,
	hasPages,
	goToPreviousPage,
	goToNextPage,
	rowNoun,
}: TablePaginationProps) {
	/* One page means there is nothing to navigate. Rendering a pair of disabled buttons
	 * would be furniture that says only "this control does not apply to you". */
	if (!hasPages) {
		return null
	}

	const isFirstPage = page <= 1
	const isLastPage = page >= pageCount

	return (
		/* `nav` with a name, so it is a landmark a screen reader can jump to — and so two
		 * paged tables on one screen are told apart. */
		<nav className="table-pagination" aria-label={`Pagination${rowNoun ? `, ${rowNoun}` : ''}`}>
			{/* Built as one string rather than interpolated across several JSX children.
			  * Each child is a separate text node, and a live region whose contents change
			  * as five separate nodes is announced by some screen readers as five
			  * fragments — "21", "40", "of", "137", "orders" — instead of as one sentence.
			  * One node, one announcement. */}
			<p className="table-pagination-range" aria-live="polite">
				{`${range.first}–${range.last} of ${range.total}${rowNoun ? ` ${rowNoun}` : ''}`}
			</p>

			<div className="table-pagination-controls">
				{/* Plain <button>s rather than the form folder's <Button>. This is a pager,
				  * not an action bar: styling them as house buttons would give a quiet
				  * navigation control the same weight as Save. */}
				<button
					type="button"
					className="table-pagination-button"
					disabled={isFirstPage}
					onClick={goToPreviousPage}
				>
					Previous
				</button>

				<span className="table-pagination-page">{`Page ${page} of ${pageCount}`}</span>

				<button
					type="button"
					className="table-pagination-button"
					disabled={isLastPage}
					onClick={goToNextPage}
				>
					Next
				</button>
			</div>
		</nav>
	)
}

export default TablePagination
