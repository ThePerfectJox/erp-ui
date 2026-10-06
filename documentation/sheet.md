# Sheet (DataGrid)

## What it is

`DataGrid` is an Excel-like editable grid, for tables people type into:
purchase order items, price lists, stock counts.

- Click a cell and type to edit it. Navigate with arrows, Tab and Enter.
- Select ranges with Shift or by pressing and holding, and copy/paste to and
  from Excel as real cells.
- Sort by clicking a header. Resize columns and rows by dragging.
- Rows you change are marked in the row-number gutter (`*` edited, `+` added)
  until you clear the marks after saving.

Every cell holds text. If you need badges, links or buttons in cells, and
users only read the table, use [`ViewTable`](./table.md) instead.

```tsx
import { DataGrid } from './erp-ui-components/sheet'
import type { GridColumn, GridRow, RowChangeKind } from './erp-ui-components/sheet'
```

## How to use it

### A basic editable grid

`DataGrid` is controlled: you own `rows` and update them in `onChange`.

```tsx
const COLUMNS: GridColumn[] = [
  { key: 'item', header: 'Item', width: 70, type: 'number', isReadOnly: true },
  { key: 'material', header: 'Material', width: 160 },
  { key: 'description', header: 'Description', width: 240 },
  { key: 'quantity', header: 'Quantity', width: 100, type: 'number' },
  { key: 'price', header: 'Net price', width: 110, type: 'number' },
]

function ItemsGrid() {
  const [rows, setRows] = useState<GridRow[]>(INITIAL_ITEMS)

  return (
    <DataGrid
      caption="Purchase order items"
      columns={COLUMNS}
      rows={rows}
      onChange={setRows}
      getRowId={row => String(row.item)}
      maxBodyHeight="15rem"
    />
  )
}
```

- `onChange` receives the complete new rows array, always in the original
  order, even when the grid is sorted.
- Without `onChange` (or with `isReadOnly`) the grid can't be edited, but
  users can still select, sort, resize and copy.
- `getRowId` should return a stable id. It's the key for the changed-row
  marks; without it rows are identified by position.
- `maxBodyHeight` makes the grid a scrolling pane (`"15rem"` is about 8 rows).
  The header and row numbers stay visible while scrolling.

### Saving and clearing the change marks

To clear the marks after a save, control the dirty set:

```tsx
const [rows, setRows] = useState<GridRow[]>(items)
const [dirtyRows, setDirtyRows] = useState<Map<string, RowChangeKind>>(new Map())

<DataGrid
  caption="Items"
  columns={COLUMNS}
  rows={rows}
  onChange={setRows}
  getRowId={row => String(row.item)}
  dirtyRows={dirtyRows}
  onDirtyRowsChange={setDirtyRows}
/>

async function save() {
  const added = [...dirtyRows].filter(([, kind]) => kind === 'added').map(([id]) => id)
  const edited = [...dirtyRows].filter(([, kind]) => kind === 'edited').map(([id]) => id)

  await Promise.all([createItems(added), updateItems(edited)])
  setDirtyRows(new Map())   // clear only after the server accepted the changes
}
```

`'edited'` rows already exist (update them), `'added'` rows are new (create
them). A row only becomes dirty when its value really changes; typing the same
value again doesn't mark it. A row that was added and then edited stays
`'added'`.

If you don't pass `dirtyRows`, the grid tracks the set itself. The marks then
show, but you can't reset them.

### Formatting, parsing and derived columns

`format` turns a stored value into cell text. That same text is what gets
copied to the clipboard. `parse` turns typed or pasted text back into a stored
value.

```tsx
const COLUMNS: GridColumn[] = [
  {
    key: 'price', header: 'Net price', type: 'number',
    format: value => (value == null ? '' : Number(value).toFixed(2)),
    // accept German-style input like "1.234,56"
    parse: text => {
      const number = Number(text.replace(/\./g, '').replace(',', '.'))
      return Number.isNaN(number) ? text : number
    },
  },
  {
    // derived: nothing is stored under 'total'
    key: 'total', header: 'Net value', type: 'number', isReadOnly: true,
    format: (_value, row) => (Number(row.quantity) * Number(row.price)).toFixed(2),
    sortValue: row => Number(row.quantity) * Number(row.price),
  },
]
```

