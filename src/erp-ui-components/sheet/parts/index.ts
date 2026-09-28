/**
 * The grid's presentational pieces.
 *
 * All five are props-in, markup-out. None of them holds state, reads from a
 * context or decides anything about behaviour — a header cell is told that it is
 * sorted ascending, and has no idea what the next click will do.
 *
 * Kept internal to the sheet folder rather than exported from the package: they
 * are the grid's own anatomy and only make sense inside a `<table role="grid">`.
 * A `<GridCell>` on its own is invalid markup.
 */

export { default as GridCell } from './GridCell'
export { default as GridFillerCell } from './GridFillerCell'
export { default as GridHeaderCell } from './GridHeaderCell'
export { default as GridRowGutterCell } from './GridRowGutterCell'
export { default as ResizeHandle } from './ResizeHandle'
