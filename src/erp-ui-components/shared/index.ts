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
 *   Two so far, and the bar for a third is that it already has two real callers in
 *   different folders. Anything with one caller belongs next to that caller.
 *
 * No CSS here and no components. The cross-folder *styles* live in `../styles`,
 * which is a separate concern with a separate loading story.
 */

export { classNames } from './classNames'
export { useOutsidePointerDown } from './useOutsidePointerDown'
