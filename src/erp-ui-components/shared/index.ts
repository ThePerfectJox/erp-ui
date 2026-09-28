/**
 * Primitives shared across component folders.
 *
 * The distinction from a folder's own `core/` is worth being strict about, because
 * it is the difference between a shared utility and a dumping ground:
 *
 * - **`form/core`, `sheet/core`, `chart/core`** — pure logic that belongs to *one*
 *   component family. Grid selection geometry is meaningless without a grid; chart
 *   scales are meaningless without a chart. Each stays next to the thing it serves.
 * - **`shared/`** — things with no component family at all, used by more than one.
 *   The bar is two real callers in different folders. Anything with one caller
 *   belongs next to that caller.
 *
 * `sortRows` is the rule working as intended: it lived in `sheet/core` while the
 * editable grid was the only thing that sorted, and moved here the day `ViewTable`
 * needed the same comparator. Two copies of a comparator is how two tables on one
 * screen end up disagreeing about where the blank rows go.
 *
 * No CSS here and no components. The cross-folder *styles* live in `../styles`,
 * which is a separate concern with a separate loading story.
 */

export { classNames } from './classNames'

export { compareCellValues, computeOrder, cycleSort } from './sortRows'
export type { CellComparator, SortDirection, SortState } from './sortRows'

export { useOutsidePointerDown } from './useOutsidePointerDown'
