# `table/` — `ViewTable`, the read-only report table

A table for **reading**: rows sorted, sometimes ticked, clicked through to a
detail screen. Cells can hold anything — a badge, a link, a button — and columns
size themselves to their content.

```tsx
import { ViewTable, TablePagination, useTablePagination } from './erp-ui-components/table'
import type { TableColumn } from './erp-ui-components/table'
```

## `ViewTable` or `DataGrid`?

| | `ViewTable` | `DataGrid` (`sheet/`) |
| --- | --- | --- |
| For | reading | editing |
| Cell content | anything — badges, links, buttons | text |
| Columns | size to their content | fixed pixel widths, draggable |
| Selecting | whole rows, with checkboxes | cell ranges, like a spreadsheet |
| Clipboard | the browser's own text selection | copies/pastes as TSV to Excel |
| Also has | paging, loading state, footer row | inline editing, dirty-row marks |

The short version: if the user **types into it**, use `DataGrid`; if they
**read it and click through**, use `ViewTable`. They share one thing —
`shared/sortRows` — and nothing else, so two tables on one screen can't disagree
about where blank cells sort.

## `ViewTable` props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `columns` | `readonly TableColumn[]` | — | |
| `rows` | `readonly TableRow[]` | — | rendered as given — slice yourself for paging |
| `caption` | `string` | — | **required**; names the table for AT, shown above it |
| `isCaptionHidden` | `boolean` | | hides the caption visually |
| `hasRowCount` | `boolean` | | appends the count — "Items (24)" |
| `getRowId` | `(row, index) => string` | position | React key + selection id |
| `sort` | `TableSort \| null` | | **controlled** sort — supplying it means *you* order the rows |
| `onSortChange` | `(sort) => void` | | |
| `defaultSort` | `TableSort \| null` | `null` | starting sort when uncontrolled |
| `isSortDisabled` | `boolean` | | headers become plain text |
| `selectionMode` | `TableSelectionMode` | `'none'` | `'none' \| 'single' \| 'multiple'` |
| `selectedRowIds` | `readonly string[]` | | controlled selection, by id |
| `onSelectionChange` | `(rowIds: string[]) => void` | | |
| `getRowLabel` | `(row, index) => string` | | the checkbox's accessible name — strongly recommended once selection is on |
| `onRowClick` | `(row, rowId) => void` | | a pointer convenience, **not** the keyboard path (put a link in a cell for that) |
| `density` | `TableDensity` | `'cozy'` | `'cozy' \| 'compact'` |
| `hasZebraStripes` | `boolean` | `true` | alternating row fills |
| `maxHeight` | `string` | | caps height and scrolls, header stays put |
| `footerRow` | `TableFooterRow` | | a summary row along the bottom |
| `isLoading` | `boolean` | | shows placeholder skeleton rows |
| `emptyText` | `string` | `'No data'` | shown when there are no rows |
| `className` | `string` | | |

`onRowClick` is a mouse shortcut, not the accessible route — a `<tr>` isn't
focusable, and making every row a tab stop would flood the tab order. The
keyboard path is a real control inside a cell, via a column's `render` (a link).
With that link present, `onRowClick` is pure convenience; without it, the table
is mouse-only.

## `TableColumn`

| Field | Type | Notes |
| --- | --- | --- |
| `key` | `string` | key into the row object |
| `header` | `string` | column heading |
| `width` | `string` | any **CSS length** (`"8rem"`, `"20%"`); usually leave off — columns size to content |
| `type` | `'text' \| 'number'` | decides default alignment, nothing else |
| `align` | `TableCellAlign` | `'start' \| 'center' \| 'end'` |
| `isSortable` | `boolean` | everything is sortable by default |
| `isNoWrap` | `boolean` | keeps the column one line (codes, dates, amounts) |
| `hideBelow` | `'sm' \| 'md'` | hides the column below a breakpoint |
| `format` | `(value, row) => string` | value → cell text; also what a screen reader reads |
| `render` | `(row) => ReactNode` | the escape hatch — a badge, a link, an action. Overrides `format` |
| `sortValue` | `(row) => unknown` | the value to sort on, for derived/rendered columns |
| `compare` | `CellComparator` | override the sort, e.g. by workflow stage not alphabetically |

`render` is presentation only — sorting still reads the underlying value (or
`sortValue`), so a column shown as a badge sorts by what the badge *means*.

## Types

- `TableRow = Record<string, unknown>`
- `TableSort = SortState` (from `shared/sortRows`)
- `TableSelectionMode = 'none' | 'single' | 'multiple'`
- `TableDensity = 'cozy' | 'compact'`
- `TableFooterRow = Record<string, ReactNode>` — keyed by column; the caller
  computes it (the table won't guess which columns are additive)

## Paging is composed, not built in

`ViewTable` renders the rows it's given and has no idea whether they're a page of
something larger. `useTablePagination` and `<TablePagination>` wrap around it:

```tsx
const pager = useTablePagination({ totalRows: orders.length, pageSize: 20 })

<ViewTable caption="Orders" columns={COLUMNS} rows={pager.slice(orders)} />
<TablePagination {...pager} rowNoun="orders" />
```

This is what lets one table serve a 12-row list with no pager, a 500-row list
paged in the browser, and a 50,000-row list paged on a server — none of which the
table has to know about. For the server case, pass the server's total, skip
`slice`, and let `page` drive the next request.

### `useTablePagination(options): TablePaginationApi`

Options: `{ totalRows, pageSize?=20, page?, onPageChange?, defaultPage?=1 }`.

Returns:

| Field | Type | Notes |
| --- | --- | --- |
| `page` | `number` | current page, 1-based, always inside the real range |
| `pageSize` | `number` | |
| `pageCount` | `number` | at least 1 |
| `range` | `PageRange` | `{ first, last, total }` for the "21–40 of 137" readout |
| `hasPages` | `boolean` | false when everything fits on one page |
| `goToPage` / `goToPreviousPage` / `goToNextPage` | `(page?) => void` | |
| `slice` | `<T>(rows: readonly T[]) => T[]` | the rows for the current page |

The page is clamped on the way out, so if a filter shrinks the list under the
current page, the user lands on the last page with rows rather than a blank
table.

### `<TablePagination {...pager} rowNoun?>`

Spreadable straight from the hook. It renders **Previous / Next only** — no
numbered page buttons, because people refine a filter rather than navigate to
page 23 of a report. It renders `null` when `hasPages` is false. The "21–40 of
137" readout is an `aria-live` region, built as one text node, so stepping is
announced as one sentence.

## Hooks and building blocks (barrel exports)

Besides the components, the barrel exports the hooks — `useTablePagination`,
`useTableSelection`, `useTableSort` (each controllable) — and the pure `core/`
layer for building a table this folder doesn't have:

- `clampPage`, `pageCount`, `pageRange`, `pageSlice` (+ type `PageRange`) — the
  1-based page arithmetic
- `formatCellText`, `resolveCellAlign`, `resolveSortValue`
- the types listed above

Sorting itself is not here — it's `shared/sortRows`. See [shared.md](./shared.md).
