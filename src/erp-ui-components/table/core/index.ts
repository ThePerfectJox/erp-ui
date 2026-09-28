/**
 * The table's pure layer: no React, no DOM, no state.
 *
 * - `types` — the data contract, and the reasoning behind where it differs from the
 *   editable grid's.
 * - `cellText` — value to cell text, alignment, and the value a column sorts on.
 * - `pagination` — page arithmetic, 1-based.
 *
 * Sorting is not here. It is `../../shared/sortRows`, shared with `DataGrid`, because
 * both tables make the same comparison decisions and two copies of a comparator is how
 * two tables on one screen end up disagreeing about where the blank rows go.
 */

export * from './cellText'
export * from './pagination'
export * from './types'
