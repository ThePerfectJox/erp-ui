import { classNames } from '../shared/classNames'
import { formatCellText, resolveCellAlign } from './core/cellText'
import type {
	TableColumn,
	TableDensity,
	TableFooterRow,
	TableRow,
	TableSelectionMode,
	TableSort,
} from './core/types'
import { useTableSelection } from './hooks/useTableSelection'
import { useTableSort } from './hooks/useTableSort'
import { TableHeaderCell, TableSelectCell, TableSkeleton } from './parts'
import './Table.css'

/** How many placeholder rows a loading table shows. */
const SKELETON_ROW_COUNT = 5

export interface ViewTableProps {
	columns: readonly TableColumn[]

	/**
	 * The rows to show.
	 *
	 * If they are a page of something larger, slice them yourself — see
	 * `useTablePagination`. This component renders what it is given.
	 */
	rows: readonly TableRow[]

	/**
	 * Names the table, and is shown above it. Required: a table of numbers with no
	 * caption is unusable with a screen reader, and this is one line of text.
	 */
	caption: string

	/** Hides the caption visually. It stays available to assistive technology. */
	isCaptionHidden?: boolean

	/** Appends the row count to the caption — "Items (24)". The Fiori list-report habit. */
	hasRowCount?: boolean

	/**
	 * Stable identity for a row. Used as the React key and as the id selection is tracked
	 * by, so pass one as soon as you care about selection: with the index fallback,
	 * re-sorting moves a tick onto a different record.
	 *
	 * Defaults to the row's position.
	 */
	getRowId?: (row: TableRow, index: number) => string

	// --- sorting -------------------------------------------------------------

	/**
	 * Controlled sort. Supplying it means **you** order the rows — the table stops
	 * sorting and only draws the arrow. That is what server-side sorting needs; see
	 * `useTableSort`.
	 */
	sort?: TableSort | null

	onSortChange?: (sort: TableSort | null) => void

	/** Starting sort when uncontrolled. */
	defaultSort?: TableSort | null

	/** Turns sorting off for the whole table. Headers become plain text. */
	isSortDisabled?: boolean

	// --- selection -----------------------------------------------------------

	/** Defaults to `"none"`. See {@link TableSelectionMode}. */
	selectionMode?: TableSelectionMode

	/** Controlled selection, by row id. */
	selectedRowIds?: readonly string[]

	onSelectionChange?: (rowIds: string[]) => void

	/**
	 * Builds the checkbox's accessible name for a row. Strongly recommended once
	 * selection is on.
	 *
	 * ```tsx
	 * getRowLabel={row => `order ${row.documentNumber}`}
	 * ```
	 *
	 * Without it every checkbox is announced as "Select row 4", which is not a thing a
	 * user can act on. The row's text is in sibling cells and nothing ties it to the
	 * control.
	 */
	getRowLabel?: (row: TableRow, index: number) => string

	// --- interaction ---------------------------------------------------------

	/**
	 * Fires when a row is clicked. Gives rows a pointer cursor and a hover highlight.
	 *
	 * **A pointer convenience, not the keyboard path.** A `<tr>` is not focusable, and
	 * making it one would put a tab stop on every row — forty of them on a forty-row
	 * table — and announce each as a nameless control. So the keyboard route has to be a
	 * real control inside a cell, via a column's `render`:
	 *
	 * ```tsx
	 * { key: 'documentNumber', header: 'Order',
	 *   render: row => <a href={`/orders/${row.documentNumber}`}>{row.documentNumber}</a> }
	 * ```
	 *
	 * With that link present, this prop is a shortcut for the mouse and nothing is lost
	 * without it. Without the link, the table is mouse-only.
	 */
	onRowClick?: (row: TableRow, rowId: string) => void

	// --- presentation --------------------------------------------------------

	/** `"cozy"` by default. See {@link TableDensity}. */
	density?: TableDensity

	/**
	 * Alternating row fills.
	 *
	 * On by default. On a wide table the stripe is what stops the eye drifting to the
	 * wrong row between the first column and the last, which is the one error a report
	 * cannot afford.
	 */
	hasZebraStripes?: boolean

	/** Caps the height and scrolls, with the header staying put. Any CSS length. */
	maxHeight?: string

	/** A summary row along the bottom. See {@link TableFooterRow}. */
	footerRow?: TableFooterRow

	// --- states --------------------------------------------------------------

