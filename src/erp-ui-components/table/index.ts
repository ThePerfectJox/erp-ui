/**
 * Read-only tables.
 *
 * ```tsx
 * import { ViewTable, TablePagination, useTablePagination } from './erp-ui-components/table'
 * import type { TableColumn } from './erp-ui-components/table'
 * ```
 *
 * `ViewTable` is the component — read its doc comment first, including the table in it
 * comparing this with `DataGrid`. The short version: if the user types into it, use
 * `DataGrid`; if they read it and click through to something, use this.
 *
 * -----------------------------------------------------------------------------
 * Paging is composed, not built in
 * -----------------------------------------------------------------------------
 * `ViewTable` renders the rows it is given and has no idea whether they are a page of
 * something larger. `useTablePagination` and `<TablePagination>` wrap around it:
 *
 * ```tsx
 * const pager = useTablePagination({ totalRows: orders.length, pageSize: 20 })
 *
 * <ViewTable caption="Orders" columns={COLUMNS} rows={pager.slice(orders)} />
 * <TablePagination {...pager} rowNoun="orders" />
 * ```
 *
 * That is what lets one table serve a 12-row list with no pager, a 500-row list paged in
 * the browser, and a 50,000-row list paged on a server — none of which the table has to
 * know about. For the server case, pass the server's total, skip `slice`, and let `page`
 * drive the next request.
 *
 * -----------------------------------------------------------------------------
 * How the folder is laid out
 * -----------------------------------------------------------------------------
 * - `core/` — the data contract, cell text and alignment, page arithmetic. No React.
 * - `hooks/` — sorting, selection, paging. Each controllable.
 * - `parts/` — header cell, select cell, loading skeleton. Internal.
 * - `Table.css` — one stylesheet, with a note on every decision where it deliberately
 *   disagrees with `DataGrid.css`.
 *
 * Sorting itself is not in here. It is `shared/sortRows`, the same module `DataGrid` uses,
 * so two tables on one screen cannot disagree about where the blank rows go.
 */

export { default as ViewTable } from './ViewTable'
export type { ViewTableProps } from './ViewTable'

export { default as TablePagination } from './TablePagination'

export { useTablePagination } from './hooks/useTablePagination'
export type { TablePaginationApi } from './hooks/useTablePagination'

export { useTableSelection } from './hooks/useTableSelection'
export type { TableSelectionApi } from './hooks/useTableSelection'

export { useTableSort } from './hooks/useTableSort'
export type { TableSortApi } from './hooks/useTableSort'

/* --- Building blocks -----------------------------------------------------
 * For a table this folder does not have. The page arithmetic in particular is worth
 * reusing rather than rewriting — every one of those functions has an off-by-one in it
 * that has already been found once. */
export { clampPage, pageCount, pageRange, pageSlice } from './core/pagination'
export type { PageRange } from './core/pagination'

export { formatCellText, resolveCellAlign, resolveSortValue } from './core/cellText'

export type {
	TableCellAlign,
	TableColumn,
	TableColumnType,
	TableDensity,
	TableFooterRow,
	TableHideBelow,
	TableRow,
	TableSelectionMode,
	TableSort,
} from './core/types'
