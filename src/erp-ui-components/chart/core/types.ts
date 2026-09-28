/**
 * The charts' data contract.
 *
 * Series-oriented rather than row-oriented: a chart is given the categories along
 * the axis once, then one object per series holding a value for each of them.
 *
 * ```ts
 * categories = ['Jan', 'Feb', 'Mar']
 * series = [
 *     { key: 'ordered',  label: 'Ordered',  values: [120, 140, 95] },
 *     { key: 'received', label: 'Received', values: [118, 140, null] },
 * ]
 * ```
 *
 * The row-oriented alternative — an array of `{ month, ordered, received }` — reads
 * more naturally coming out of a database, but it puts the *series* in the object
 * keys. Then a legend has to be built from those keys, a colour has nowhere to
 * live, and a series cannot carry a label with a space in it. Reshaping once at the
 * call site is a `map`; working around that shape is every feature afterwards.
 */

/**
 * One value in a series. `null` is a **gap**, not a zero.
 *
 * The distinction is the whole reason this is not just `number`. A month with no
 * goods receipts yet has no value; drawing it as zero states that nothing was
 * received, which is a different and wrong claim. Bars skip gaps, lines break at
 * them, and the accessible table reads them as blank.
 */
export type ChartValue = number | null

export interface ChartSeries {
	/** Stable identity. Used as the React key and in the legend. */
	key: string

	/** What the legend and the tooltip call it. */
	label: string

	/**
	 * One entry per category, in the same order.
	 *
	 * A series shorter than `categories` is treated as gaps at the end rather than
	 * as an error, so a part-way-through-the-year actuals series can be handed in
	 * as-is next to a full-year plan.
	 */
	values: readonly ChartValue[]

	/**
	 * Overrides the palette colour.
	 *
	 * Reach for it when the colour *means* something — red for a budget overrun,
	 * green for actuals against a grey plan. Leave it alone for ordinary
	 * categories and let the palette keep the chart consistent with every other
	 * chart in the app.
	 */
	color?: string
}

/** One wedge of a donut. Part-to-whole data has no category axis, so it is flat. */
export interface ChartSlice {
	key: string
	label: string

	/**
	 * Must not be negative — a negative share of a whole has no meaning, and the
	 * arc maths would wrap it round the circle. Negative values are dropped rather
	 * than drawn wrong.
	 */
	value: number

	color?: string
}

/**
 * Formats a value for the axis, the tooltip and the accessible table.
 *
 * One function for all three so they cannot disagree. A tooltip reading `18.4`
 * beside an axis reading `18` is how someone ends up reconciling two numbers that
 * were always the same.
 */
export type ChartValueFormatter = (value: number) => string

/** Where the legend goes, or `"none"` to leave it out. */
export type ChartLegendPlacement = 'top' | 'bottom' | 'none'

/**
 * Props every chart in this folder takes.
 *
 * Kept as one interface so the three charts cannot drift apart — the same reason
 * `FieldBaseProps` exists for the form controls.
 */
export interface ChartBaseProps {
	/**
	 * Names the chart, and is shown above it. Required, like `DataGrid`'s.
	 *
	 * An SVG is a wall of `<path>` elements to a screen reader. Every chart here
	 * renders its data as a real table for that reason, and this is the table's
	 * caption — without it the table is a grid of numbers with no subject.
	 */
	caption: string

	/** Hides the caption visually. It stays available to assistive technology. */
	isCaptionHidden?: boolean

	/**
	 * A line under the caption. For the reading the chart is meant to support —
	 * "Ordered against received, current year" — rather than a description of the
	 * chart's own appearance.
	 */
	description?: string

	/** Plot height in pixels, excluding the caption and legend. Defaults per chart. */
	height?: number

	/** Defaults to `"bottom"`. */
	legendPlacement?: ChartLegendPlacement

	/**
	 * How numbers are written. Defaults to a compact form — `1.2k`, `3.4m` — on
	 * the axis and the full number everywhere else.
	 *
	 * Pass one to add a unit or fix the decimals:
	 *
	 * ```tsx
	 * formatValue={value => `€${value.toFixed(2)}`}
	 * ```
	 */
	formatValue?: ChartValueFormatter

	className?: string
}
