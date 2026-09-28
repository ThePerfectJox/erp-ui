/**
 * The charts' pure layer: no React, no DOM, no state.
 *
 * - `types` — the data contract shared by all three charts.
 * - `scale` — value-to-pixel scales and round tick selection.
 * - `geometry` — SVG path building, gap handling and stacking.
 * - `format` — number formatting and the palette lookup.
 *
 * Worth reading before the components. Almost every judgement a chart makes — where
 * the axis starts, what counts as a round number, whether a missing value is a zero
 * — lives in here rather than in the rendering.
 */

export * from './format'
export * from './geometry'
export * from './scale'
export * from './types'
