# Table

## What it is

`ViewTable` is a read-only table for lists and reports: purchase orders, goods
receipts, search results. Users read it, sort it, tick rows and click through
to a detail screen.

- Columns size to their content.
- Cells can hold anything: text, a status badge, a link, a button.
- Sorting, row selection (single or multiple), a footer row, a loading state
  and an empty state are built in.
- Paging is a separate hook + component (`useTablePagination`,
  `TablePagination`) so the same table works for client-side and server-side
  paging.

```tsx
import { ViewTable, TablePagination, useTablePagination } from './erp-ui-components/table'
import type { TableColumn, TableRow, TableSort } from './erp-ui-components/table'
```

### `ViewTable` or `DataGrid`?

| | `ViewTable` | [`DataGrid`](./sheet.md) |
| --- | --- | --- |
| For | reading | editing |
| Cell content | anything | text |
| Columns | size to content | fixed pixel widths, draggable |
| Selecting | whole rows, with checkboxes | cell ranges, like a spreadsheet |
| Clipboard | normal text selection | copy/paste as cells to and from Excel |
| Also has | paging, loading state, footer row | inline editing, changed-row marks |

If users type into it, use `DataGrid`. If they read it, use `ViewTable`.

## How to use it

### A basic table

Define columns once (outside the component, or in `useMemo`) and pass rows.

```tsx
const COLUMNS: TableColumn[] = [
  { key: 'documentNumber', header: 'Order', isNoWrap: true },
  { key: 'supplier', header: 'Supplier' },
  { key: 'deliveryDate', header: 'Delivery', isNoWrap: true, hideBelow: 'sm' },
  {
    key: 'netValue', header: 'Net value', type: 'number', isNoWrap: true,
    format: value => EURO.format(Number(value)),
  },
]

<ViewTable
  caption="Purchase orders"
  hasRowCount
  columns={COLUMNS}
  rows={orders}
  getRowId={row => String(row.documentNumber)}
  defaultSort={{ columnKey: 'documentNumber', direction: 'desc' }}
/>
```

Rows are plain objects (`Record<string, unknown>`). A column reads
`row[column.key]`.

Always pass `getRowId` when you use selection or the rows can change.
Without it, rows are identified by position, so sorting moves ticks onto other
rows.

### Custom cells: badges, links, actions

`render` returns any React content. Sorting still uses the underlying value
(or `sortValue`), not the rendered output.

```tsx
const STAGE = { open: 1, posted: 2, reversed: 3 }

const COLUMNS: TableColumn[] = [
  {
    key: 'documentNumber', header: 'Receipt',
    render: row => <a href={`/receipts/${row.documentNumber}`}>{String(row.documentNumber)}</a>,
  },
  {
    key: 'status', header: 'Status',
    render: row => <StatusBadge status={String(row.status)} />,
    // sort by workflow stage, not alphabetically
    sortValue: row => STAGE[row.status as keyof typeof STAGE],
  },
  {
    key: 'total', header: 'Net value', type: 'number',
    // derived column: nothing is stored under 'total', so it needs sortValue
    format: (_value, row) => (Number(row.quantity) * Number(row.price)).toFixed(2),
    sortValue: row => Number(row.quantity) * Number(row.price),
  },
]
```

Prefer `format` over `render` when the cell is just formatted text. `format`
output is also what screen readers read.

### Clicking rows

`onRowClick` gives rows a pointer cursor and hover highlight. It's a mouse
shortcut only, because table rows can't be focused. Always also put a real
link or button in a cell (with `render`) so keyboard users can open the row.

```tsx
<ViewTable … onRowClick={(row, rowId) => navigate(`/orders/${rowId}`)} />
```

### Selecting rows

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([])

<ViewTable
  caption="Goods receipts"
  columns={COLUMNS}
  rows={receipts}
  getRowId={row => String(row.documentNumber)}
  selectionMode="multiple"
  selectedRowIds={selectedIds}
  onSelectionChange={setSelectedIds}
  getRowLabel={row => `receipt ${row.documentNumber}`}
