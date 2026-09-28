import { useRef } from 'react'
import { classNames } from '../shared/classNames'
import { isWithinRange } from './core/gridSelection'
import type { GridChangeInfo, GridColumn, GridDirtyRows, GridRow, RowChangeKind } from './core/types'
import {
	useGridClipboard,
	useGridDirtyRows,
	useGridEditing,
	useGridKeyboard,
	useGridSelection,
	useGridSizing,
	useGridView,
	useGridWriter,
} from './hooks'
import { useOutsidePointerDown } from '../shared/useOutsidePointerDown'
import { GridCell, GridFillerCell, GridHeaderCell, GridRowGutterCell, ResizeHandle } from './parts'
import './DataGrid.css'

/**
 * Width of the row-number gutter, in pixels.
 *
 * Has to agree with `.grid-corner`'s width in `DataGrid.css` — the number is
 * needed here to total the table's width, and there to make the sticky corner
 * line up. 3rem at the default root font size.
 */
const GUTTER_WIDTH = 48

export interface DataGridProps {
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

	// --- sizing --------------------------------------------------------------

	/**
	 * Caps the grid's height and scrolls vertically inside it, with the header
	 * staying put. Any CSS length.
	 *
	 * Left off, the grid is as tall as its rows and the page scrolls instead.
	 * Setting it is what makes the grid read as a spreadsheet pane embedded in a
	 * form — `"15rem"` shows about eight rows.
	 */
	maxBodyHeight?: string

	/**
	 * Pixel width for columns that do not declare their own. Defaults to 140.
	 *
	 * Every column in the grid has a definite width; nothing flexes to fill the
	 * container. Sum them and that is how wide the table is — wider than its
	 * parent and the grid scrolls sideways, narrower and the leftover space goes
	 * to a filler column at the right so the columns keep exactly the widths they
	 * were given. See `core/gridSizing.ts` for why, and `GridFillerCell` for how.
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
	dirtyRows?: GridDirtyRows

	/** Fires with the next dirty set whenever it changes. */
	onDirtyRowsChange?: (dirtyRows: Map<string, RowChangeKind>) => void

