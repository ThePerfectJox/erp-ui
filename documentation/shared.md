# Shared

## What it is

Small helpers used by more than one module, exported for your own code too:

| Export | What it does |
| --- | --- |
| `classNames` | Joins class names, skipping falsy values. |
| `computeOrder`, `compareCellValues`, `cycleSort` | The sorting used by both `ViewTable` and `DataGrid`. |
| `useOutsidePointerDown` | Runs a callback when the user presses outside an element. |

Types: `SortState`, `SortDirection`, `CellComparator`.

```ts
import { classNames, computeOrder, compareCellValues, cycleSort, useOutsidePointerDown } from './erp-ui-components/shared'
import type { CellComparator, SortDirection, SortState } from './erp-ui-components/shared'
```

There's nothing to customize here; these are plain functions.

## `classNames(...values)`

```ts
classNames(...values: (string | false | null | undefined)[]): string
```

```tsx
<div className={classNames('order-row', isSelected && 'order-row-selected', className)} />
// "order-row order-row-selected my-class"
```

## Sorting

Use these to sort your own lists exactly the way the tables do.

```ts
type SortDirection = 'asc' | 'desc'
interface SortState { columnKey: string; direction: SortDirection }
type CellComparator = (left: unknown, right: unknown) => number
```

### `computeOrder(rows, getValue, direction, compare?)`

```ts
computeOrder<TRow>(
  rows: readonly TRow[],
  getValue: (row: TRow) => unknown,
  direction: SortDirection,
  compare: CellComparator = compareCellValues
): number[]
```

Returns the row indices in sorted order. The rows themselves aren't moved.

```ts
const order = computeOrder(orders, row => row.deliveryDate, 'desc')
const sorted = order.map(index => orders[index])
```

It guarantees two things:

- Empty values (`null`, `undefined`, `''`, `NaN`, invalid dates) always go to
  the bottom, in both directions.
- The sort is stable: equal values keep their original order.

### `compareCellValues(left, right)`

The default comparison:

- numbers numerically, dates by time, booleans false before true,
- strings with natural number ordering, case-insensitive (`"item 2"` before
  `"item 10"`), using the browser's locale,
- values of different types by type: number, boolean, date, string, other.

Wrap it for custom sort rules:

```ts
const STAGE: Record<string, number> = { draft: 1, released: 2, closed: 3 }

const byStage: CellComparator = (left, right) =>
  compareCellValues(STAGE[String(left)], STAGE[String(right)])
```

Pass it as a column's `compare` in `ViewTable` or `DataGrid`.

### `cycleSort(current, columnKey)`

```ts
cycleSort(current: SortState | null, columnKey: string): SortState | null
```

The next sort state when a header is clicked: ascending, then descending,
then `null` (original order). Clicking a different column starts at
ascending.

```tsx
const [sort, setSort] = useState<SortState | null>(null)
<button onClick={() => setSort(current => cycleSort(current, 'supplier'))}>Supplier</button>
```

## `useOutsidePointerDown(ref, onOutside, isEnabled?)`

```ts
useOutsidePointerDown(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  isEnabled = true
): void
```

Calls `onOutside` when a pointer press lands outside `ref`'s element. It
listens to `pointerdown` in the capture phase, so it still fires when other
code calls `stopPropagation`. Pass `isEnabled={false}` to remove the listener
while it isn't needed.

Wrap `onOutside` in `useCallback`, or the listener is re-added on every
render.

```tsx
const panelRef = useRef<HTMLDivElement>(null)
const close = useCallback(() => setIsOpen(false), [])

useOutsidePointerDown(panelRef, close, isOpen)

return isOpen ? <div ref={panelRef} className="filter-panel">…</div> : null
```