/>
```

- `'multiple'` adds checkboxes and a select-all checkbox in the header.
  Select-all only affects the rows currently shown. When some rows are ticked,
  it clears them.
- `'single'` adds radio buttons. Clicking the selected row's radio again
  clears it.
- `getRowLabel` names each checkbox for screen readers ("Select receipt
  5000012"). Without it they're read as "Select row 4".

You can leave out `selectedRowIds` and only listen to `onSelectionChange`.

### Sorting

Clicking a header cycles ascending → descending → original order. Every column
is sortable unless it sets `isSortable: false`, or the table sets
`isSortDisabled`.

- Uncontrolled: `defaultSort={{ columnKey: 'date', direction: 'desc' }}`.
- Controlled (server-side sorting): pass `sort` + `onSortChange`. The table
  then doesn't reorder rows itself; it only shows the arrow. You fetch rows in
  the new order.

```tsx
const [sort, setSort] = useState<TableSort | null>(null)
const rows = useOrders({ sort })   // your server call

<ViewTable … rows={rows} sort={sort} onSortChange={setSort} />
```

Blank values always sort to the bottom, in both directions. Strings sort
naturally ("item 2" before "item 10").

### Footer row, loading and empty states

```tsx
<ViewTable
  …
  footerRow={{ supplier: 'Total', netValue: EURO.format(total) }}
  isLoading={isFetching}
  emptyText="No orders match the current filter."
/>
```

- `footerRow` is keyed by column key. You compute the values; the table
  doesn't add up columns. It's hidden while loading or empty.
- `isLoading` shows 5 placeholder rows.
- `emptyText` is shown when `rows` is empty.

### Paging

`ViewTable` shows the rows it receives. To page, use `useTablePagination` and
put `<TablePagination>` under the table.

Client-side paging:

```tsx
const pager = useTablePagination({ totalRows: orders.length, pageSize: 20 })

<ViewTable caption="Orders" columns={COLUMNS} rows={pager.slice(orders)} />
<TablePagination {...pager} rowNoun="orders" />
```

Server-side paging: pass the server's total, skip `slice`, and fetch with
`page`:

```tsx
const [page, setPage] = useState(1)
const { rows, total } = useOrderPage({ page, pageSize: 50 })   // your server call
const pager = useTablePagination({ totalRows: total, pageSize: 50, page, onPageChange: setPage })

