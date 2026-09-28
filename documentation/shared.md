# `shared/` — cross-module primitives

Things with no single component family, used by more than one module. The bar
for living here is **two real callers in different folders**. Anything with one
caller belongs next to that caller.

That is the distinction from a module's own `core/`: `sheet/core` grid geometry
is meaningless without a grid, `chart/core` scales are meaningless without a
chart — so each stays next to the thing it serves. `shared/` is for the genuinely
family-less primitive.

No CSS and no components here. Cross-module *styles* live in `../styles`.

## Barrel exports

```ts
export { classNames } from './classNames'
export { compareCellValues, computeOrder, cycleSort } from './sortRows'
export type { CellComparator, SortDirection, SortState } from './sortRows'
export { useOutsidePointerDown } from './useOutsidePointerDown'
```

## `classNames(...values)`

Joins class names, dropping anything falsy.

```ts
classNames('form-field', `form-field-${variant}`, isDisabled && 'form-field-disabled', className)
```

Signature: `(...values: (string | false | null | undefined)[]) => string`.

Falsy (not only `undefined`) is accepted so `flag && 'name'` works directly —
that is the shape a conditional class arrives in. `false` and `null` are in the
signature because `flag && '…'` gives `false` and `map`/`find` results give
`null`, and neither should need a cast at the call site. Around ten components
use it.

## `sortRows` — the shared sort comparator

The one piece of logic `ViewTable` and `DataGrid` share. It started in
`sheet/core` while the grid was the only thing that sorted, and moved here the
day `ViewTable` needed the same comparator. One copy is what stops two tables on
one screen disagreeing about where blank cells sort.

Everything here produces an **order** — an array of source-row indices in
display position. The rows themselves are never moved. That is deliberate: a
document's item order is data, so sorting is a way of *looking* at a table, not
an edit to it.

### Types

```ts
type SortDirection = 'asc' | 'desc'
interface SortState { columnKey: string; direction: SortDirection }
type CellComparator = (left: unknown, right: unknown) => number
```

### `compareCellValues(left, right): number`

The default comparison: numbers numerically, dates chronologically, strings
through a numeric `Intl.Collator` (so `"item 2"` sorts before `"item 10"`), and
differing types by a fixed type rank so the result is still deterministic. The
collator is built once and reused.

### `computeOrder(rows, getValue, direction, compare?): number[]`

Computes the display order for a set of rows.

| Param | Type | Notes |
| --- | --- | --- |
| `rows` | `readonly TRow[]` | the rows to order |
| `getValue` | `(row: TRow) => unknown` | pulls the sort value — an **accessor**, not a key, so a derived column can be sorted |
| `direction` | `SortDirection` | |
| `compare` | `CellComparator` | optional; defaults to `compareCellValues` |

Two properties it guarantees:

- **Empty cells sink to the bottom in both directions.** They are grouped before
  direction is applied, so flipping to descending does not float a block of
  blanks over the largest values — what a spreadsheet does.
- **The sort is stable.** Rows with equal values keep their document sequence.

### `cycleSort(current, columnKey): SortState | null`

The next state when a header is clicked: ascending → descending → back to the
document's own order (`null`). Three states rather than a toggle because the
unsorted order is real information in a business document — once a user has
sorted an item table, there has to be a way back to item sequence.

## `useOutsidePointerDown(ref, onOutside, isEnabled?)`

Fires `onOutside` on a press that landed outside `ref`'s element. `DataGrid` uses
it to clear the selection when the user presses elsewhere on the screen.

| Param | Type | Notes |
| --- | --- | --- |
| `ref` | `RefObject<HTMLElement \| null>` | presses inside this are "inside" |
| `onOutside` | `() => void` | must be stable — wrap in `useCallback`, or the listener rebuilds every render |
| `isEnabled` | `boolean` | defaults `true`; skips the listener entirely when false |

Two deliberate choices: it listens on `pointerdown`, not `click` (the selection
should go the moment the user presses elsewhere, and a drag starting outside and
ending inside would never fire `click`); and it listens in the **capture phase**,
so a handler that calls `stopPropagation` — a menu, a modal backdrop — cannot
stop the host from hearing about the press.
