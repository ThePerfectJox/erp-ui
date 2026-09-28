/**
 * The table's behaviour, one hook per concern.
 *
 * `ViewTable` composes the first two itself. The third is deliberately **not** used by
 * the table — paging is the caller's, so that the same table works for a list that fits
 * on one page, one paged in the browser, and one paged on the server.
 *
 * All three follow the same controlled/uncontrolled pattern: pass the state and they
 * report changes, leave it off and they keep it. For `useTableSort` that distinction goes
 * further than ownership — controlled means the caller is also doing the ordering. Its
 * doc comment explains why.
 */

export { useTablePagination } from './useTablePagination'
export type { TablePaginationApi } from './useTablePagination'

export { useTableSelection } from './useTableSelection'
export type { TableSelectionApi } from './useTableSelection'

export { useTableSort } from './useTableSort'
export type { TableSortApi } from './useTableSort'
