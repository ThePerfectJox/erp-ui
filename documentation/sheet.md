# `sheet/` — `DataGrid`, the editable spreadsheet grid

An Excel-like grid: sortable, resizable, copies and pastes as a spreadsheet, and
marks the rows you have changed. For **editing**. If the user reads rather than
types, use [`ViewTable`](./table.md).

```tsx
import { DataGrid } from './erp-ui-components/sheet'
import type { GridColumn, GridRow } from './erp-ui-components/sheet'

const [rows, setRows] = useState(items)
const [dirtyRows, setDirtyRows] = useState(new Map())

<DataGrid
  caption="Purchase order items"
  columns={[
    { key: 'material', header: 'Material', width: 160 },
    { key: 'quantity', header: 'Quantity', type: 'number' },
  ]}
  rows={rows}
  onChange={setRows}
  getRowId={row => String(row.itemNumber)}
  dirtyRows={dirtyRows}
  onDirtyRowsChange={setDirtyRows}
  maxBodyHeight="15rem"
/>
```

## `DataGrid` props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `columns` | `readonly GridColumn[]` | — | |
| `rows` | `readonly GridRow[]` | — | controlled — pair with `onChange` |
| `onChange` | `(rows, change: GridChangeInfo) => void` | | rows in **original order**; omitting it makes the grid read-only in practice |
| `getRowId` | `(row, sourceIndex) => string` | position | strongly recommended once you care which rows are dirty |
| `caption` | `string` | — | **required**; `aria-label` + shown above the grid |
| `isCaptionHidden` | `boolean` | | hides the caption visually |
| `isReadOnly` | `boolean` | | blocks editing; selection/sort/resize/copy still work |
| `canGrowOnPaste` | `boolean` | `false` | lets a paste past the last row append rows marked `"added"` |
| `hasRowNumbers` | `boolean` | `true` | Excel-style row numbers down the left |
| `maxBodyHeight` | `string` | | caps height and scrolls, header stays put; `"15rem"` ≈ 8 rows |
| `defaultColumnWidth` | `number` | `140` | px, for columns that don't declare their own |
| `defaultRowHeight` | `number` | `30` | px |
| `minColumnWidth` | `number` | `48` | drag floor |
| `minRowHeight` | `number` | `22` | drag floor |
| `isColumnResizeDisabled` | `boolean` | | |
| `isRowResizeDisabled` | `boolean` | | |
| `dirtyRows` | `GridDirtyRows` | | controlled dirty set — pair with `onDirtyRowsChange` |
| `onDirtyRowsChange` | `(dirtyRows: Map<string, RowChangeKind>) => void` | | |
| `areChangeMarksHidden` | `boolean` | | hides the marks without disabling tracking |

`isEditable` is `!isReadOnly && Boolean(onChange)` — a grid with no `onChange`
has nowhere to put an edit, so offering one would be a lie.

### The controlled dirty set

Pass `dirtyRows` + `onDirtyRowsChange` when the save flow needs to clear the
marks — and clear them only once the server has agreed:

```tsx
async function save() {
  await postChanges(rows, dirtyRows)
  setDirtyRows(new Map())   // marks clear only once the server accepted
}
```

Left off, the grid keeps the set itself, which is fine for a screen that only
displays the marks but can't reset them from outside.

## `GridColumn`

| Field | Type | Notes |
| --- | --- | --- |
| `key` | `string` | key into the row object |
| `header` | `string` | column heading |
| `width` | `number` | **pixels** (a drag delta is in px); defaults to `defaultColumnWidth` |
| `type` | `'text' \| 'number'` | default `'text'` |
| `align` | `'start' \| 'center' \| 'end'` | overrides the alignment implied by `type` |
| `isReadOnly` | `boolean` | blocks editing and pasting for this column |
| `isSortable` | `boolean` | everything is sortable by default |
| `isResizable` | `boolean` | |
| `format` | `(value, row) => string` | stored value → cell text *and* clipboard text (the same string) |
| `parse` | `(text) => unknown` | pasted/typed text → stored value; where locale belongs |
| `compare` | `CellComparator` | override the sort |
| `sortValue` | `(row) => unknown` | the value to sort on for a **derived** column |

Every column has a **definite** pixel width — nothing flexes. The widths add up
to the table's width: narrower than the container and a filler column takes the
slack on the right; wider and the grid scrolls sideways. That's what makes it
behave like a spreadsheet.

