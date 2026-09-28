/**
 * Scales: turning data values into pixel positions.
 *
 * Two kinds, which is all a business chart needs.
 *
 * - A **linear** scale for the value axis, with round tick values.
 * - A **band** scale for the category axis, which divides the width into one slot
 *   per category.
 *
 * All pure, so the fiddly parts — choosing ticks a human would have chosen,
 * deciding whether to include zero — can be reasoned about and checked without
 * rendering anything.
 */

/** A rectangle of pixels the marks are drawn inside. */
export interface PlotArea {
	left: number
	top: number
	width: number
	height: number
}

export interface LinearScale {
	/** Bottom of the value range. Usually zero. */
	min: number

	/** Top of the value range, rounded up to a tick. */
	max: number

	/** Round values to label and draw gridlines at, ascending. */
	ticks: readonly number[]

	/**
	 * The y pixel for a value, measured from the top of the plot.
	 *
	 * Inverted, because SVG's y axis grows downwards and a chart's grows upwards.
	 * Doing that here once is why no caller has to remember it.
	 */
	positionOf: (value: number) => number

	/** Pixel height of a bar spanning from `min` to `value`. Never negative. */
	lengthOf: (value: number) => number
}

export interface BandScale {
	/** Pixels per category, including the gap. */
	step: number

	/** Pixels of drawable width within a slot, after the gap. */
	bandWidth: number

	/** Left pixel of a category's band. */
	startOf: (index: number) => number

	/** Centre pixel of a category's band. Where a line's point or a label sits. */
	centreOf: (index: number) => number

	/**
	 * Which category a pixel falls in, clamped to the ends.
	 *
	 * The inverse of `centreOf`, and what makes hover work on a line chart: the
	 * pointer is somewhere in the plot, and the chart needs the nearest category
	 * without hit-testing every point.
	 */
	indexAt: (x: number) => number
}

/**
 * The 1-2-5 sequence, which is what people count in.
 *
 * Any step is a member of this set scaled by a power of ten: 1, 2, 5, 10, 20, 50,
 * 100… The result is an axis labelled 0, 25, 50, 75, 100 rather than 0, 23.4,
 * 46.8 — a chart nobody can read a value off.
 */
const NICE_STEPS = [1, 2, 2.5, 5, 10]

/**
 * A round step that divides `span` into roughly `targetCount` intervals.
 *
 * Rounds the raw step *up* to the next nice one rather than to the nearest, so the
 * tick count never exceeds what was asked for. An axis with more labels than it has
 * room for is worse than one with fewer.
 */
function niceStep(span: number, targetCount: number): number {
	if (span <= 0 || targetCount <= 0) {
		return 1
	}

	const rough = span / targetCount

	/* The power of ten at or below the rough step. Dividing by it leaves a number
	 * in [1, 10), which is the range NICE_STEPS covers. */
	const magnitude = 10 ** Math.floor(Math.log10(rough))
	const normalised = rough / magnitude

	const step = NICE_STEPS.find(candidate => candidate >= normalised) ?? 10

	return step * magnitude
}

interface LinearScaleOptions {
	/** Every value to be plotted. Gaps should already be filtered out. */
	values: readonly number[]

	/** Pixel height of the plot. */
	height: number

	/** Roughly how many gridlines to aim for. Defaults to 5. */
	tickCount?: number

	/**
	 * Whether the axis must reach zero. Defaults to true.
	 *
	 * True is right for bars, and not negotiable there: a bar's *length* is its
	 * value, so an axis starting at 90 makes 100 look ten times 91. That is the
	 * single most effective way to mislead with a chart, and it is usually an
	 * accident.
	 *
	 * False is defensible for a line chart of something that never goes near zero —
	 * an exchange rate, a temperature — where a line's *slope* carries the meaning
	 * and a zero baseline flattens it into a straight line. Charts here pass false
	 * only when asked to.
	 */
	isZeroBased?: boolean
}

/**
 * Builds a linear scale with round ticks.
 *
 * The domain is widened outwards to land on ticks, never narrowed — so no data
 * point is ever clipped by the axis it is drawn against.
 */
