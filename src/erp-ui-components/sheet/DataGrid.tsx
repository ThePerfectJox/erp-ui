import { useMemo, useRef, useState } from 'react'
import type { ClipboardEvent, KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import { readFromClipboard, writeToClipboard } from './clipboard'
import { advanceWrapping, clampAddress, isWithinRange, pasteTargetSize, rangeSize, toRange } from './gridSelection'
import type { CellAddress, CellSelection } from './gridSelection'
import { computeOrder, cycleSort } from './gridSort'
import type { CellComparator, GridSort } from './gridSort'
import './DataGrid.css'

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

/**
 * Why a row is dirty. Worth distinguishing, because it decides the verb: an
 * `"edited"` row is a `PATCH` against an existing record, an `"added"` one is a
 * `POST`. Sending the wrong one either 404s or creates a duplicate.
 */
export type RowChangeKind = 'added' | 'edited'

export interface GridColumn {
	/** Key into the row object. */
	key: string

	/** Column heading. */
	header: string

	/**
	 * Starting width in pixels.
	 *
	 * Leave it off and the column flexes: it shares the space left over after the
	 * sized columns, which is the default and usually what a description or name
	 * column wants. Set it for codes, quantities and amounts, whose content has a
	 * known size and which look wrong stretched.
	 *
	 * Pixels rather than a CSS length because the user can drag this, and a drag
	 * delta is in pixels — mixing the two units means converting `rem` to `px`
	 * mid-gesture, which needs the computed font size and gets fragile fast.
	 */
	width?: number

	/** Defaults to `"text"`. */
	type?: GridColumnType

	/** Overrides the alignment implied by `type`. */
	align?: 'start' | 'center' | 'end'

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

interface DataGridProps {
	columns: readonly GridColumn[]

	/** The rows. Controlled — pair with `onChange`. */
	rows: readonly GridRow[]

	/**
	 * Called with the complete next set of rows, **in their original order**
	 * whatever the view is sorted by, plus a description of what changed.
	 *
	 * Left off, the grid is read-only in practice: it still sorts, selects,
	 * resizes and copies, it just cannot be changed.
	 */
	onChange?: (rows: GridRow[], change: GridChangeInfo) => void

	/**
	 * Stable identity for a row. Strongly recommended once you care about which
	 * rows are dirty: it is the key the dirty set is stored under, so with the
	 * index fallback below, reordering rows outside the grid moves the "changed"
	 * marks onto the wrong records.
	 *
	 * ```tsx
	 * getRowId={row => String(row.itemNumber)}
	 * ```
	 *
	 * Defaults to the row's position in `rows`.
	 */
	getRowId?: (row: GridRow, sourceIndex: number) => string

	/**
	 * Names the table for assistive technology, and is shown above it. Required:
	 * a grid of numbers with no caption is unusable with a screen reader, and
	 * this is one line of text.
	 */
	caption: string

	/** Hides the caption visually. It stays available to assistive technology. */
	isCaptionHidden?: boolean

	/** Blocks all editing. Selection, sorting, resizing and copying still work. */
	isReadOnly?: boolean

	/**
	 * Lets a paste that runs past the last row append new ones, marked
	 * `"added"` rather than `"edited"`. Off by default, because silently growing
	 * a document's item table is rarely what someone pasting a stray extra line
	 * intended.
	 */
	canGrowOnPaste?: boolean

	/** Excel-style row numbers down the left. On by default. */
	hasRowNumbers?: boolean

	/** Caps the body height and scrolls, with the header staying put. */
	maxBodyHeight?: string

	// --- sizing --------------------------------------------------------------

	/**
	 * Pixel width for columns that do not set their own.
	 *
	 * **Left unset — the default — those columns share the parent's width**,
	 * splitting whatever is left after the sized columns and the row gutter have
	 * taken theirs. So a grid whose columns are all unsized fills its container
	 * with equal columns, and one that sizes its codes and amounts lets the
	 * description column soak up the rest.
	 *
	 * Set it to a number for the opposite behaviour: every column gets a fixed
	 * width and the grid scrolls horizontally rather than fitting. Worth doing
	 * when the columns must stay comparable between two grids on different
	 * screens.
	 */
	defaultColumnWidth?: number

	/** Height for rows that have not been resized. Pixels. */
	defaultRowHeight?: number

	/** Floor for a column drag, so a column cannot be dragged out of existence. */
	minColumnWidth?: number

	/** Floor for a row drag. */
	minRowHeight?: number

	/** Turns off column drag-resizing for the whole grid. */
	isColumnResizeDisabled?: boolean

	/** Turns off row drag-resizing for the whole grid. */
	isRowResizeDisabled?: boolean

	// --- dirty tracking ------------------------------------------------------

	/**
	 * The dirty set, controlled. Pass it with `onDirtyRowsChange` when the save
	 * flow needs to clear the marks:
	 *
	 * ```tsx
	 * const [dirtyRows, setDirtyRows] = useState(new Map())
	 *
	 * <DataGrid dirtyRows={dirtyRows} onDirtyRowsChange={setDirtyRows} … />
	 *
	 * async function save() {
	 *     await postChanges(rows, dirtyRows)
	 *     setDirtyRows(new Map())   // marks clear only once the server agreed
	 * }
	 * ```
	 *
	 * Left off, the grid keeps the set itself, which is fine for a screen that
	 * only needs the marks on screen. It cannot be reset from outside though —
	 * so anything that saves wants the controlled form.
	 */
	dirtyRows?: ReadonlyMap<string, RowChangeKind>

	/** Fires with the next dirty set whenever it changes. */
	onDirtyRowsChange?: (dirtyRows: Map<string, RowChangeKind>) => void

	/** Hides the change marks in the row gutter without disabling the tracking. */
	areChangeMarksHidden?: boolean
}

/** Cell text for display and for the clipboard — always the same string. */
function formatCell(column: GridColumn, row: GridRow): string {
	const value = row[column.key]

	if (column.format) {
		return column.format(value, row)
	}

	/* Empty rather than "null"/"undefined", which is what String() would give
	 * and what would then land in Excel. */
	if (value === null || value === undefined) {
		return ''
	}

	return String(value)
}

/** Pasted or typed text back into a stored value. */
function parseCell(column: GridColumn, text: string): unknown {
	if (column.parse) {
		return column.parse(text)
	}

	const trimmed = text.trim()

	if (trimmed === '') {
		return null
	}

	if (column.type === 'number') {
		const asNumber = Number(trimmed)

		/* Unparseable text is kept as text rather than becoming null or NaN.
		 * Someone pasting a column with one bad cell should see the bad cell and
		 * be able to fix it, not find out later that it was thrown away. */
		return Number.isNaN(asNumber) ? text : asNumber
	}

	return text
}

function resolveAlign(column: GridColumn): 'start' | 'center' | 'end' {
	/* Numbers right, everything else left — so a column of amounts lines up on
	 * its last digit, which is the only way the magnitudes can be compared. */
	return column.align ?? (column.type === 'number' ? 'end' : 'start')
}

/**
 * An Excel-like grid: sortable, resizable, copies and pastes as a spreadsheet,
 * and marks the rows you have changed.
 *
 * ```tsx
 * const [rows, setRows] = useState(items)
 * const [dirtyRows, setDirtyRows] = useState(new Map())
 *
 * <DataGrid
 *     caption="Purchase order items"
 *     columns={[
 *         { key: 'material', header: 'Material', width: 160 },
 *         { key: 'quantity', header: 'Quantity', type: 'number' },
 *     ]}
 *     rows={rows}
 *     onChange={setRows}
 *     getRowId={row => String(row.itemNumber)}
 *     dirtyRows={dirtyRows}
 *     onDirtyRowsChange={setDirtyRows}
 * />
 * ```
 *
 * **Clipboard.** Select a range and `Ctrl+C`, then paste into Excel and it
 * arrives as cells. Copy a block out of Excel and `Ctrl+V` here and it lands in
 * the grid. Both go through the `text/plain` TSV and `text/html` table Excel
 * actually uses — see `clipboard.ts`. Cells holding tabs or line breaks survive.
 *
 * **Sorting** is a view, never an edit. Clicking a header cycles ascending →
 * descending → back to document order, and `onChange` still hands rows back in
 * their original sequence. The order is recomputed only when a header is
 * clicked, not when a value changes, so editing a sorted column does not make
 * the row jump out from under the cursor mid-keystroke.
 *
 * **Sizing.** A column with no `width` flexes to fill the parent, sharing what is
 * left after the sized columns; set `defaultColumnWidth` to make unsized columns
 * a fixed width instead. Drag a column's right edge or a row's bottom edge in the
 * gutter to resize, and double-click either handle to return it to the default —
 * which for a flexible column means going back to flexing. Sizes live in the
 * grid's own state, so they are per-session; lift them out if they need to
 * outlive a reload.
 *
 * **Keyboard.**
 *
 * | Key | Does |
 * | --- | --- |
 * | arrows | move one cell |
 * | `Shift` + arrows | extend the selection |
 * | `Tab` / `Shift+Tab` | next / previous cell, wrapping at the row ends |
 * | `Enter` | edit, or commit and move down |
 * | `F2` | edit |
 * | any character | starts overwriting |
 * | `Esc` | abandon the edit |
 * | `Ctrl+A` | select everything |
 * | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | copy / cut / paste |
 * | `Delete` / `Backspace` | clear the selected cells |
 * | `Home` / `End` | first / last column of the row |
 * | `Ctrl+Home` / `Ctrl+End` | first / last cell of the grid |
 *
 * **Not in here**, so you are not surprised later: no virtualisation, so this is
 * built for hundreds of rows rather than tens of thousands; no column reordering
 * or grouping; no formulas, merged cells or undo. Each is a real feature rather
 * than a flag, and a grid that pretends otherwise is how these components become
 * unmaintainable.
 */
function DataGrid({
	columns,
	rows,
	onChange,
	getRowId,
	caption,
	isCaptionHidden,
	isReadOnly,
	canGrowOnPaste,
	hasRowNumbers = true,
	maxBodyHeight,
	/* No default on purpose. Undefined is what makes an unsized column flex; give
	 * this a number and every unsized column becomes that many pixels wide
	 * instead. */
	defaultColumnWidth,
	defaultRowHeight = 30,
	minColumnWidth = 48,
	minRowHeight = 22,
	isColumnResizeDisabled,
	isRowResizeDisabled,
	dirtyRows,
	onDirtyRowsChange,
	areChangeMarksHidden,
}: DataGridProps) {
	const [selection, setSelection] = useState<CellSelection | null>(null)

	/** Non-null only while a cell editor is open. `draft` is the editor's text. */
	const [editing, setEditing] = useState<{ row: number; column: number; draft: string } | null>(null)

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

	const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
	const [rowHeights, setRowHeights] = useState<Record<string, number>>({})

	/** Only used while `dirtyRows` is not supplied. */
	const [internalDirtyRows, setInternalDirtyRows] = useState<Map<string, RowChangeKind>>(new Map())

	/* Refs, not state: both change continuously during a drag and nothing
	 * rendered depends on them, so state would re-render the whole grid per
	 * pixel of pointer movement. */
	const isDraggingRef = useRef(false)
	const resizeRef = useRef<{ axis: 'column' | 'row'; key: string; origin: number; startSize: number } | null>(null)

	const scrollRef = useRef<HTMLDivElement>(null)
	const editorRef = useRef<HTMLInputElement>(null)

	const columnCount = columns.length
	const isEditable = !isReadOnly && Boolean(onChange)
	const effectiveDirtyRows = dirtyRows ?? internalDirtyRows

	const identify = (row: GridRow, sourceIndex: number) =>
		getRowId ? getRowId(row, sourceIndex) : String(sourceIndex)

	/**
	 * The rows in display order, each carrying where it came from.
	 *
	 * `sourceIndex` is the load-bearing part. Everything the user does is in
	 * visual coordinates, and everything written back has to be in source
	 * coordinates, so this is the one place the two are related and every read
	 * and write goes through it.
	 */
	const viewRows = useMemo(() => {
		/* A length mismatch means `rows` was replaced from outside — reloaded from
		 * the server, filtered upstream — and the frozen indices no longer refer
		 * to the rows they were computed for. Falling back to document order is
		 * the only safe reading; the alternative is showing the wrong data under
		 * the right headings. The sort indicator clears with it. */
		const order = frozenOrder && frozenOrder.length === rows.length ? frozenOrder : null

		if (!order) {
			return rows.map((row, sourceIndex) => ({ row, sourceIndex }))
		}

		return order.map(sourceIndex => ({ row: rows[sourceIndex], sourceIndex }))
	}, [rows, frozenOrder])

	const rowCount = viewRows.length
	const range = useMemo(() => (selection ? toRange(selection) : null), [selection])

	const isOrderStale = Boolean(frozenOrder) && frozenOrder?.length !== rows.length
	const activeSort = isOrderStale ? null : sort

	/**
	 * A column's pixel width, or `undefined` when it should flex to fill the
	 * space left over.
	 *
	 * A column the user has dragged always wins: once someone has sized a column
	 * by hand it stops flexing, which is what makes a drag feel like it stuck.
	 * Double-clicking the handle drops the entry and hands the column back to the
	 * flexible pool.
	 */
	const resolveColumnWidth = (column: GridColumn): number | undefined =>
		columnWidths[column.key] ?? column.width ?? defaultColumnWidth

	const gutterWidth = hasRowNumbers ? 48 : 0

	const fixedTotal = columns.reduce((total, column) => total + (resolveColumnWidth(column) ?? 0), gutterWidth)
	const flexibleCount = columns.filter(column => resolveColumnWidth(column) === undefined).length

	/**
	 * How wide the table itself is, and it has to be decided rather than always
	 * set to 100%, because `table-layout: fixed` behaves differently in the two
	 * cases.
	 *
	 * - **Some columns flex.** Width 100%, and the fixed layout algorithm gives
	 *   every leftover pixel to the columns with no width of their own — which is
	 *   exactly "default to the parent's width", for free, with no measuring and
	 *   no ResizeObserver. `minWidth` keeps a floor under them so a narrow
	 *   container scrolls instead of crushing them to nothing.
	 * - **Every column is sized.** The explicit total. Width 100% would be wrong
	 *   here: with no flexible column to absorb it, the algorithm distributes
	 *   spare space across *all* the columns and quietly inflates widths the
	 *   caller asked for precisely.
	 */
	const tableStyle = flexibleCount > 0
		? { width: '100%', minWidth: fixedTotal + flexibleCount * minColumnWidth }
		: { width: fixedTotal }

	// --- sorting -------------------------------------------------------------

	const handleHeaderClick = (column: GridColumn) => {
		if (column.isSortable === false) {
			return
		}

		const nextSort = cycleSort(activeSort, column.key)
		const getValue = column.sortValue ?? ((row: GridRow) => row[column.key])

		setSort(nextSort)
		setFrozenOrder(nextSort ? computeOrder(rows, getValue, nextSort.direction, column.compare) : null)

		/* The selection is a visual rectangle, and re-sorting moves every row out
		 * from under it. Keeping it would leave it highlighting cells the user
		 * never chose — and a following Ctrl+C would copy them. */
		setSelection(null)
		setEditing(null)
	}

	// --- dirty tracking ------------------------------------------------------

	const publishDirtyRows = (next: Map<string, RowChangeKind>) => {
		if (dirtyRows === undefined) {
			setInternalDirtyRows(next)
		}

		onDirtyRowsChange?.(next)
	}

	// --- writing -------------------------------------------------------------

	/**
	 * Writes a block of values starting at a visual cell.
	 *
	 * One function behind editing, pasting and clearing, so all three respect
	 * read-only columns, the grid's bounds, the visual-to-source mapping and the
	 * dirty set identically — and only one of them has to be got right.
	 */
	const writeBlock = (visualTop: number, left: number, block: string[][]) => {
		if (!onChange || !isEditable) {
			return
		}

		/* Copied before writing: `rows` is a prop and mutating it would change the
		 * parent's state behind its back, which React does not see and will not
		 * re-render for. */
		const nextRows: GridRow[] = rows.map(row => ({ ...row }))
		const nextDirty = new Map(effectiveDirtyRows)
		const changedRowIds: string[] = []

		/* Grown rows are appended to the source and to the frozen order, so a sort
		 * that is currently applied keeps its arrangement and the new rows land at
		 * the bottom where they were pasted — rather than being sorted into the
		 * middle of the table the moment they appear. */
		const appendedOrder: number[] = []

		let hasChanged = false

		block.forEach((blockRow, rowOffset) => {
			const visualIndex = visualTop + rowOffset

			let sourceIndex: number
			let isNewRow = false

			if (visualIndex < viewRows.length) {
				sourceIndex = viewRows[visualIndex].sourceIndex
			} else if (canGrowOnPaste) {
				/* Every column present, so the new row's shape matches the
				 * existing ones — a row missing keys reads as undefined
				 * everywhere downstream. */
				const blank: GridRow = {}

				for (const column of columns) {
					blank[column.key] = null
				}

				sourceIndex = nextRows.length
				nextRows.push(blank)
				appendedOrder.push(sourceIndex)
				isNewRow = true
			} else {
				return
			}

			let hasRowChanged = false

			blockRow.forEach((text, columnOffset) => {
				const column = columns[left + columnOffset]

				/* Skipped rather than refusing the whole paste. Pasting a
				 * five-column block over a table whose third column is
				 * calculated should fill the four it can. */
				if (!column || column.isReadOnly) {
					return
				}

				const nextValue = parseCell(column, text)

				/* Compared before writing, so re-entering the same value does not
				 * mark a row dirty. Retyping a value and getting an unsaved-changes
				 * warning for it is the kind of small lie that stops people
				 * trusting the indicator at all. */
				if (nextRows[sourceIndex][column.key] === nextValue) {
					return
				}

				nextRows[sourceIndex][column.key] = nextValue
				hasRowChanged = true
			})

			if (!hasRowChanged) {
				return
			}

			hasChanged = true

			const rowId = identify(nextRows[sourceIndex], sourceIndex)

			changedRowIds.push(rowId)

			/* "added" outranks "edited". A row that was pasted in and then typed
			 * over is still an insert, and downgrading it to an update would make
			 * the save PATCH a record the server has never seen. */
			if (isNewRow || nextDirty.get(rowId) === 'added') {
				nextDirty.set(rowId, 'added')
			} else {
				nextDirty.set(rowId, 'edited')
			}
		})

		if (!hasChanged) {
			return
		}

		if (appendedOrder.length > 0 && frozenOrder) {
			setFrozenOrder([...frozenOrder, ...appendedOrder])
		}

		onChange(nextRows, { changedRowIds, dirtyRows: nextDirty })
		publishDirtyRows(nextDirty)
	}

	// --- selection -----------------------------------------------------------

	const select = (address: CellAddress, isExtending: boolean) => {
		const next = clampAddress(address, rowCount, columnCount)

		setSelection(current =>
			/* Extending keeps the original anchor, which is what lets shift+click
			 * and shift+arrow both grow from where the selection started rather
			 * than from wherever it currently ends. */
			isExtending && current ? { anchor: current.anchor, focus: next } : { anchor: next, focus: next }
		)

		/* Focus and reveal by hand rather than in an effect. Doing it here ties it
		 * to the gesture that caused it, so focus is never yanked around by an
		 * unrelated re-render — and `preventScroll` avoids the browser's own
		 * centre-the-element jump, which is jarring in a long grid. */
		const cell = scrollRef.current?.querySelector<HTMLElement>(
			`[data-row="${next.row}"][data-column="${next.column}"]`
		)

		cell?.focus({ preventScroll: true })
		cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
	}

	/** The selected cells as text, ready for the clipboard. */
	const readSelectionAsMatrix = (): string[][] => {
		if (!range) {
			return []
		}

		const matrix: string[][] = []

		for (let rowIndex = range.top; rowIndex <= range.bottom; rowIndex += 1) {
			const line: string[] = []

			for (let columnIndex = range.left; columnIndex <= range.right; columnIndex += 1) {
				line.push(formatCell(columns[columnIndex], viewRows[rowIndex].row))
			}

			matrix.push(line)
		}

		return matrix
	}

	const clearSelection = () => {
		if (!range || !isEditable) {
			return
		}

		const size = rangeSize(range)
		const blanks = Array.from({ length: size.rows }, () => Array.from({ length: size.columns }, () => ''))

		writeBlock(range.top, range.left, blanks)
	}

	// --- editing -------------------------------------------------------------

	const commitEdit = (moveBy: CellAddress | null) => {
		if (!editing) {
			return
		}

		writeBlock(editing.row, editing.column, [[editing.draft]])
		setEditing(null)

		if (moveBy) {
			select({ row: editing.row + moveBy.row, column: editing.column + moveBy.column }, false)
		}
	}

	const beginEdit = (address: CellAddress, initialText: string | null) => {
		if (!isEditable) {
			return
		}

		const column = columns[address.column]

		if (!column || column.isReadOnly) {
			return
		}

		setEditing({
			row: address.row,
			column: address.column,
			/* null means "carry on from the existing value" (Enter, F2, a double
			 * click). A string means the user started typing, and that character
			 * replaces the old value — as it does in Excel. */
			draft: initialText ?? formatCell(column, viewRows[address.row].row),
		})
	}

	// --- clipboard -----------------------------------------------------------

	const handleCopy = (event: ClipboardEvent<HTMLElement>) => {
		/* While an editor is open the events belong to it, so the browser's own
		 * text copy inside the input keeps working. */
		if (editing || !range) {
			return
		}

		event.preventDefault()
		writeToClipboard(event.clipboardData, readSelectionAsMatrix())
	}

	const handleCut = (event: ClipboardEvent<HTMLElement>) => {
		if (editing || !range) {
			return
		}

		event.preventDefault()
		writeToClipboard(event.clipboardData, readSelectionAsMatrix())
		clearSelection()
	}

	const handlePaste = (event: ClipboardEvent<HTMLElement>) => {
		if (editing || !range || !isEditable) {
			return
		}

		const pasted = readFromClipboard(event.clipboardData)

		if (pasted.length === 0) {
			return
		}

		event.preventDefault()

		const pastedColumns = Math.max(...pasted.map(pastedRow => pastedRow.length))
		const target = pasteTargetSize(range, pasted.length, pastedColumns)

		/* Built to the target size rather than pasted as-is, so a single copied
		 * cell fills the whole selected range — Excel's behaviour, and the
		 * fastest way to set one value down a column. The modulo also repeats a
		 * ragged block cleanly instead of leaving holes. */
		const block = Array.from({ length: target.rows }, (_unused, rowOffset) =>
			Array.from({ length: target.columns }, (_alsoUnused, columnOffset) => {
				const sourceRow = pasted[rowOffset % pasted.length]

				return sourceRow[columnOffset % sourceRow.length] ?? ''
			})
		)

		writeBlock(range.top, range.left, block)

		/* The selection grows to cover what landed, so it is obvious what just
		 * changed — and a follow-up Ctrl+C copies exactly the pasted block. */
		const reachableRows = canGrowOnPaste ? Math.max(rowCount, range.top + target.rows) : rowCount

		setSelection({
			anchor: { row: range.top, column: range.left },
			focus: clampAddress(
				{ row: range.top + target.rows - 1, column: range.left + target.columns - 1 },
				reachableRows,
				columnCount
			),
		})
	}

	// --- keyboard ------------------------------------------------------------

	const handleEditorKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		/* Kept off the grid's own handler, or Enter would commit the edit and then
		 * immediately be read again as "start editing the cell below". */
		event.stopPropagation()

		if (event.key === 'Enter') {
			event.preventDefault()
			commitEdit({ row: 1, column: 0 })
			return
		}

		if (event.key === 'Tab') {
			event.preventDefault()
			commitEdit({ row: 0, column: event.shiftKey ? -1 : 1 })
			return
		}

		if (event.key === 'Escape') {
			event.preventDefault()
			setEditing(null)
		}
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (editing || !selection) {
			return
		}

		const { focus } = selection
		const isExtending = event.shiftKey

		/* metaKey as well as ctrlKey, so the shortcuts work on a Mac without a
		 * second set of cases. */
		const isModified = event.ctrlKey || event.metaKey

		if (isModified && (event.key === 'a' || event.key === 'A')) {
			event.preventDefault()
			setSelection({ anchor: { row: 0, column: 0 }, focus: { row: rowCount - 1, column: columnCount - 1 } })
			return
		}

		/* Copy, cut and paste are left alone here. Intercepting the keystroke
		 * would mean reaching for the async clipboard API and its permission
		 * prompt; ignoring it lets the browser raise a real copy/paste event,
		 * which the handlers above answer with synchronous clipboard access. */
		if (isModified && ['c', 'x', 'v', 'C', 'X', 'V'].includes(event.key)) {
			return
		}

		switch (event.key) {
			case 'ArrowUp':
				event.preventDefault()
				select({ row: focus.row - 1, column: focus.column }, isExtending)
				return

			case 'ArrowDown':
				event.preventDefault()
				select({ row: focus.row + 1, column: focus.column }, isExtending)
				return

			case 'ArrowLeft':
				event.preventDefault()
				select({ row: focus.row, column: focus.column - 1 }, isExtending)
				return

			case 'ArrowRight':
				event.preventDefault()
				select({ row: focus.row, column: focus.column + 1 }, isExtending)
				return

			case 'Tab':
				/* Wraps at the row ends, and deliberately never extends — Excel
				 * treats Tab as "next cell", never as "grow the selection". */
				event.preventDefault()
				select(advanceWrapping(focus, event.shiftKey ? -1 : 1, rowCount, columnCount), false)
				return

			case 'Home':
				event.preventDefault()
				select(isModified ? { row: 0, column: 0 } : { row: focus.row, column: 0 }, isExtending)
				return

			case 'End':
				event.preventDefault()
				select(
					isModified
						? { row: rowCount - 1, column: columnCount - 1 }
						: { row: focus.row, column: columnCount - 1 },
					isExtending
				)
				return

			case 'Enter':
			case 'F2':
				event.preventDefault()
				beginEdit(focus, null)
				return

			case 'Delete':
			case 'Backspace':
				event.preventDefault()
				clearSelection()
				return

			case 'Escape':
				setSelection(null)
				return

			default:
				/* A printable character starts an edit and becomes the new value.
				 * Length 1 is the test for printable — it excludes every named key
				 * ("Shift", "ArrowUp", "F5") without needing a list of them.
				 * Modifier combinations are excluded so Ctrl+P still prints. */
				if (event.key.length === 1 && !isModified) {
					event.preventDefault()
					beginEdit(focus, event.key)
				}
		}
	}

	// --- pointer: cell selection ---------------------------------------------

	const handleCellMouseDown = (event: MouseEvent<HTMLElement>, address: CellAddress) => {
		/* Right-click opens the context menu on whatever is already selected,
		 * rather than moving the selection out from under the user first. */
		if (event.button !== 0) {
			return
		}

		/* Stops the browser turning a drag across cells into a text selection,
		 * which would fight the range highlight and put the wrong thing on the
		 * clipboard. */
		event.preventDefault()

		if (editing) {
			commitEdit(null)
		}

		isDraggingRef.current = true
		select(address, event.shiftKey)
	}

	const handleCellMouseEnter = (address: CellAddress) => {
		if (isDraggingRef.current) {
			select(address, true)
		}
	}

	// --- pointer: resizing ---------------------------------------------------

	/* Pointer capture rather than window listeners: the browser routes every
	 * subsequent move and the release to the handle itself, so the drag survives
	 * the pointer leaving the element — or the window — and there is no listener
	 * to leak if the component unmounts mid-gesture. */
	const handleResizeStart = (
		event: PointerEvent<HTMLElement>,
		axis: 'column' | 'row',
		key: string,
		fallbackSize: number
	) => {
		event.preventDefault()

		/* The handle sits inside a header or the row gutter; without this the
		 * press also reads as the start of a cell selection drag. */
		event.stopPropagation()

		event.currentTarget.setPointerCapture(event.pointerId)

		/* Measured off the element rather than taken from the props, because a
		 * flexible column has no width to read — its size was decided by the
		 * layout, so the layout is the only thing that knows it. Measuring also
		 * keeps the drag anchored to what is actually on screen for fixed columns.
		 *
		 * The `> 0` guard covers an element that has not been laid out yet, where
		 * getBoundingClientRect reports zeros and an unguarded drag would snap the
		 * column to the minimum. */
		const box = event.currentTarget.closest(axis === 'column' ? 'th' : 'tr')?.getBoundingClientRect()
		const measured = axis === 'column' ? box?.width : box?.height

		resizeRef.current = {
			axis,
			key,
			origin: axis === 'column' ? event.clientX : event.clientY,
			startSize: measured && measured > 0 ? measured : fallbackSize,
		}
	}

	const handleResizeMove = (event: PointerEvent<HTMLElement>) => {
		const resize = resizeRef.current

		if (!resize) {
			return
		}

		const position = resize.axis === 'column' ? event.clientX : event.clientY
		const floor = resize.axis === 'column' ? minColumnWidth : minRowHeight
		const nextSize = Math.max(floor, resize.startSize + position - resize.origin)

		if (resize.axis === 'column') {
			setColumnWidths(current => ({ ...current, [resize.key]: nextSize }))
		} else {
			setRowHeights(current => ({ ...current, [resize.key]: nextSize }))
		}
	}

	const handleResizeEnd = (event: PointerEvent<HTMLElement>) => {
		resizeRef.current = null
		event.currentTarget.releasePointerCapture(event.pointerId)
	}

	/** Double-clicking a handle returns that column or row to its default size. */
	const handleResizeReset = (axis: 'column' | 'row', key: string) => {
		const drop = (current: Record<string, number>) => {
			const next = { ...current }

			delete next[key]

			return next
		}

		if (axis === 'column') {
			setColumnWidths(drop)
		} else {
			setRowHeights(drop)
		}
	}

	// --- render --------------------------------------------------------------

	return (
		<div className="grid">
			{/* No id, and the table is named with aria-label instead of
			  * aria-labelledby — a hardcoded id would collide the moment a screen
			  * had two grids on it. */}
			<p className={isCaptionHidden ? 'grid-caption grid-caption-hidden' : 'grid-caption'}>{caption}</p>

			<div
				className="grid-scroll"
				ref={scrollRef}
				style={maxBodyHeight ? { maxHeight: maxBodyHeight } : undefined}
			>
				{/* The clipboard and key handlers sit here rather than on each
				  * cell: the events are raised on the focused cell and bubble, so
				  * one set of handlers covers the whole grid. */}
				<table
					className="grid-table"
					role="grid"
					aria-label={caption}
					aria-rowcount={rowCount + 1}
					aria-colcount={columnCount + (hasRowNumbers ? 1 : 0)}
					style={tableStyle}
					onKeyDown={handleKeyDown}
					onCopy={handleCopy}
					onCut={handleCut}
					onPaste={handlePaste}
				>
					{/* Widths declared once here rather than on every cell. With
					  * `table-layout: fixed` these are authoritative, so the
					  * columns hold their size instead of being re-fitted to their
					  * content as the user types. */}
					<colgroup>
						{hasRowNumbers && <col style={{ width: gutterWidth }} />}
						{columns.map(column => (
							<col key={column.key} style={{ width: resolveColumnWidth(column) }} />
						))}
					</colgroup>

					<thead className="grid-head">
						<tr aria-rowindex={1}>
							{hasRowNumbers && (
								/* The empty corner above the row numbers. `scope`
								 * would claim it heads a row or column; it heads
								 * neither. */
								<th className="grid-corner" aria-colindex={1} />
							)}

							{columns.map((column, columnIndex) => {
								const isSortable = column.isSortable !== false
								const isSorted = activeSort?.columnKey === column.key
								const isResizable = !isColumnResizeDisabled && column.isResizable !== false

								return (
									<th
										key={column.key}
										className="grid-header"
										scope="col"
										aria-colindex={columnIndex + 1 + (hasRowNumbers ? 1 : 0)}
										/* The one ARIA attribute that matters on a
										 * sortable header: it is how a screen
										 * reader announces the current direction
										 * rather than just "sortable". */
										aria-sort={isSorted ? (activeSort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
										style={{ textAlign: resolveAlign(column) }}
									>
										{isSortable ? (
											/* A real button, so the header is
											 * reachable by keyboard and announced
											 * as pressable. A click handler on the
											 * <th> alone would be neither. */
											<button
												type="button"
												className="grid-header-button"
												onClick={() => handleHeaderClick(column)}
											>
												<span className="grid-header-label">{column.header}</span>
												<span
													className={
														isSorted
															? `grid-sort-arrow grid-sort-arrow-${activeSort.direction}`
															: 'grid-sort-arrow'
													}
													aria-hidden="true"
												/>
											</button>
										) : (
											<span className="grid-header-label">{column.header}</span>
										)}

										{isResizable && (
											<span
												className="grid-resize-column"
												/* Decorative to assistive tech: a
												 * drag handle it cannot operate,
												 * and the column already has a
												 * usable default width. */
												aria-hidden="true"
												onPointerDown={event =>
													handleResizeStart(
														event,
														'column',
														column.key,
														/* Only reached if the header
														 * cannot be measured; a
														 * flexible column has no
														 * declared width to fall
														 * back to. */
														resolveColumnWidth(column) ?? minColumnWidth
													)
												}
												onPointerMove={handleResizeMove}
												onPointerUp={handleResizeEnd}
												onDoubleClick={() => handleResizeReset('column', column.key)}
											/>
										)}
									</th>
								)
							})}
						</tr>
					</thead>

					<tbody>
						{viewRows.map(({ row, sourceIndex }, rowIndex) => {
							const rowId = identify(row, sourceIndex)
							const changeKind = effectiveDirtyRows.get(rowId)
							const isRowInRange = range ? rowIndex >= range.top && rowIndex <= range.bottom : false
							const rowHeight = rowHeights[rowId] ?? defaultRowHeight

							const gutterClassNames = ['grid-row-number']

							if (isRowInRange) {
								gutterClassNames.push('grid-row-number-active')
							}

							if (changeKind && !areChangeMarksHidden) {
								gutterClassNames.push(`grid-row-number-${changeKind}`)
							}

							return (
								<tr key={rowId} aria-rowindex={rowIndex + 2} style={{ height: rowHeight }}>
									{hasRowNumbers && (
										<th
											className={gutterClassNames.join(' ')}
											scope="row"
											aria-colindex={1}
										>
											{/* Row numbers follow the view, so they
											  * read 1..n after a sort rather than
											  * showing where the row came from —
											  * the same as a spreadsheet. */}
											<span className="grid-row-index">{rowIndex + 1}</span>

											{changeKind && !areChangeMarksHidden && (
												/* A glyph as well as a colour, so
												 * the mark survives greyscale and
												 * colour blindness. The title is
												 * what makes it self-explanatory
												 * the first time someone sees it. */
												<span
													className="grid-row-marker"
													title={changeKind === 'added' ? 'Added, not yet saved' : 'Changed, not yet saved'}
												>
													{changeKind === 'added' ? '+' : '*'}
												</span>
											)}

											{!isRowResizeDisabled && (
												<span
													className="grid-resize-row"
													aria-hidden="true"
													onPointerDown={event =>
														handleResizeStart(event, 'row', rowId, rowHeight)
													}
													onPointerMove={handleResizeMove}
													onPointerUp={handleResizeEnd}
													onDoubleClick={() => handleResizeReset('row', rowId)}
												/>
											)}
										</th>
									)}

									{columns.map((column, columnIndex) => {
										const isSelected = range ? isWithinRange(range, rowIndex, columnIndex) : false
										const isFocused =
											selection?.focus.row === rowIndex && selection?.focus.column === columnIndex
										const isEditingThisCell =
											editing?.row === rowIndex && editing?.column === columnIndex

										const classNames = ['grid-cell']

										if (isSelected) {
											classNames.push('grid-cell-selected')
										}

										if (isFocused) {
											classNames.push('grid-cell-focused')
										}

										if (column.isReadOnly) {
											classNames.push('grid-cell-readonly')
										}

										return (
											<td
												key={column.key}
												className={classNames.join(' ')}
												role="gridcell"
												aria-colindex={columnIndex + 1 + (hasRowNumbers ? 1 : 0)}
												aria-selected={isSelected}
												aria-readonly={column.isReadOnly ? true : undefined}
												data-row={rowIndex}
												data-column={columnIndex}
												/* Roving tabindex: exactly one cell
												 * is tabbable, so Tab enters and
												 * leaves the grid as a single stop
												 * instead of walking every cell.
												 * The first cell takes the role
												 * when nothing is selected, or the
												 * grid could not be reached by
												 * keyboard at all. */
												tabIndex={
													isFocused || (!selection && rowIndex === 0 && columnIndex === 0)
														? 0
														: -1
												}
												style={{ textAlign: resolveAlign(column) }}
												onMouseDown={event =>
													handleCellMouseDown(event, { row: rowIndex, column: columnIndex })
												}
												onMouseEnter={() =>
													handleCellMouseEnter({ row: rowIndex, column: columnIndex })
												}
												onDoubleClick={() =>
													beginEdit({ row: rowIndex, column: columnIndex }, null)
												}
											>
												{isEditingThisCell ? (
													<input
														ref={editorRef}
														className="grid-editor"
														value={editing.draft}
														/* Autofocus by ref callback
														 * rather than an effect, so
														 * it happens on the render
														 * that creates the input. */
														autoFocus
														aria-label={`${column.header}, row ${rowIndex + 1}`}
														onChange={event =>
															setEditing({ ...editing, draft: event.target.value })
														}
														onKeyDown={handleEditorKeyDown}
														/* Clicking away commits
														 * rather than discarding.
														 * Losing typing to a stray
														 * click is the kind of thing
														 * that makes people distrust
														 * a grid. */
														onBlur={() => commitEdit(null)}
													/>
												) : (
													formatCell(column, row)
												)}
											</td>
										)
									})}
								</tr>
							)
						})}
					</tbody>
				</table>

				{rowCount === 0 && <p className="grid-empty">No items</p>}
			</div>
		</div>
	)
}

export default DataGrid
