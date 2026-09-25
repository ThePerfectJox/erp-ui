/**
 * Spreadsheet grid.
 *
 * ```tsx
 * import { DataGrid } from './erp-ui-components/sheet'
 * ```
 *
 * `DataGrid` is the component. The three modules under it are pure and exported
 * in their own right, because they are useful without a grid on screen:
 *
 * - `clipboard` — the Excel TSV and HTML formats. Use `toTsv` to build an
 *   "export to clipboard" button, or `fromTsv` to accept a pasted block in a
 *   textarea import screen.
 * - `gridSort` — the cell comparator and the order computation.
 * - `gridSelection` — selection rectangle maths.
 */

export { default as DataGrid } from './DataGrid'
export type { GridChangeInfo, GridColumn, GridColumnType, GridRow, RowChangeKind } from './DataGrid'

export { fromTsv, readFromClipboard, toHtml, toTsv, writeToClipboard } from './clipboard'
export type { CellMatrix } from './clipboard'

export { compareCellValues, computeOrder, cycleSort } from './gridSort'
export type { CellComparator, GridSort, SortDirection } from './gridSort'

export { advanceWrapping, clampAddress, isWithinRange, pasteTargetSize, rangeSize, toRange } from './gridSelection'
export type { CellAddress, CellRange, CellSelection } from './gridSelection'