<ViewTable caption="Orders" columns={COLUMNS} rows={rows} />
<TablePagination {...pager} rowNoun="orders" />
```

If the list shrinks under the current page (after filtering), the page is
clamped to the last page that has rows.

`TablePagination` shows "21–40 of 137 orders", Previous/Next and "Page 2 of 7".
It renders nothing when everything fits on one page. There are no numbered
page buttons. Note that `hasRowCount` on the table counts the rows passed in,
which with paging is the page, not the total.

## API reference

### `ViewTable` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `readonly TableColumn[]` | | Required. |
| `rows` | `readonly TableRow[]` | | Required. Shown as given. |
| `caption` | `string` | | Required. Shown above the table and used as its accessible name. |
| `isCaptionHidden` | `boolean` | | Hides the caption visually. |
| `hasRowCount` | `boolean` | | Appends "(24)" to the caption. |
| `getRowId` | `(row, index) => string` | position | Stable id for React keys and selection. |
| `sort` | `TableSort \| null` | | Controlled sort. You order the rows. |
| `onSortChange` | `(sort: TableSort \| null) => void` | | |
| `defaultSort` | `TableSort \| null` | `null` | Starting sort when uncontrolled. |
| `isSortDisabled` | `boolean` | | Turns sorting off for all columns. |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | |
| `selectedRowIds` | `readonly string[]` | | Controlled selection. |
| `onSelectionChange` | `(rowIds: string[]) => void` | | |
| `getRowLabel` | `(row, index) => string` | | Accessible name for each row's checkbox. |
| `onRowClick` | `(row, rowId) => void` | | Mouse shortcut; see above. |
| `density` | `'cozy' \| 'compact'` | `'cozy'` | `'compact'` reduces vertical cell padding. |
| `hasZebraStripes` | `boolean` | `true` | Alternating row backgrounds. |
| `maxHeight` | `string` | | Any CSS length. The table scrolls inside it; the header and footer stay visible. |
| `footerRow` | `TableFooterRow` | | Summary row. |
| `isLoading` | `boolean` | | Shows placeholder rows. |
| `emptyText` | `string` | `'No data'` | |
| `className` | `string` | | Added to the outer `.table-frame`. |

`TableSort` is `{ columnKey: string; direction: 'asc' | 'desc' }`.

### `TableColumn`

| Field | Type | Description |
| --- | --- | --- |
| `key` | `string` | Required. Key into the row object. |
| `header` | `string` | Required. Column heading. |
| `width` | `string` | Any CSS length (`'8rem'`, `'20%'`). Usually leave it off. |
| `type` | `'text' \| 'number'` | Default `'text'`. Numbers are right-aligned. |
| `align` | `'start' \| 'center' \| 'end'` | Overrides the alignment from `type`. |
| `isSortable` | `boolean` | Set `false` to block sorting this column. |
| `isNoWrap` | `boolean` | Keeps the column on one line (codes, dates, amounts). |
| `hideBelow` | `'sm' \| 'md'` | Hides the column below 600px (`sm`) or 900px (`md`). |
| `format` | `(value, row) => string` | Value to display text. |
| `render` | `(row) => ReactNode` | Any content. Overrides `format`. |
| `sortValue` | `(row) => unknown` | Value to sort on, for derived or rendered columns. |
| `compare` | `(left, right) => number` | Custom comparison of two sort values. |

### `TableFooterRow`

`Record<string, ReactNode>`, keyed by column key. Missing keys are blank.

### `useTablePagination(options)`

| Option | Type | Default |
| --- | --- | --- |
| `totalRows` | `number` | required |
| `pageSize` | `number` | `20` |
| `page` | `number` | controlled page (1-based) |
| `onPageChange` | `(page: number) => void` | |
| `defaultPage` | `number` | `1` |

Returns:

| Field | Type | Description |
| --- | --- | --- |
| `page` | `number` | Current page, 1-based, always in range. |
| `pageSize` | `number` | |
| `pageCount` | `number` | At least 1. |
| `range` | `{ first, last, total }` | For "21–40 of 137". All 0 when empty. |
| `hasPages` | `boolean` | `false` when everything fits on one page. |
| `goToPage` | `(page: number) => void` | Clamped. |
| `goToPreviousPage`, `goToNextPage` | `() => void` | |
| `slice` | `(rows) => rows` | The current page's rows. |

### `TablePagination` props

Spread the hook result (`{...pager}`). It uses `page`, `pageCount`, `range`,
`hasPages`, `goToPreviousPage`, `goToNextPage`, plus:

| Prop | Type | Description |
| --- | --- | --- |
| `rowNoun` | `string` | Plural noun for the readout ("orders"). Also names the pager landmark. |

## How to customize

### With props

`density`, `hasZebraStripes`, `maxHeight`, column `width`, `align`,
`isNoWrap`, `hideBelow`, `emptyText`, `getRowLabel`, `rowNoun`.

### With tokens

The table has no table-specific variables. It reads the global tokens, so set
them on a wrapper or through `className`:

| Token | Used for |
| --- | --- |
| `--color-surface` | table background |
| `--color-surface-alt` | zebra stripe |
| `--color-surface-sunken` | header and footer background |
| `--color-primary-soft` | selected row, sorted column header |
| `--color-primary-active` | sorted header text |
| `--color-primary` | sort arrow, checkbox colour |
| `--color-chrome-hover` | row hover (clickable rows), header hover |
| `--color-border`, `--color-border-strong` | row lines, header line, frame |
| `--space-2`, `--space-3` | cell padding |

```css
.receipts-table {
  --color-surface-alt: #fafbfc;        /* lighter stripes */
  --color-primary-soft: #fff8d6;       /* yellow selection */
}
```

```tsx
<ViewTable className="receipts-table" … />
```

### With CSS classes

```text
div.table-frame                      ← className
  p.table-caption
    span.table-caption-count
  div.table-scroll                   scroll container (maxHeight)
    table.table.table-density-cozy.table-zebra.table-clickable-rows
      thead.table-head
        th.table-select-cell
        th.table-header[aria-sort]
          button.table-sort-button
            span.table-header-label
            span.table-sort-arrow.table-sort-arrow-asc
      tbody
        tr.table-row.table-row-selected
          td.table-select-cell > input.table-select-control
          td.table-cell.table-nowrap.table-hide-below-sm
      tfoot.table-foot
    p.table-empty