	/** Shows placeholder rows instead of the data. */
	isLoading?: boolean

	/** Shown when there are no rows. Say what would put some here. */
	emptyText?: string

	className?: string
}

/**
 * A read-only table for reports and lists.
 *
 * ```tsx
 * <ViewTable
 *     caption="Purchase orders"
 *     hasRowCount
 *     columns={[
 *         { key: 'documentNumber', header: 'Order', isNoWrap: true },
 *         { key: 'supplier', header: 'Supplier' },
 *         { key: 'status', header: 'Status', render: row => <StatusBadge value={row.status} /> },
 *         { key: 'netValue', header: 'Net value', type: 'number',
 *           format: value => EURO.format(Number(value)) },
 *     ]}
 *     rows={orders}
 *     getRowId={row => String(row.documentNumber)}
 *     defaultSort={{ columnKey: 'documentNumber', direction: 'desc' }}
 *     onRowClick={order => open(order)}
 * />
 * ```
 *
 * -----------------------------------------------------------------------------
 * This or `DataGrid`?
 * -----------------------------------------------------------------------------
 * | | `ViewTable` | `DataGrid` |
 * | --- | --- | --- |
 * | What it is for | reading | editing |
 * | Cell content | anything — badges, links, buttons | text |
 * | Columns | size to their content | fixed pixel widths, draggable |
 * | Selecting | whole rows, with checkboxes | cell ranges, like a spreadsheet |
 * | Clipboard | the browser's own text selection | copies and pastes as TSV to Excel |
 * | Also has | paging, loading state, footer row | undo-free editing, dirty-row marks |
 *
 * The short version: if the user types into it, use `DataGrid`. If they read it and click
 * through to something, use this. Reaching for the grid because it looks more capable
 * gets you a spreadsheet where a report belongs — fixed column widths, no room for a
 * status badge, and a cell cursor implying an edit that is not possible.
 *
 * -----------------------------------------------------------------------------
 * How it is put together
 * -----------------------------------------------------------------------------
 * `core/` is the pure layer, `hooks/` holds sorting and selection, `parts/` holds the
 * header cell, the select cell and the loading skeleton. Sorting itself is
 * `shared/sortRows`, the same module `DataGrid` uses, so two tables on one screen cannot
 * disagree about where the blank rows go.
 *
 * Paging is deliberately *not* in here — `useTablePagination` plus `<TablePagination>`
 * compose around it, which is what lets the same table serve a list that fits on one
 * page and one paged on a server.
 *
 * **Not in here**, so you are not surprised later: no virtualisation, so this is built
 * for hundreds of rows per page rather than tens of thousands; no column reordering,
 * grouping, tree rows or row expansion; no built-in filtering or search, which belong in
 * a toolbar above it rather than inside the table.
 */