	/** Hides the change marks in the row gutter without disabling the tracking. */
	areChangeMarksHidden?: boolean
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
 *     maxBodyHeight="15rem"
 * />
 * ```
 *
 * -----------------------------------------------------------------------------
 * How it is put together
 * -----------------------------------------------------------------------------
 * This function is wiring and markup, nothing else. The behaviour is eight hooks
 * in `hooks/`, the pure logic is six modules in `core/`, and the markup is five
 * components in `parts/`. Each of those folders has an `index.ts` explaining what
 * belongs in it. Composition order below is dependency order, and it is the
 * reading order too.
 *
 * -----------------------------------------------------------------------------
 * Selecting
 * -----------------------------------------------------------------------------
 * A click selects one cell. A **range** needs either `Shift` or a **press and
 * hold** — dragging straight after a quick click does nothing. Cells in a form
 * are small and a click is rarely perfectly still, so arming the range on
 * mouse-down turns half the clicks in a dense grid into accidental 1 × 2
 * selections. Pressing anywhere outside the grid, or tabbing out of it, clears
 * the selection. `useGridSelection` has the longer version.
 *
 * -----------------------------------------------------------------------------
 * Sizing
 * -----------------------------------------------------------------------------
 * Every column has a definite pixel width and the grid scrolls both ways, like a
 * spreadsheet. The widths add up to the table's width: make them all small and
 * the table is narrow with a filler column taking the slack on the right; make
 * them all large and the grid scrolls horizontally. Drag a column's right edge or
 * a row's bottom edge in the gutter to resize, double-click either handle to put
 * it back. Sizes are per-session — lift `useGridSizing` out if they need to
 * survive a reload.
 *
 * -----------------------------------------------------------------------------
 * The rest
 * -----------------------------------------------------------------------------
 * **Clipboard.** Select a range and `Ctrl+C`, then paste into Excel and it
 * arrives as cells. Copy a block out of Excel and `Ctrl+V` here and it lands in
 * the grid. Both go through the `text/plain` TSV and `text/html` table Excel
 * actually uses — see `core/clipboard.ts`. Cells holding tabs or line breaks
 * survive.
 *
 * **Sorting** is a view, never an edit. Clicking a header cycles ascending →
 * descending → back to document order, and `onChange` still hands rows back in
 * their original sequence. The order is recomputed only when a header is clicked,
 * not when a value changes, so editing a sorted column does not make the row jump
 * out from under the cursor mid-keystroke.
 *
 * **Keyboard** is documented as a table in `useGridKeyboard`.
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
	defaultColumnWidth = 140,
	defaultRowHeight = 30,
	minColumnWidth = 48,
	minRowHeight = 22,
	isColumnResizeDisabled,
	isRowResizeDisabled,
	dirtyRows,
	onDirtyRowsChange,
	areChangeMarksHidden,
}: DataGridProps) {
	/** The whole component. A press outside this is a press outside the grid. */
	const rootRef = useRef<HTMLDivElement>(null)

	/** The scrollport, and the root of the cell lookup that moves focus. */
	const scrollRef = useRef<HTMLDivElement>(null)

	const columnCount = columns.length
	const gutterWidth = hasRowNumbers ? GUTTER_WIDTH : 0

	/* Read-only either by request or by omission: a grid with no `onChange` has
	 * nowhere to put an edit, so offering one would be a lie. */
	const isEditable = !isReadOnly && Boolean(onChange)

	const identify = (row: GridRow, sourceIndex: number) =>
		getRowId ? getRowId(row, sourceIndex) : String(sourceIndex)

	// --- behaviour, in dependency order --------------------------------------

	const sizing = useGridSizing({
		columns,
		gutterWidth,
		defaultColumnWidth,
		defaultRowHeight,
		minColumnWidth,
		minRowHeight,
	})

	const view = useGridView({ rows })

	const dirty = useGridDirtyRows({ dirtyRows, onDirtyRowsChange })

	const writer = useGridWriter({
		rows,
		columns,
		viewRows: view.viewRows,
		isEditable,
		canGrowOnPaste,
		dirtyRows: dirty.dirtyRows,
		identify,
		publishDirtyRows: dirty.publish,
		appendToOrder: view.appendToOrder,
		onChange,
	})

	const selection = useGridSelection({ rowCount: view.rowCount, columnCount, scrollRef })

	const editing = useGridEditing({
		columns,
		viewRows: view.viewRows,
		isEditable,
		writer,
		select: selection.select,
	})

	const clipboard = useGridClipboard({
		columns,
		viewRows: view.viewRows,
		range: selection.range,
		rowCount: view.rowCount,
		columnCount,
		isEditing: editing.isEditing,
		isEditable,
		canGrowOnPaste,
		writer,
		replaceSelection: selection.replace,
	})

	const handleKeyDown = useGridKeyboard({
		rowCount: view.rowCount,
		columnCount,
		range: selection.range,
		isEditable,
		selection,
		editing,
		writer,
	})

	/* Deselect on a press anywhere else on the screen. Attached only while
	 * something is selected, so an idle grid on a busy screen costs no listener. */
	useOutsidePointerDown(rootRef, selection.clear, selection.selection !== null)

	/**
	 * Re-sorting invalidates the selection and any open editor, because both are
	 * addressed by visual position and every row is about to move. Cleared here
	 * rather than inside `useGridView` — see the note there.
	 */
	const handleSort = (column: GridColumn) => {
		view.sortByColumn(column)
		selection.clear()
		editing.cancel()
	}

	// --- render --------------------------------------------------------------

	const { range } = selection
	const focus = selection.selection?.focus
	const openEdit = editing.editing

	/* `grid-scroll-armed` shows that a drag will now extend the selection. Without
	 * it the arming delay is invisible and the grid just feels inconsistent. */
	const scrollClassName = classNames('grid-scroll', selection.isRangeArmed && 'grid-scroll-armed')

	return (
		<div
			className="grid"
			ref={rootRef}
			/* Deselect when focus leaves for another control — the keyboard
			 * counterpart of the outside press above.
			 *
			 * `relatedTarget` must be a real node: React reports `null` when focus
			 * goes nowhere in particular, which also happens on an innocent click
			 * inside the grid, and clearing on that would deselect at random. */
			onBlur={event => {
				if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
					selection.clear()
				}
			}}
		>
			{/* No id, and the table is named with aria-label rather than
			  * aria-labelledby — a hardcoded id would collide the moment a screen
			  * had two grids on it. */}
			<p className={classNames('grid-caption', isCaptionHidden && 'erp-visually-hidden')}>{caption}</p>

			<div
				className={scrollClassName}
				ref={scrollRef}
				style={maxBodyHeight ? { maxHeight: maxBodyHeight } : undefined}
			>
				{/* The clipboard and key handlers sit here rather than on each cell:
				  * the events are raised on the focused cell and bubble, so one set
				  * of handlers covers the whole grid.
				  *
				  * The width is the sum of the columns. `min-width: 100%` in the
				  * stylesheet stretches it to the container when that total is
				  * smaller, and the filler column absorbs the difference. */}
				<table
					className="grid-table"
					role="grid"
					aria-label={caption}
					aria-rowcount={view.rowCount + 1}
					aria-colcount={columnCount + (hasRowNumbers ? 1 : 0)}
					style={{ width: sizing.tableWidth }}
					onKeyDown={handleKeyDown}
					onCopy={clipboard.handleCopy}
					onCut={clipboard.handleCut}
					onPaste={clipboard.handlePaste}
				>
					{/* Widths declared once here rather than on every cell. With
					  * `table-layout: fixed` these are authoritative, so the columns
					  * hold their size instead of being re-fitted to their content as
					  * the user types. The last <col> has no width: it is the filler,
					  * and auto is what lets it take the slack. */}
					<colgroup>
						{hasRowNumbers && <col style={{ width: gutterWidth }} />}

						{columns.map(column => (
							<col key={column.key} style={{ width: sizing.getColumnWidth(column) }} />
						))}

						<col />
					</colgroup>

					<thead className="grid-head">
						<tr aria-rowindex={1}>
							{hasRowNumbers && (
								/* The empty corner above the row numbers. `scope` would
								 * claim it heads a row or column; it heads neither. */
								<th className="grid-corner" aria-colindex={1} />
							)}

							{columns.map((column, columnIndex) => {
								const isResizable = !isColumnResizeDisabled && column.isResizable !== false

								return (
									<GridHeaderCell
										key={column.key}
										column={column}
										ariaColIndex={columnIndex + 1 + (hasRowNumbers ? 1 : 0)}
										sortDirection={
											view.activeSort?.columnKey === column.key ? view.activeSort.direction : null
										}
										isSortable={column.isSortable !== false}
										onSort={() => handleSort(column)}
										resizeHandle={
											isResizable && (
												<ResizeHandle
													axis="column"
													{...sizing.getResizeProps(
														'column',
														column.key,
														sizing.getColumnWidth(column)
													)}
												/>
											)
										}
									/>
								)
							})}

							<GridFillerCell isHeader />
						</tr>
					</thead>

					<tbody>
						{view.viewRows.map(({ row, sourceIndex }, rowIndex) => {
							const rowId = identify(row, sourceIndex)
							const rowHeight = sizing.getRowHeight(rowId)
							const isRowInRange = range ? rowIndex >= range.top && rowIndex <= range.bottom : false

							const changeKind = areChangeMarksHidden ? null : (dirty.dirtyRows.get(rowId) ?? null)

							return (
								<tr key={rowId} aria-rowindex={rowIndex + 2} style={{ height: rowHeight }}>
									{hasRowNumbers && (
										<GridRowGutterCell
											rowNumber={rowIndex + 1}
											isInSelection={isRowInRange}
											changeKind={changeKind}
											resizeHandle={
												!isRowResizeDisabled && (
													<ResizeHandle
														axis="row"
														{...sizing.getResizeProps('row', rowId, rowHeight)}
													/>
												)
											}
										/>
									)}

									{columns.map((column, columnIndex) => {
										const isFocused = focus?.row === rowIndex && focus.column === columnIndex

										/* The draft in one expression rather than a boolean
										 * plus a lookup, so the narrowing survives to the
										 * property access. */
										const editDraft =
											openEdit && openEdit.row === rowIndex && openEdit.column === columnIndex
												? openEdit.draft
												: null

										return (
											<GridCell
												key={column.key}
												column={column}
												row={row}
												rowIndex={rowIndex}
												columnIndex={columnIndex}
												ariaColIndex={columnIndex + 1 + (hasRowNumbers ? 1 : 0)}
												isSelected={range ? isWithinRange(range, rowIndex, columnIndex) : false}
												isFocused={isFocused}
												/* The first cell takes the tab stop while
												 * nothing is selected, or the grid could
												 * not be reached by keyboard at all. */
												isTabStop={
													isFocused ||
													(!selection.selection && rowIndex === 0 && columnIndex === 0)
												}
												editDraft={editDraft}
												onPress={selection.handleCellMouseDown}
												onHover={selection.handleCellMouseEnter}
												onOpenEditor={address => editing.begin(address, null)}
												onDraftChange={editing.setDraft}
												onEditorKeyDown={editing.handleEditorKeyDown}
												onEditorCommit={() => editing.commit(null)}
											/>
										)
									})}

									<GridFillerCell />
								</tr>
							)
						})}
					</tbody>
				</table>

				{view.rowCount === 0 && <p className="grid-empty">No items</p>}
			</div>
		</div>
	)
}

export default DataGrid
