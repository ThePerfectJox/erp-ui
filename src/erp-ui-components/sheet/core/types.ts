/**
 * The grid's data contract.
 *
 * Kept in its own module, with no React in it, because five different layers
 * need these shapes — the hooks, the presentational parts, the public barrel and
 * the screens using the grid. Declaring them next to the component would mean
 * every one of those importing `DataGrid.tsx`, which drags the whole component
 * and its CSS along behind a type-only import.
 */

import type { CellComparator } from '../../shared/sortRows'

/** A row of data, keyed by column key. */
export type GridRow = Record<string, unknown>

/**
 * How a column's values are shown and how pasted text is turned back into them.
 *
 * Anything more specific than these two — a date, a currency pair, a code list —
 * is a `format`/`parse` pair rather than another entry here, because the set of
 * things an ERP column can be has no end and a union type pretending otherwise
 * only gets in the way.
 */
export type GridColumnType = 'text' | 'number'

/** Where a cell's content sits. Derived from {@link GridColumnType} by default. */
export type CellAlign = 'start' | 'center' | 'end'

/**
 * Why a row is dirty. Worth distinguishing, because it decides the verb: an
 * `"edited"` row is a `PATCH` against an existing record, an `"added"` one is a
 * `POST`. Sending the wrong one either 404s or creates a duplicate.
 */
export type RowChangeKind = 'added' | 'edited'

/** The dirty set: row id to why it is dirty. */
export type GridDirtyRows = ReadonlyMap<string, RowChangeKind>

export interface GridColumn {
	/** Key into the row object. */
	key: string

	/** Column heading. */
	header: string

	/**
	 * Width in pixels.
	 *
	 * Every column in the grid has a **definite** width — this one, or
	 * `defaultColumnWidth` when it is left off. Nothing flexes, and that is what
	 * makes the grid behave like a spreadsheet: the widths add up to whatever they
	 * add up to, and the grid scrolls sideways if that is wider than its
	 * container. Narrow one column and the others do not silently grow to take up
	 * the slack.
	 *
	 * Pixels rather than a CSS length because the user can drag this, and a drag
	 * delta is in pixels — mixing the two units means converting `rem` to `px`
	 * mid-gesture, which needs the computed font size and gets fragile fast.
	 */
	width?: number

	/** Defaults to `"text"`. */
	type?: GridColumnType

	/** Overrides the alignment implied by `type`. */
	align?: CellAlign

	/** Blocks editing and pasting for this column. */
	isReadOnly?: boolean

	/** Blocks sorting by this column. Everything is sortable by default. */
	isSortable?: boolean

	/** Blocks resizing this column. */
	isResizable?: boolean

	/**
	 * Turns a stored value into the text shown in the cell — and copied to the
	 * clipboard. Those are deliberately the same string: what the user sees is
	 * what lands in Excel, so a formatted total cannot arrive as a raw float.
	 *
	 * Beware of formatting that cannot be read back. A thousands separator looks
	 * right in the grid and then fails to parse when pasted into another row, so
	 * a `format` that adds one needs a `parse` that removes it.
	 */
	format?: (value: unknown, row: GridRow) => string

	/**
	 * Turns pasted or typed text into the stored value. Gets the raw clipboard
	 * text, already unquoted.
	 *
	 * This is where locale belongs: German Excel copies `1.234,56`, which the
	 * default numeric parse will not accept.
	 */
	parse?: (text: string) => unknown

	/**
	 * Overrides how this column sorts. Gets two raw cell values.
	 *
	 * Rarely needed — the default handles numbers, dates and numbered strings
	 * like `"item 10"`. Reach for it when the display order is not the value
	 * order, such as a status column that should sort by workflow stage rather
	 * than alphabetically.
	 */
	compare?: CellComparator

	/**
	 * The value this column sorts on, when it is not simply `row[key]`.
	 *
	 * Needed by **derived** columns. A "net value" column rendered from quantity ×
	 * price has nothing stored under its own key, so the default lookup finds
	 * `undefined` in every row and the sort silently does nothing. Return the real
	 * number here — not the formatted string, or `"100"` sorts before `"20"`.
	 *
	 * ```tsx
	 * sortValue: row => Number(row.quantity) * Number(row.price)
	 * ```
	 */
	sortValue?: (row: GridRow) => unknown
}

/** What changed, handed to `onChange` so a save can be built from it. */
export interface GridChangeInfo {
	/** Ids of the rows this one change touched. */
	changedRowIds: string[]

	/**
	 * Every row with unsaved changes, not just the ones from this change.
	 *
	 * ```ts
	 * const updates = [...dirtyRows].filter(([, kind]) => kind === 'edited')
	 * ```
	 */
	dirtyRows: Map<string, RowChangeKind>
}

/**
 * A row in display order, carrying where it came from in `rows`.
 *
 * `sourceIndex` is the load-bearing part of the whole component. Everything the
 * user does is in visual coordinates, and everything written back has to be in
 * source coordinates, so this pairing is the one place the two are related and
 * every read and write goes through it.
 */
export interface GridViewRow {
	row: GridRow
	sourceIndex: number
}

/**
 * An open cell editor: which visual cell, and the text currently in the input.
 *
 * Visual coordinates, like the selection — the editor is anchored to a position
 * on screen, and the row under that position is resolved through
 * {@link GridViewRow} at the moment the edit is committed.
 */
export interface GridEdit {
	row: number
	column: number
	draft: string
}

/** Which axis a resize drag is moving along. */
export type ResizeAxis = 'column' | 'row'
