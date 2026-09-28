/**
 * Charts.
 *
 * ```tsx
 * import { BarChart, DonutChart, LineChart } from './erp-ui-components/chart'
 * import type { ChartSeries, ChartSlice } from './erp-ui-components/chart'
 * ```
 *
 * Three charts, no dependency. Hand-drawn SVG rather than a charting library,
 * because a library brings a second design system with it — its own colours, type,
 * tooltips and accessibility story — and then every chart on the screen is an
 * argument between the two. These take their palette and their type from the tokens
 * in `index.css` like everything else in this folder.
 *
 * -----------------------------------------------------------------------------
 * Choosing one
 * -----------------------------------------------------------------------------
 * | Question | Chart |
 * | --- | --- |
 * | How do these categories compare? | `BarChart` |
 * | What is the trend over time? | `LineChart` |
 * | What are the parts of this whole? | `DonutChart`, for three to six parts |
 *
 * All three take the same base props — `caption`, `description`, `height`,
 * `formatValue`, `legendPlacement` — so learning one teaches you the others. See
 * `ChartBaseProps` in `core/types.ts`.
 *
 * -----------------------------------------------------------------------------
 * Two things they all do
 * -----------------------------------------------------------------------------
 * **A `null` is a gap, never a zero.** Bars skip it, lines break at it, the data
 * table reads it as an em dash. "No goods receipt yet" and "received none" are
 * different claims and a chart should not merge them.
 *
 * **Every chart renders its data as a real table, visually hidden.** The SVG is
 * `aria-hidden`; what a screen reader gets is a caption, headers and every value, in
 * something navigable. That is a deliberate choice over the usual `role="img"` plus
 * a one-line summary, which satisfies an audit and hands over none of the content.
 *
 * -----------------------------------------------------------------------------
 * Not in here
 * -----------------------------------------------------------------------------
 * No scatter, no combo axes, no zoom or brush, no animation on data change, no
 * stacked-to-100% mode. Each is a real feature rather than a flag. The `core/`
 * folder is exported below precisely so that a chart this folder does not have can
 * be built on the same scales, paths and formatting rather than starting over.
 */

export { default as BarChart } from './BarChart'
export { default as DonutChart } from './DonutChart'
export { default as LineChart } from './LineChart'

export type {
	ChartBaseProps,
	ChartLegendPlacement,
	ChartSeries,
	ChartSlice,
	ChartValue,
	ChartValueFormatter,
} from './core/types'

/* --- Building blocks -----------------------------------------------------
 * The pure layer, for composing a chart this folder does not have — a scatter, a
 * bullet, a sparkline — so it comes out looking like the rest. */
export {
	areaPath,
	bandScale,
	donutSlicePath,
	formatCompact,
	formatFull,
	formatShare,
	labelStride,
	linePath,
	linearScale,
	plotAreaFor,
	polarPoint,
	seriesColor,
	stackTotals,
	stackValues,
	toSegments,
} from './core'

export type { BandScale, LinearScale, PlotArea, PlotPoint, StackSegment } from './core'

export { FALLBACK_CHART_WIDTH, useElementWidth } from './hooks/useElementWidth'