Without `parse`, input is trimmed, empty input becomes `null`, and in a
`type: 'number'` column text is converted with `Number()`. Text that isn't a
number is kept as text.

If `format` adds something like a thousands separator, add a `parse` that
removes it, or pasting the cell back in won't work.

### Pasting new rows

By default, a paste that runs past the last row is cut off. With
`canGrowOnPaste`, extra rows are appended and marked `'added'`. A new row has
every column key set to `null`, then the pasted values are written in.
Read-only columns stay `null`.

So make sure `getRowId` still returns a unique id for a new row, where your id
column may be `null`:

```tsx
<DataGrid
  …
  canGrowOnPaste
  getRowId={(row, index) => (row.item == null ? `new-${index}` : String(row.item))}
/>
```

### A read-only grid

```tsx
<DataGrid caption="Items to be deleted" columns={COLUMNS} rows={items} getRowId={row => String(row.item)} isReadOnly />
```

## Keyboard and mouse

Click a cell first. The keys below act on the selected cell.

| Key | Action |
| --- | --- |
| Arrow keys | Move one cell |
| Shift + arrows | Extend the selection |
| Tab / Shift+Tab | Next / previous cell, wrapping at row ends. At the first or last cell, focus leaves the grid. |
| Home / End | First / last cell in the row |
| Ctrl+Home / Ctrl+End | First / last cell in the grid |
| Ctrl+A | Select all cells |
| Enter or F2 | Edit the cell, keeping its value |
| Any character | Edit the cell, replacing its value |
| Delete / Backspace | Clear the selected cells |
| Esc | Clear the selection |
| Ctrl+C / Ctrl+X / Ctrl+V | Copy / cut / paste (Cmd on macOS) |

While editing:

| Key | Action |
| --- | --- |
| Enter | Save and move down |
| Tab / Shift+Tab | Save and move right / left |
| Esc | Cancel the edit |
| Click elsewhere | Save |

Mouse:

- Click selects one cell. Double-click edits it.
- Shift+click, or press and hold for 250ms then drag, selects a range. A quick
  click followed by a drag does nothing, to avoid accidental ranges.
- Click a header to sort: ascending → descending → original order. Sorting
  clears the selection.
- Drag the right edge of a header, or the bottom edge of a row number, to
  resize. Double-click the edge to reset it.
- Clicking outside the grid clears the selection.

Paste rules: a single copied cell fills the whole selected range. A larger
block is pasted starting at the top-left selected cell. Read-only columns are
skipped.

## API reference

### `DataGrid` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `readonly GridColumn[]` | | Required. |
| `rows` | `readonly GridRow[]` | | Required. Controlled. |
| `onChange` | `(rows: GridRow[], change: GridChangeInfo) => void` | | New rows in original order. Leave it off for a read-only grid. |
| `getRowId` | `(row, sourceIndex) => string` | position | Stable row id. |
| `caption` | `string` | | Required. Shown above the grid and used as its accessible name. |
| `isCaptionHidden` | `boolean` | | Hides the caption visually. |
| `isReadOnly` | `boolean` | | Blocks editing. Selecting, sorting, resizing and copying still work. |
| `canGrowOnPaste` | `boolean` | `false` | Lets a paste append rows. |
| `hasRowNumbers` | `boolean` | `true` | Row-number gutter on the left. The change marks are drawn there, so turning it off hides them. |
| `maxBodyHeight` | `string` | | Any CSS length. |
| `defaultColumnWidth` | `number` | `140` | Pixels, for columns without `width`. |
| `defaultRowHeight` | `number` | `30` | Pixels. |
| `minColumnWidth` | `number` | `48` | Smallest width when dragging. |
| `minRowHeight` | `number` | `22` | Smallest height when dragging. |
| `isColumnResizeDisabled` | `boolean` | | |
| `isRowResizeDisabled` | `boolean` | | |
| `dirtyRows` | `ReadonlyMap<string, RowChangeKind>` | | Controlled dirty set. |
| `onDirtyRowsChange` | `(dirtyRows: Map<string, RowChangeKind>) => void` | | |
| `areChangeMarksHidden` | `boolean` | | Hides the marks but keeps tracking. |