A `format` that adds a thousands separator needs a matching `parse` that removes
it, or the cell becomes unpasteable.

## Key types

- `GridRow = Record<string, unknown>`
- `RowChangeKind = 'added' | 'edited'` — decides the verb on save: `"edited"` is
  a `PATCH`, `"added"` is a `POST`
- `GridDirtyRows = ReadonlyMap<string, RowChangeKind>`
- `GridChangeInfo = { changedRowIds: string[]; dirtyRows: Map<string, RowChangeKind> }`
- `GridViewRow = { row: GridRow; sourceIndex: number }` — see below

## How it is put together

`DataGrid.tsx` is wiring and markup, nothing else. The behavior is **eight
hooks**, the pure logic is **six `core/` modules**, and the markup is **five
`parts/`**. The composition order in the component is dependency order:

```text
useGridSizing → useGridView → useGridDirtyRows → useGridWriter
  → useGridSelection → useGridEditing → useGridClipboard → useGridKeyboard
```

### The one idea that ties it together: visual vs source coordinates

Everything the user does is in **visual** coordinates (the row/column on screen).
Everything written back must be in **source** coordinates (the position in
`rows`). The bridge is `GridViewRow { row, sourceIndex }`, produced by
`useGridView` and consumed by `useGridWriter`. `useGridWriter` is the **single
write path** — typing, paste and Delete all reduce to one `writeBlock` call that
maps visual → source, respects read-only columns, diffs values before marking a
row dirty, and then calls `onChange` + publishes the dirty set.

### The hooks

- **`useGridSizing`** — column widths, row heights, resize drags (pointer
  capture; double-click resets; sizes are per-session).
- **`useGridView`** — the sort/display order. Sorting is a *view*: it holds a
  frozen order in state so editing a sorted cell doesn't relocate the row
  mid-keystroke. `onChange` still hands rows back in original order.
- **`useGridDirtyRows`** — the controlled/uncontrolled dirty set.
- **`useGridWriter`** — the single write path (above).
- **`useGridSelection`** — the `{ anchor, focus }` selection and its range.
  Range selection is *armed*, not automatic: a single click is one cell; a range
  needs `Shift` or a 250ms press-and-hold, because cells in a form are small and
  a click is rarely perfectly still.
- **`useGridEditing`** — the one open cell editor.
- **`useGridClipboard`** — handles the browser's real `copy`/`cut`/`paste`
  events, so no permission prompt. Reads/writes both `text/plain` TSV and
  `text/html` table, which is what Excel actually uses, so cells holding tabs or
  line breaks survive the round trip.
- **`useGridKeyboard`** — one bubbled handler on the table (arrows, Tab, Enter,
  Delete, Home/End). It deliberately leaves `Ctrl+C/X/V` alone so the browser
  raises real clipboard events, and Tab falls through at the grid corners so it's
  never a keyboard trap.

The hooks are internal — shaped around this component's composition, not around
being a general grid kit.

## What it deliberately is not

No virtualization (built for hundreds of rows, not tens of thousands), no column
reordering or grouping, no formulas, merged cells or undo. Each is a real feature
rather than a flag, and a grid that pretends otherwise is how these components
become unmaintainable.

## Building blocks (barrel exports)

The barrel exports `DataGrid`, its types, and the pure `core/` layer for building
on the same primitives:

- `formatCell`, `parseCell`, `resolveAlign` (`core/cellValue`)
- `fromTsv`, `toTsv`, `toHtml`, `readFromClipboard`, `writeToClipboard` (+ type
  `CellMatrix`) — `toTsv` builds an "export to clipboard" button; `fromTsv`
  accepts a pasted block in an import screen
- `advanceWrapping`, `clampAddress`, `isWithinRange`, `pasteTargetSize`,
  `rangeSize`, `toRange` (+ types `CellAddress`, `CellRange`, `CellSelection`)
- `measureTableWidth`, `resizeTo`, `resolveColumnWidth`, `resolveRowHeight`
  (+ types `ColumnWidthOverrides`, `RowHeightOverrides`)

Sorting is **not** re-exported here — it's `shared/sortRows`, shared with
`ViewTable`. Import it from the library barrel. See [shared.md](./shared.md).