export function linearScale({
	values,
	height,
	tickCount = 5,
	isZeroBased = true,
}: LinearScaleOptions): LinearScale {
	const present = values.filter(value => Number.isFinite(value))

	/* An empty or all-gap series still has to produce a usable axis, or the chart
	 * renders as a blank box with no gridlines and looks broken rather than
	 * empty. 0..1 is the smallest honest one. */
	const rawMin = present.length > 0 ? Math.min(...present) : 0
	const rawMax = present.length > 0 ? Math.max(...present) : 1

	let low = isZeroBased ? Math.min(0, rawMin) : rawMin
	let high = isZeroBased ? Math.max(0, rawMax) : rawMax

	/* A flat series — every value the same — has a span of zero, which would make
	 * the step zero and the tick loop run forever. Opened out to put the line
	 * somewhere sensible rather than along an edge. */
	if (low === high) {
		if (low === 0) {
			high = 1
		} else {
			const padding = Math.abs(low) * 0.5

			low -= isZeroBased && low >= 0 ? 0 : padding
			high += padding
		}
	}

	const step = niceStep(high - low, tickCount)

	/* Snapped outwards onto the step grid, so the first and last gridline are round
	 * numbers and the data sits comfortably inside them. */
	const min = Math.floor(low / step) * step
	const max = Math.ceil(high / step) * step

	const ticks: number[] = []

	/* A half-step of slack on the loop bound: `min + n * step` accumulates binary
	 * float error, so a final tick that should land exactly on `max` can come out a
	 * whisker above it and be dropped. */
	for (let tick = min; tick <= max + step / 2; tick += step) {
		/* Re-rounded to the step's own precision. Otherwise 0.1 + 0.2 shows up on
		 * the axis as 0.30000000000000004. */
		ticks.push(Number((Math.round(tick / step) * step).toPrecision(12)))
	}

	const span = max - min || 1

	return {
		min,
		max,
		ticks,
		positionOf: value => height - ((value - min) / span) * height,
		lengthOf: value => Math.max(0, (Math.abs(value - Math.max(min, 0)) / span) * height),
	}
}

interface BandScaleOptions {
	count: number

	/** Pixel width of the plot. */
	width: number

	/**
	 * Share of each slot left as a gap, 0 to 1. Defaults to 0.25.
	 *
	 * Bars want a gap so they read as separate quantities. A line chart passes 0 —
	 * its points sit at slot centres and there is nothing for a gap to separate.
	 */
	padding?: number
}

/** Divides a width into one slot per category. */
export function bandScale({ count, width, padding = 0.25 }: BandScaleOptions): BandScale {
	const safeCount = Math.max(1, count)
	const step = width / safeCount
	const bandWidth = step * (1 - Math.min(0.9, Math.max(0, padding)))

	/* Half the gap, so each band is centred in its slot and the outermost bars are
	 * inset from the axis ends by the same amount they are separated from each
	 * other. */
	const inset = (step - bandWidth) / 2

	return {
		step,
		bandWidth,
		startOf: index => index * step + inset,
		centreOf: index => index * step + step / 2,
		indexAt: x => Math.min(safeCount - 1, Math.max(0, Math.floor(x / step))),
	}
}

/**
 * Rough pixels per character at the charts' 11px label size.
 *
 * An estimate, because the alternative is measuring text — which means rendering
 * it, reading it back, and re-rendering the chart with the answer. That is two
 * layout passes and a frame of visibly wrong geometry on every chart, to place an
 * axis whose exact width nobody will notice being 3px out.
 *
 * Erring high is the safe direction: a gutter slightly too wide loses a few pixels
 * of plot, one slightly too narrow clips the labels.
 */
const LABEL_CHARACTER_WIDTH = 6.4

/** Height reserved for one row of category labels under the plot. */
const CATEGORY_AXIS_HEIGHT = 20

/**
 * Carves the value-axis gutter and the category-axis strip out of the available
 * box, leaving the rectangle the marks are drawn in.
 *
 * The left gutter is sized to the widest value label, so an axis running to
 * 1,250,000 gets the room it needs and one running to 9 does not waste it.
 */
export function plotAreaFor({
	width,
	height,
	valueLabels,
	hasCategoryAxis = true,
}: {
	width: number
	height: number
	valueLabels: readonly string[]
	hasCategoryAxis?: boolean
}): PlotArea {
	const widestLabel = valueLabels.reduce((widest, label) => Math.max(widest, label.length), 0)

	const left = Math.ceil(widestLabel * LABEL_CHARACTER_WIDTH) + 10
	const bottom = hasCategoryAxis ? CATEGORY_AXIS_HEIGHT : 0

	/* Half a line of headroom at the top, so the topmost gridline's label is not
	 * clipped by the edge of the SVG. */
	const top = 8

	return {
		left,
		top,
		/* Floored at 1: a chart in a container that has not been laid out yet
		 * reports width 0, and a negative plot width produces NaN coordinates and an
		 * SVG that fails to parse. */
		width: Math.max(1, width - left),
		height: Math.max(1, height - top - bottom),
	}
}

/**
 * How many category labels to draw, so they do not overlap.
 *
 * Returns a stride: label every nth category. Twelve months across 300px cannot
 * all be written horizontally, and the usual fixes are worse than dropping some —
 * rotating them 45° costs vertical space and is slower to read, and shrinking the
 * type past 10px fails WCAG 1.4.4 on zoom.
 *
 * The first and last are always kept, since they anchor the range.
 */
export function labelStride(count: number, width: number, minLabelWidth = 48): number {
	if (count === 0) {
		return 1
	}

	const fits = Math.max(1, Math.floor(width / minLabelWidth))

	return Math.ceil(count / fits)
}
