/**
 * The grid's pure layer: no React, no DOM, no state.
 *
 * Everything in here is a function of its arguments, which is why it is a folder
 * of its own — these are the parts worth testing, and the parts reusable away
 * from a grid on screen (a clipboard export button, a sorted read-only list).
 *
 * - `types` — the data contract shared by every layer above.
 * - `cellValue` — value to cell text and back.
 * - `clipboard` — the TSV and HTML flavours Excel actually reads and writes.
 * - `gridSelection` — selection rectangle geometry.
 * - `gridSizing` — column and row size arithmetic.
 *
 * Sorting is **not** here. It moved to `../../shared/sortRows` once `ViewTable`
 * needed the same comparator, and it is imported from there directly rather than
 * re-exported through this barrel — a barrel that forwards another folder's exports
 * makes it impossible to tell, at the import site, which layer a thing belongs to.
 */

export * from './types'
export * from './cellValue'
export * from './clipboard'
export * from './gridSelection'
export * from './gridSizing'
