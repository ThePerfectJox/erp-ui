/**
 * Turning positions into SVG path strings.
 *
 * Pure string building, deliberately. An SVG `d` attribute is the one place a
 * chart is easiest to get subtly wrong — an arc with the wrong sweep flag draws
 * the long way round the circle, a line through a gap invents data that was never
 * there — and both are obvious in a string and invisible in a rendered picture at
 * a glance.
 */

import type { ChartSeries } from './types'

/** A point in plot pixels. */
export interface PlotPoint {
	x: number
	y: number
}

const TAU = Math.PI * 2

/**
 * A point on a circle, with **0 at 12 o'clock and angles growing clockwise**.
 *
 * Not the maths convention, which puts 0 at 3 o'clock and grows anticlockwise.
 * Converted here, once, because every pie and donut anyone has ever read starts at
 * the top and goes round the way a clock does — and a chart that starts at 3
 * o'clock looks broken in a way people cannot name.
 */
export function polarPoint(centreX: number, centreY: number, radius: number, angle: number): PlotPoint {
	return {
		x: centreX + radius * Math.sin(angle),
		y: centreY - radius * Math.cos(angle),
	}
}

/**
 * Splits a series into runs of consecutive present points.
 *
 * This is how a gap stays a gap. One path through every point would draw a
 * straight line across a month with no data, which reads as a measured value
 * halfway between its neighbours — the chart inventing a number. One path per run
 * leaves a visible break instead, which is the truth.
 */
export function toSegments(points: readonly (PlotPoint | null)[]): PlotPoint[][] {
	const segments: PlotPoint[][] = []
	let current: PlotPoint[] = []

	for (const point of points) {
		if (point) {
			current.push(point)
			continue
		}

		if (current.length > 0) {
			segments.push(current)
			current = []
		}
	}

	if (current.length > 0) {
		segments.push(current)
	}

	return segments
}

/**
 * A polyline through the points.
 *
 * Straight segments, no curve fitting, and that is a decision rather than a
 * shortcut. A spline through monthly totals draws values between the months that
 * were never measured, and it overshoots — a smooth curve through 0, 100, 0 dips
 * below zero on the way out and back. Business data is a series of readings, and
 * straight lines say exactly that.
 */
export function linePath(segment: readonly PlotPoint[]): string {
	if (segment.length === 0) {
		return ''
	}

	return segment.map((point, index) => `${index === 0 ? 'M' : 'L'}${round(point.x)} ${round(point.y)}`).join(' ')
}

/**
 * The same polyline closed down to a baseline and filled.
 *
 * A single point produces nothing: an area needs width, and a one-point "area" is
 * a zero-width sliver that reads as a rendering glitch. The line chart draws a
 * marker for it instead.
 */
export function areaPath(segment: readonly PlotPoint[], baselineY: number): string {
	if (segment.length < 2) {
		return ''
	}

	const first = segment[0]
	const last = segment[segment.length - 1]

	return `${linePath(segment)} L${round(last.x)} ${round(baselineY)} L${round(first.x)} ${round(baselineY)} Z`
}

/**
 * One wedge of a donut, as a closed path: out along the start radius, round the
 * outer edge, in along the end radius, back round the inner edge.
 *
 * @param innerRadius 0 draws a pie slice rather than a donut wedge.
 */