`DataGrid` doesn't take a `className`. Wrap it in your own element to style it.

### `GridColumn`

| Field | Type | Description |
| --- | --- | --- |
| `key` | `string` | Required. Key into the row object. |
| `header` | `string` | Required. |
| `width` | `number` | Pixels. Defaults to `defaultColumnWidth`. |
| `type` | `'text' \| 'number'` | Default `'text'`. Numbers are right-aligned and parsed with `Number()`. |
| `align` | `'start' \| 'center' \| 'end'` | Overrides the alignment from `type`. |
| `isReadOnly` | `boolean` | Blocks editing and pasting in this column. Shown greyed. |
| `isSortable` | `boolean` | `false` blocks sorting. |
| `isResizable` | `boolean` | `false` blocks resizing. |
| `format` | `(value, row) => string` | Stored value to cell and clipboard text. |
| `parse` | `(text) => unknown` | Typed/pasted text to stored value. |
| `sortValue` | `(row) => unknown` | Value to sort on, for derived columns. |
| `compare` | `(left, right) => number` | Custom sort comparison. |

Columns have exact pixel widths and never stretch. If they're narrower than
the container, an empty filler column takes the remaining space. If they're
wider, the grid scrolls sideways.

### Types

```ts
type GridRow = Record<string, unknown>
type RowChangeKind = 'added' | 'edited'
type GridDirtyRows = ReadonlyMap<string, RowChangeKind>

interface GridChangeInfo {
  changedRowIds: string[]                  // rows touched by this change
  dirtyRows: Map<string, RowChangeKind>    // all unsaved rows
}
```

Also exported: `DataGridProps`, `GridColumnType`, `CellAlign`, `GridViewRow`,
`GridEdit`, `ResizeAxis`.

## How to customize

### With props

Sizes (`defaultColumnWidth`, `defaultRowHeight`, column `width`,
`maxBodyHeight`), `hasRowNumbers`, `areChangeMarksHidden`, column `align` and
`isReadOnly`.

### With tokens

The grid has no grid-specific variables. Set global tokens on a wrapper:

| Token | Used for |
| --- | --- |
| `--color-surface` | cell background, active cell |
| `--color-surface-sunken` | header and row-number background |
| `--color-surface-alt` | read-only cells |
| `--color-primary-soft` | selected range, sorted header, selected rows' numbers |
| `--color-primary` | active cell border, sort arrow, resize handle |
| `--color-primary-active` | sorted header and active row-number text |
| `--color-warning`, `--color-warning-border` | edited-row mark |
| `--color-success`, `--color-success-border` | added-row mark |
| `--color-border`, `--color-border-strong` | grid lines, frame |
| `--text-sm`, `--text-xs` | cell text, header text |

```tsx
<div className="price-grid">
  <DataGrid … />
</div>
```

```css
.price-grid {
  --color-primary-soft: #e8f5e9;   /* green selection */
  --color-primary: #2b7d42;        /* green active cell */
}
```

### With CSS classes

```text
div.grid
  p.grid-caption
  div.grid-scroll(.grid-scroll-armed)          scroll container
    table.grid-table
      thead.grid-head
        th.grid-corner
        th.grid-header[aria-sort]
          button.grid-header-button
            span.grid-header-label
            span.grid-sort-arrow.grid-sort-arrow-asc
          span.grid-resize-column
        th.grid-filler.grid-filler-header
      tbody > tr
        th.grid-row-number(.grid-row-number-active / -edited / -added)
          span.grid-row-index
          span.grid-row-marker                 * or +
          span.grid-resize-row
        td.grid-cell(.grid-cell-selected / -focused / -readonly)
          input.grid-editor                     only while editing
        td.grid-filler
    p.grid-empty
```

