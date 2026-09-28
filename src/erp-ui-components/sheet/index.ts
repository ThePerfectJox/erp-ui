/**
 * Spreadsheet grid.
 *
 * ```tsx
 * import { DataGrid } from './erp-ui-components/sheet'
 * import type { GridColumn, GridRow } from './erp-ui-components/sheet'
 * ```
 *
 * `DataGrid` is the component; read its doc comment first, it is the map to
 * everything else. The folder underneath it is in three layers:
 *
 * - `core/` — pure functions, no React. Clipboard formats, sort comparison,
 *   selection geometry, size arithmetic, value formatting. Re-exported below,
 *   because most of it is useful without a grid on screen: `toTsv` builds an
 *   "export to clipboard" button, `fromTsv` accepts a pasted block in a textarea
 *   import screen, `computeOrder` sorts a read-only list the same way the grid
 *   would.
 * - `hooks/` — one hook per concern: the view, the writer, the selection, the
 *   editor, the clipboard, the keyboard, the sizes, the dirty set. Internal. They
 *   are shaped around this component's own composition rather than around being a
 *   general-purpose grid kit, and exporting them would freeze that shape.
 * - `parts/` — the header cell, the body cell, the row gutter, the resize handle.
 *   Internal. Each is only valid inside a `<table role="grid">`.
 */

export { default as DataGrid } from './DataGrid'
export type { DataGridProps } from './DataGrid'

export type {
	CellAlign,
	GridChangeInfo,
	GridColumn,
	GridColumnType,
	GridDirtyRows,
	GridEdit,
	GridRow,
	GridViewRow,
	ResizeAxis,
	RowChangeKind,
} from './core/types'

export { formatCell, parseCell, resolveAlign } from './core/cellValue'

export { fromTsv, readFromClipboard, toHtml, toTsv, writeToClipboard } from './core/clipboard'
export type { CellMatrix } from './core/clipboard'

export { advanceWrapping, clampAddress, isWithinRange, pasteTargetSize, rangeSize, toRange } from './core/gridSelection'
export type { CellAddress, CellRange, CellSelection } from './core/gridSelection'

export { measureTableWidth, resizeTo, resolveColumnWidth, resolveRowHeight } from './core/gridSizing'
export type { ColumnWidthOverrides, RowHeightOverrides } from './core/gridSizing'

export { compareCellValues, computeOrder, cycleSort } from './core/gridSort'
export type { CellComparator, GridSort, SortDirection } from './core/gridSort'