nav.table-pagination                 TablePagination
  p.table-pagination-range
  div.table-pagination-controls
    button.table-pagination-button
    span.table-pagination-page
```

| Class / selector | Element |
| --- | --- |
| `.table-frame` | outer wrapper, gets `className` |
| `.table-caption`, `.table-caption-count` | caption and row count |
| `.table-scroll` | scroll container with the border |
| `.table` | the `<table>`; `.table-density-cozy` / `-compact`, `.table-zebra`, `.table-clickable-rows` |
| `.table-head`, `.table-header`, `.table-header[aria-sort]` | header row, header cells, sorted header |
| `.table-sort-button`, `.table-header-label`, `.table-sort-arrow`, `-asc`, `-desc` | sort controls |
| `.table-row`, `.table-row-selected` | body rows |
| `.table-cell`, `.table-nowrap`, `.table-hide-below-sm`, `.table-hide-below-md` | cells |
| `.table-select-cell`, `.table-select-control` | selection column and its native checkbox/radio |
| `.table-foot` | footer |
| `.table-row-skeleton`, `.table-skeleton-bar` | loading placeholders |
| `.table-empty` | empty message |
| `.table-pagination`, `-range`, `-controls`, `-button`, `-page` | pager |

`TablePagination` has no `className`. Style it with a parent selector.

Examples:

```css
/* Uppercase, smaller headers */
.orders-page .table-header { text-transform: uppercase; font-size: var(--text-xs); }

/* Vertical lines between cells */
.orders-page .table-cell + .table-cell { border-left: 1px solid var(--color-border); }

/* Hide the outer border */
.orders-page .table-scroll { border: none; }
```

Column widths and alignment are inline styles; use the column's `width` and
`align` to change them.

## Hooks and building blocks

`ViewTable` is built from these exports. Use them to build a table with
different markup that sorts, selects and pages the same way.

| Export | Signature | Description |
| --- | --- | --- |
| `useTableSort` | `({ rows, columns, sort?, onSortChange?, defaultSort?, isDisabled? }) => { sort, sortedRows, sortByColumn(column) }` | Sorting state. In controlled mode `sortedRows` is `rows` unchanged. |
| `useTableSelection` | `({ mode, visibleRowIds, selectedRowIds?, onSelectionChange? }) => { selectedIds, isEnabled, isSelected(id), toggleRow(id), isAllSelected, isPartiallySelected, toggleAll() }` | Selection state. |
| `useTablePagination` | see above | Paging state. |
| `pageCount(total, pageSize)` | `number` | At least 1. |
| `clampPage(page, total, pageSize)` | `number` | Keeps a page number in range. |
| `pageSlice(rows, page, pageSize)` | `TRow[]` | The rows on a page. |
| `pageRange(total, page, pageSize)` | `PageRange` | `{ first, last, total }`. |
| `formatCellText(column, row)` | `string` | `format` or `String(value)`; blank for null/undefined. |
| `resolveCellAlign(column)` | `'start' \| 'center' \| 'end'` | `align`, or `'end'` for numbers. |
| `resolveSortValue(column, row)` | `unknown` | `sortValue(row)` or `row[key]`. |

Types: `ViewTableProps`, `TableColumn`, `TableRow`, `TableSort`,
`TableColumnType`, `TableCellAlign`, `TableSelectionMode`, `TableDensity`,
`TableHideBelow`, `TableFooterRow`, `TablePaginationApi`, `TableSelectionApi`,
`TableSortApi`, `PageRange`.

Sorting itself (`computeOrder`, `compareCellValues`, `cycleSort`) is in
[shared](./shared.md).

## Limits

No virtualization (it's meant for up to a few hundred rows per page), no
column resizing or reordering, no grouping, no built-in filtering. Filter the
rows yourself before passing them in.