function ViewTable({
	columns,
	rows,
	caption,
	isCaptionHidden,
	hasRowCount,
	getRowId,
	sort,
	onSortChange,
	defaultSort = null,
	isSortDisabled,
	selectionMode = 'none',
	selectedRowIds,
	onSelectionChange,
	getRowLabel,
	onRowClick,
	density = 'cozy',
	hasZebraStripes = true,
	maxHeight,
	footerRow,
	isLoading,
	emptyText = 'No data',
	className,
}: ViewTableProps) {
	const identify = (row: TableRow, index: number) => (getRowId ? getRowId(row, index) : String(index))

	const sorting = useTableSort({ rows, columns, sort, onSortChange, defaultSort, isDisabled: isSortDisabled })

	const visibleRowIds = sorting.sortedRows.map(identify)

	const selection = useTableSelection({
		mode: selectionMode,
		visibleRowIds,
		selectedRowIds,
		onSelectionChange,
	})

	const columnCount = columns.length + (selection.isEnabled ? 1 : 0)
	const isEmpty = !isLoading && sorting.sortedRows.length === 0

	return (
		<div className={classNames('table-frame', className)}>
			<p className={classNames('table-caption', isCaptionHidden && 'erp-visually-hidden')}>
				{caption}
				{/* One interpolated string rather than `({rows.length})` across three JSX
				  * children, which renders as three separate text nodes. Cosmetic here;
				  * genuinely load-bearing in the pager's live region — see
				  * `TablePagination`. */}
				{hasRowCount && <span className="table-caption-count">{`(${rows.length})`}</span>}
			</p>

			{/* The scrollport. Both axes: a wide table scrolls sideways instead of
			  * squeezing its columns, and `maxHeight` turns it into a pane with a sticky
			  * header. */}
			<div className="table-scroll" style={maxHeight ? { maxHeight } : undefined}>
				<table
					className={classNames(
						'table',
						`table-density-${density}`,
						hasZebraStripes && 'table-zebra',
						onRowClick && 'table-clickable-rows'
					)}
					/* Not `role="grid"`. This is a plain table, and claiming otherwise would
					 * promise a screen reader the two-dimensional cell navigation that only
					 * DataGrid implements. */
					aria-label={caption}
					/* Announces the wait once, rather than the skeleton announcing itself
					 * forty times. The skeleton rows are aria-hidden. */
					aria-busy={isLoading ? true : undefined}
				>
					<thead className="table-head">
						<tr>
							{selection.isEnabled && selectionMode === 'multiple' && (
								<TableSelectCell
									mode="multiple"
									isHeader
									isChecked={selection.isAllSelected}
									isIndeterminate={selection.isPartiallySelected}
									label="Select all rows on this page"
									onToggle={selection.toggleAll}
								/>
							)}

							{/* Single-selection has no "select all" to offer, but the column
							  * still has to exist or the header and body would be a cell out
							  * of step. */}
							{selection.isEnabled && selectionMode === 'single' && (
								<th className="table-select-cell">
									<span className="erp-visually-hidden">Selected</span>
								</th>
							)}

							{columns.map(column => (
								<TableHeaderCell
									key={column.key}
									column={column}
									sortDirection={
										sorting.sort?.columnKey === column.key ? sorting.sort.direction : null
									}
									isSortable={!isSortDisabled && column.isSortable !== false}
									onSort={() => sorting.sortByColumn(column)}
								/>
							))}
						</tr>
					</thead>

					<tbody>
						{isLoading && <TableSkeleton rowCount={SKELETON_ROW_COUNT} columnCount={columnCount} />}

						{!isLoading &&
							sorting.sortedRows.map((row, rowIndex) => {
								const rowId = visibleRowIds[rowIndex]
								const isSelected = selection.isSelected(rowId)

								return (
									<tr
										key={rowId}
										className={classNames('table-row', isSelected && 'table-row-selected')}
										/* Marks the row itself, not just the checkbox, so a
										 * screen reader announces the selection when it
										 * reaches the row rather than only when it reaches the
										 * control inside it. */
										aria-selected={selection.isEnabled ? isSelected : undefined}
										onClick={onRowClick ? () => onRowClick(row, rowId) : undefined}
									>
										{selection.isEnabled && (
											<TableSelectCell
												mode={selectionMode === 'single' ? 'single' : 'multiple'}
												isChecked={isSelected}
												label={`Select ${getRowLabel ? getRowLabel(row, rowIndex) : `row ${rowIndex + 1}`}`}
												onToggle={() => selection.toggleRow(rowId)}
											/>
										)}

										{columns.map(column => (
											<td
												key={column.key}
												className={classNames(
													'table-cell',
													column.hideBelow && `table-hide-below-${column.hideBelow}`,
													column.isNoWrap && 'table-nowrap'
												)}
												style={{ textAlign: resolveCellAlign(column) }}
											>
												{/* `render` wins over `format`. Note that
												  * sorting still reads the underlying value,
												  * so a column shown as a badge sorts by what
												  * the badge means. */}
												{column.render ? column.render(row) : formatCellText(column, row)}
											</td>
										))}
									</tr>
								)
							})}
					</tbody>

					{footerRow && !isLoading && !isEmpty && (
						/* A real <tfoot>. It stays with the table when printed, and a screen
						 * reader announces it as the summary rather than as one more row of
						 * data. */
						<tfoot className="table-foot">
							<tr>
								{selection.isEnabled && <td className="table-select-cell" />}

								{columns.map(column => (
									<td
										key={column.key}
										className={classNames(
											'table-cell',
											column.hideBelow && `table-hide-below-${column.hideBelow}`
										)}
										style={{ textAlign: resolveCellAlign(column) }}
									>
										{footerRow[column.key]}
									</td>
								))}
							</tr>
						</tfoot>
					)}
				</table>

				{/* Outside the table rather than as a spanning cell, so it can be centred in
				  * the scrollport without fighting the column widths. */}
				{isEmpty && <p className="table-empty">{emptyText}</p>}
			</div>
		</div>
	)
}

export default ViewTable
