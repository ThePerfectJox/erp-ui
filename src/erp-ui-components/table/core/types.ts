/**
 * The read-only table's data contract.
 *
 * -----------------------------------------------------------------------------
 * How this differs from `DataGrid`'s, and why
 * -----------------------------------------------------------------------------
 * The two look similar and are deliberately not interchangeable. `DataGrid` is a
 * spreadsheet: cells are edited, selected as ranges, copied to Excel, and resized by
 * dragging. `ViewTable` is a **report**: rows are read, sorted, sometimes ticked, and
 * clicked through to a detail screen.
 *
 * That difference shows up in three places in this file:
 *
 * - **`width` is a CSS length, not a number of pixels.** `DataGrid` needs pixels
 *   because a drag delta is in pixels and every column must have a definite width for
 *   the drag arithmetic to work. Nothing here is draggable, so a width can be `"8rem"`
 *   or `"20%"` — and can be left off entirely, which is the normal case.
 * - **There is a `render` escape hatch.** A report cell is frequently not text: a
 *   status badge, a link to the document, a row action. `DataGrid` has no equivalent
 *   because a cell you can type into has to be text.
 * - **No `parse`.** Nothing is typed in, so nothing has to be read back.
 */

import type { ReactNode } from 'react'
import type { CellComparator, SortState } from '../../shared/sortRows'

/** A row of data, keyed by column key. */
export type TableRow = Record<string, unknown>

/**
 * What kind of value a column holds. Decides the default alignment and nothing else.
 *
 * Anything more specific — a date, a currency, a code list — is a `format` function
 * rather than another entry here, for the same reason `DataGrid` stops at two: the
 * set of things an ERP column can be has no end.
 */
export type TableColumnType = 'text' | 'number'

/** Where a cell's content sits. Derived from {@link TableColumnType} by default. */
export type TableCellAlign = 'start' | 'center' | 'end'

/** Which column is sorted and which way. The same shape the editable grid uses. */
export type TableSort = SortState

/**
 * How many rows can be ticked at once.
 *
 * - `"none"` — no checkbox column. The default.
 * - `"single"` — radio buttons. For "pick one, then act on it".
 * - `"multiple"` — checkboxes, plus a select-all in the header.
 */
export type TableSelectionMode = 'none' | 'single' | 'multiple'

/**
 * Row height. `"cozy"` (the default) for a table on its own, `"compact"` for one
 * embedded in a dense screen or a dialog.
 *
 * Declared here rather than borrowed from the form folder's `FieldDensity`, which has
 * the same two members. A two-member string union carries no logic and cannot drift in
 * any way that matters, so sharing it would buy nothing and couple two folders that
 * have no other reason to know about each other.
 */
export type TableDensity = 'cozy' | 'compact'

/**
 * A breakpoint below which a column is hidden.
 *
 * The honest way to make a wide table usable on a narrow screen: decide which columns
 * stop mattering rather than letting all of them shrink until none is readable. The
 * table scrolls horizontally too, so a hidden column is a choice about what should be
 * visible without scrolling, not about what is reachable.
 */
export type TableHideBelow = 'sm' | 'md'

export interface TableColumn {
	/** Key into the row object. */
	key: string

	/** Column heading. */
	header: string

	/**
	 * Width as any CSS length — `"8rem"`, `"120px"`, `"20%"`.
	 *
	 * Usually leave it off. The table lays out with `table-layout: auto`, so columns
	 * size themselves to their content, which is what a report wants and what a
	 * hand-written HTML table does. Set it for a column whose content varies wildly and
	 * whose width should not — a status column, an actions column.
	 */
	width?: string

	/** Defaults to `"text"`. */
	type?: TableColumnType

	/** Overrides the alignment implied by `type`. */
	align?: TableCellAlign

	/** Blocks sorting by this column. Everything is sortable by default. */
	isSortable?: boolean

	/**
	 * Stops the text wrapping, so the column stays one line and the row stays one
	 * line high.
	 *
	 * Right for codes, dates and amounts. Wrong for a description, where it produces
	 * an ellipsis hiding the thing the reader came for.
	 */
	isNoWrap?: boolean

	/** Hides the column below this breakpoint. See {@link TableHideBelow}. */
	hideBelow?: TableHideBelow

	/**
	 * Turns a stored value into the text shown in the cell.
	 *
	 * This is also what a screen reader reads, so prefer it over `render` whenever the
	 * cell really is just text formatted a particular way.
	 */
	format?: (value: unknown, row: TableRow) => string

	/**
	 * Renders the cell as arbitrary content, overriding `format`.
	 *
	 * The escape hatch that makes this a *web* table rather than a grid of strings — a
	 * status badge, a link to the document, a row action:
	 *
	 * ```tsx
	 * { key: 'status', header: 'Status', render: row => <StatusBadge value={row.status} /> }
	 * { key: 'id', header: 'Order', render: row => <a href={`/orders/${row.id}`}>{row.id}</a> }
	 * ```
	 *
	 * Two things to keep in mind. It is presentation only — sorting still works off the
	 * underlying value (or `sortValue`), so a column rendered as a badge still sorts by
	 * what the badge means. And whatever you put here is what assistive technology
	 * gets, so an icon-only cell needs its own accessible name.
	 */
	render?: (row: TableRow) => ReactNode

	/**
	 * The value this column sorts on, when it is not simply `row[key]`.
	 *
	 * Needed by **derived** and **rendered** columns. A "net value" column computed from
	 * quantity × price has nothing stored under its own key, so the default lookup finds
	 * `undefined` in every row and the sort silently does nothing. Return the real
	 * number — not the formatted string, or `"100"` sorts before `"20"`.
	 */
	sortValue?: (row: TableRow) => unknown

	/**
	 * Overrides how this column sorts. Gets two raw cell values.
	 *
	 * Rarely needed — the default handles numbers, dates and numbered strings like
	 * `"item 10"`. Reach for it when the display order is not the value order, such as a
	 * status column that should sort by workflow stage rather than alphabetically.
	 */
	compare?: CellComparator
}

/**
 * A footer row, keyed by column. Only the keys you supply get content; the rest are
 * blank.
 *
 * ```tsx
 * footerRow={{ material: 'Total', total: EURO.format(netTotal) }}
 * ```
 *
 * Computed by the caller rather than by the table. A table that summed its own columns
 * would have to guess which ones are additive — summing a quantity column across two
 * different units of measure produces a number that means nothing, and summing a
 * *unit price* column produces one that is actively misleading.
 */
export type TableFooterRow = Record<string, ReactNode>
