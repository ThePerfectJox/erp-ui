/**
 * The charts' shared pieces.
 *
 * Internal to the folder. They are the anatomy of a chart rather than components in
 * their own right — a `<CartesianPlot>` with nothing drawn on it is an empty set of
 * axes, and a `<ChartTooltip>` outside a positioned plot container lands in the
 * top-left corner of the page.
 *
 * - `ChartFrame` — caption, description, measured plot box, legend slot, data table.
 * - `CartesianPlot` — gridlines and both axes, for the bar and line charts.
 * - `ChartLegend` — the colour key.
 * - `ChartTooltip` — the hover readout.
 * - `ChartDataTable` — the visually-hidden table that makes a chart accessible.
 */

export { default as CartesianPlot } from './CartesianPlot'
export { default as ChartDataTable } from './ChartDataTable'
export { default as ChartFrame } from './ChartFrame'
export { default as ChartLegend } from './ChartLegend'
export type { ChartLegendEntry } from './ChartLegend'
export { default as ChartTooltip } from './ChartTooltip'
export type { ChartTooltipRow } from './ChartTooltip'