export function donutSlicePath(
	centreX: number,
	centreY: number,
	outerRadius: number,
	innerRadius: number,
	startAngle: number,
	endAngle: number
): string {
	const sweep = endAngle - startAngle

	if (sweep <= 0) {
		return ''
	}

	/* A single slice covering everything is the case that breaks naive arc code: at
	 * a full turn the start and end points are the same coordinate, and an SVG arc
	 * between two identical points draws nothing at all — so a 100% donut renders
	 * blank. Split into two half turns, which have distinct endpoints. */
	if (sweep >= TAU - 1e-6) {
		const half = startAngle + Math.PI

		return [
			donutSlicePath(centreX, centreY, outerRadius, innerRadius, startAngle, half),
			donutSlicePath(centreX, centreY, outerRadius, innerRadius, half, startAngle + TAU),
		].join(' ')
	}

	const outerStart = polarPoint(centreX, centreY, outerRadius, startAngle)
	const outerEnd = polarPoint(centreX, centreY, outerRadius, endAngle)
	const innerEnd = polarPoint(centreX, centreY, innerRadius, endAngle)
	const innerStart = polarPoint(centreX, centreY, innerRadius, startAngle)

	/* SVG cannot tell a 30° arc from the 330° one that shares its endpoints. This
	 * flag is the answer, and getting it wrong is what makes a small slice swallow
	 * the whole chart. */
	const isLargeArc = sweep > Math.PI ? 1 : 0

	if (innerRadius <= 0) {
		return [
			`M${round(centreX)} ${round(centreY)}`,
			`L${round(outerStart.x)} ${round(outerStart.y)}`,
			`A${round(outerRadius)} ${round(outerRadius)} 0 ${isLargeArc} 1 ${round(outerEnd.x)} ${round(outerEnd.y)}`,
			'Z',
		].join(' ')
	}

	return [
		`M${round(outerStart.x)} ${round(outerStart.y)}`,
		/* Sweep flag 1: clockwise, matching the angle convention above. */
		`A${round(outerRadius)} ${round(outerRadius)} 0 ${isLargeArc} 1 ${round(outerEnd.x)} ${round(outerEnd.y)}`,
		`L${round(innerEnd.x)} ${round(innerEnd.y)}`,
		/* Sweep flag 0: anticlockwise, coming back the other way. Using 1 here is
		 * the classic donut bug — the inner edge doubles back on itself and the
		 * wedge fills with a bow-tie. */
		`A${round(innerRadius)} ${round(innerRadius)} 0 ${isLargeArc} 0 ${round(innerStart.x)} ${round(innerStart.y)}`,
		'Z',
	].join(' ')
}

/** One series' span within a stack, in value space. */
export interface StackSegment {
	/** Where this series starts — the total of the series below it. */
	start: number

	/** Where it ends. Equal to `start` for a gap, so nothing is drawn. */
	end: number
}

/**
 * Stacks series on top of one another, in the order given.
 *
 * Indexed `[seriesIndex][categoryIndex]`, matching the shape the caller already
 * has, so drawing is a straight nested map with no lookups.
 *
 * Gaps do not advance the running total. A series with no value for March
 * contributes no height there, and the series above it sits directly on whatever
 * was below — rather than floating on an invisible zero-height block, which is the
 * same thing but takes a paragraph to explain when someone asks why there is a
 * hairline in the middle of a bar.
 */
export function stackValues(series: readonly ChartSeries[], categoryCount: number): StackSegment[][] {
	const runningTotals = new Array<number>(categoryCount).fill(0)

	return series.map(oneSeries =>
		Array.from({ length: categoryCount }, (_unused, categoryIndex) => {
			const value = oneSeries.values[categoryIndex]
			const start = runningTotals[categoryIndex]

			if (typeof value !== 'number' || !Number.isFinite(value)) {
				return { start, end: start }
			}

			/* Negatives in a stack would subtract from the bar below, which reads as
			 * the wrong series having shrunk. Clamped, and the accessible table still
			 * reports the real number. */
			const end = start + Math.max(0, value)

			runningTotals[categoryIndex] = end

			return { start, end }
		})
	)
}

/** Total per category. What a stacked chart's value axis has to reach. */
export function stackTotals(series: readonly ChartSeries[], categoryCount: number): number[] {
	return Array.from({ length: categoryCount }, (_unused, categoryIndex) =>
		series.reduce((total, oneSeries) => {
			const value = oneSeries.values[categoryIndex]

			return typeof value === 'number' && Number.isFinite(value) ? total + Math.max(0, value) : total
		}, 0)
	)
}

/**
 * Two decimal places, as a number so `1` stays `1` rather than becoming `1.00`.
 *
 * Path strings are a surprising share of an SVG chart's bytes — a line across
 * fifty categories is fifty coordinate pairs — and sub-pixel precision past two
 * decimals is invisible on any display. Trimming it makes the markup readable
 * when something needs debugging, which is worth more than the bytes.
 */
function round(value: number): number {
	return Math.round(value * 100) / 100
}