| Class / selector | Element |
| --- | --- |
| `.grid` | outer wrapper |
| `.grid-caption` | caption |
| `.grid-scroll`, `.grid-scroll-armed` | scroll container; `-armed` while a range drag is active |
| `.grid-table` | the `<table>` |
| `.grid-header`, `.grid-header[aria-sort]` | header cell, sorted header |
| `.grid-header-button`, `.grid-header-label`, `.grid-header-label-static` | sortable / unsortable header content |
| `.grid-sort-arrow`, `-asc`, `-desc` | sort arrow |
| `.grid-corner` | empty cell above the row numbers (3rem wide; don't change it) |
| `.grid-row-number`, `-active`, `-edited`, `-added` | row-number gutter |
| `.grid-row-index`, `.grid-row-marker` | the number, the `*`/`+` mark |
| `.grid-cell`, `-selected`, `-focused`, `-readonly` | cells and their states |
| `.grid-editor` | the input in the cell being edited |
| `.grid-resize-column`, `.grid-resize-row` | resize handles |
| `.grid-filler`, `.grid-filler-header` | filler column |
| `.grid-empty` | "No items" message |

Cells also have `aria-selected`, `aria-readonly`, `data-row` and `data-column`
attributes (`data-*` are zero-based visual positions).

Examples:

```css
/* Zebra stripes */
.price-grid tbody tr:nth-child(even) .grid-cell:not(.grid-cell-selected, .grid-cell-focused) {
  background-color: var(--color-surface-alt);
}

/* Header in normal case instead of uppercase */
.price-grid .grid-header { text-transform: none; font-size: var(--text-sm); }

/* A stronger edited mark */
.price-grid .grid-row-number-edited { background-color: var(--color-warning-soft); }
```

Column widths, row heights, cell alignment and `maxBodyHeight` are inline
styles; change them through props.

## Building blocks

Pure functions from the grid's `core`, for related features outside a grid.

| Export | Signature | Use |
| --- | --- | --- |
| `toTsv` | `(matrix: string[][]) => string` | Tab-separated text Excel pastes as cells. Quotes cells with tabs, quotes or line breaks. |
| `fromTsv` | `(text: string) => string[][]` | Parse text copied from Excel. Drops Excel's trailing empty row. |
| `toHtml` | `(matrix: string[][]) => string` | An HTML table Excel accepts; keeps leading zeros and long numbers as text. |
| `writeToClipboard` | `(clipboardData: DataTransfer, matrix) => void` | Writes TSV and HTML inside a `copy` event handler. |
| `readFromClipboard` | `(clipboardData: DataTransfer) => string[][]` | Reads the plain text inside a `paste` event handler. |
| `formatCell` | `(column, row) => string` | The cell text the grid shows. |
| `parseCell` | `(column, text) => unknown` | The grid's parsing rules. |
| `resolveAlign` | `(column) => CellAlign` | |
| `toRange`, `isWithinRange`, `rangeSize`, `clampAddress`, `advanceWrapping`, `pasteTargetSize` | | Cell selection geometry. Types `CellAddress`, `CellRange`, `CellSelection`. |
| `resolveColumnWidth`, `resolveRowHeight`, `measureTableWidth`, `resizeTo` | | Sizing math. Types `ColumnWidthOverrides`, `RowHeightOverrides`. |

Example: a "Copy for Excel" button outside the grid.

```tsx
import { formatCell, toTsv } from './erp-ui-components/sheet'

const copyAll = () => {
  const matrix = [COLUMNS.map(column => column.header), ...rows.map(row => COLUMNS.map(column => formatCell(column, row)))]
  void navigator.clipboard.writeText(toTsv(matrix))
}
```

Sorting (`computeOrder`, `compareCellValues`) is shared with `ViewTable`; see
[shared.md](./shared.md).

## Limits

Built for hundreds of rows, not tens of thousands (no virtualization). No
column reordering, grouping, formulas, merged cells or undo. Column and row
sizes reset on reload. A grid with no rows can't be typed or pasted into,
because there's no cell to select; add a first row yourself (an "Add item"
button that appends a blank row to `rows`).
