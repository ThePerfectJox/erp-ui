import { useState } from 'react'
import {
	areaPath,
	bandScale,
	linePath,
	linearScale,
	plotAreaFor,
	resolveAxisFormatter,
	resolveFormatter,
	seriesColor,
	toSegments,
} from './core'
import type { ChartBaseProps, ChartSeries, PlotPoint } from './core'
import { CartesianPlot, ChartDataTable, ChartFrame, ChartLegend, ChartTooltip } from './parts'
import type { ChartLegendEntry, ChartTooltipRow } from './parts'
import './Chart.css'

interface LineChartProps extends ChartBaseProps {
	/** The axis labels, left to right. Usually time. */
	categories: readonly string[]

	series: readonly ChartSeries[]

	/** Fills the space under each line. Single-series charts only — see the note below. */
	isArea?: boolean

	/**
	 * Draws a dot at every point rather than only at the ends of a run.
	 *
	 * Worth turning on for a short series, where the dots say "these are the four
	 * readings we have" instead of implying a continuous measurement. Turn it off
	 * for a long one, where fifty dots on a 300px line merge into a thick line.
	 */
	hasMarkers?: boolean

	/**
	 * Lets the value axis start somewhere other than zero, so a line that moves
	 * within a narrow band is legible.
	 *
	 * Defensible here in a way it never is on a bar chart: a line's *slope* carries
	 * the meaning, and forcing an exchange rate between 1.08 and 1.12 onto a
	 * zero-based axis flattens it into a straight horizontal line that says nothing.
	 *
	 * Still a decision to make deliberately. A truncated axis makes a 2% move look
	 * dramatic, so it belongs on a chart whose reader knows the range — and not on a
	 * chart of quantities, where zero is meaningful and reachable.
	 */
	isZeroBased?: boolean

	/** Heading for the category column in the accessible data table. Defaults to `"Category"`. */
	categoryHeader?: string
}

const DEFAULT_HEIGHT = 240

/**
 * Lines over a shared category axis.
 *
 * ```tsx
 * <LineChart
 *     caption="Open order value by month"
 *     categories={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
 *     series={[
 *         { key: 'plan',   label: 'Plan',   values: [90, 92, 95, 97, 100, 104] },
 *         { key: 'actual', label: 'Actual', values: [88, 96, 94, 103, null, null] },
 *     ]}
 *     hasMarkers
 * />
 * ```
 *
 * **Straight segments, no curve fitting.** A spline through monthly readings draws
 * values for dates that were never measured, and it overshoots — a smooth curve
 * through 0, 100, 0 dips below zero on its way back. Business data is a series of
 * readings; straight lines say exactly that and nothing more.
 *
 * **A `null` breaks the line** rather than being joined across. An actuals series
 * that stops in April should stop in April, not slope gently down to December.
 *
 * **`isArea` is for one series.** Two filled areas overlap, and the one drawn second
 * hides the one drawn first — which looks like data loss and is. Use it for a single
 * series where the fill emphasises magnitude, and leave it off otherwise.
 *
 * Hovering anywhere in the plot snaps to the nearest category and reads out every
 * series at once, so two lines can be compared at a point without landing the
 * pointer on a 4px dot.
 */
function LineChart({
	caption,
	isCaptionHidden,
	description,
	categories,
	series,
	isArea,
	hasMarkers,
	isZeroBased = true,
	categoryHeader = 'Category',
	height = DEFAULT_HEIGHT,
	legendPlacement = 'bottom',
	formatValue,
	className,
}: LineChartProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

	const formatFigure = resolveFormatter(formatValue)
	const formatAxis = resolveAxisFormatter(formatValue)

	const presentValues = series.flatMap(oneSeries =>
		oneSeries.values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
	)

	const legendEntries: ChartLegendEntry[] = series.map((oneSeries, index) => ({
		key: oneSeries.key,
		label: oneSeries.label,
		color: seriesColor(index, oneSeries.color),
	}))

	const dataTable = (
		<ChartDataTable
			caption={caption}
			categoryHeader={categoryHeader}
			valueHeaders={series.map(oneSeries => oneSeries.label)}
			rows={categories.map((category, categoryIndex) => ({
				label: category,
				values: series.map(oneSeries => {
					const value = oneSeries.values[categoryIndex]

					return typeof value === 'number' ? formatFigure(value) : ''
				}),
			}))}
		/>
	)

	return (
		<ChartFrame
			caption={caption}
			isCaptionHidden={isCaptionHidden}
			description={description}
			height={height}
			legend={legendPlacement === 'none' ? undefined : <ChartLegend entries={legendEntries} placement={legendPlacement} />}
			legendPlacement={legendPlacement}
			dataTable={dataTable}
			className={className}
		>
			{width => {
				/* Two passes, as in BarChart: the first picks the ticks, whose labels
				 * decide the gutter width, which decides the real plot height. */
				const provisional = linearScale({ values: presentValues, height: height - 28, isZeroBased })

				const plot = plotAreaFor({
					width,
					height,
					valueLabels: provisional.ticks.map(formatAxis),
				})

				const scale = linearScale({ values: presentValues, height: plot.height, isZeroBased })

				/* No padding: a line's points sit at slot centres, and there is nothing
				 * between neighbouring slots for a gap to separate. Padding here would
				 * inset the first and last points from the axis ends for no reason. */
				const bands = bandScale({ count: categories.length, width: plot.width, padding: 0 })

				/** Points per series, with `null` kept so the gaps survive. */
				const seriesPoints = series.map(oneSeries =>
					categories.map((_category, categoryIndex): PlotPoint | null => {
						const value = oneSeries.values[categoryIndex]

						if (typeof value !== 'number' || !Number.isFinite(value)) {
							return null
						}

						return { x: bands.centreOf(categoryIndex), y: scale.positionOf(value) }
					})
				)

				const tooltipRows: ChartTooltipRow[] =
					hoveredIndex === null
						? []
						: series.map((oneSeries, seriesIndex) => {
								const value = oneSeries.values[hoveredIndex]

								return {
									key: oneSeries.key,
									label: oneSeries.label,
									value: typeof value === 'number' ? formatFigure(value) : '—',
									color: series.length > 1 ? seriesColor(seriesIndex, oneSeries.color) : undefined,
								}
							})

				return (
					<>
						<CartesianPlot
							width={width}
							height={height}
							plot={plot}
							categories={categories}
							valueScale={scale}
							bands={bands}
							formatAxisValue={formatAxis}
							overlay={
								<g>
									{/* The guide is drawn before the hit areas so the pointer
									  * is never over it — and under the lines, so it reads as
									  * a background rule rather than as another series. */}
									{hoveredIndex !== null && (
										<line
											className="chart-hover-guide"
											x1={bands.centreOf(hoveredIndex)}
											y1={0}
											x2={bands.centreOf(hoveredIndex)}
											y2={plot.height}
										/>
									)}

									{categories.map((category, index) => (
										<rect
											key={`${category}-${index}`}
											className="chart-hover-band"
											x={index * bands.step}
											y={0}
											width={bands.step}
											height={plot.height}
											onMouseEnter={() => setHoveredIndex(index)}
											onMouseLeave={() => setHoveredIndex(null)}
										/>
									))}
								</g>
							}
						>
							{series.map((oneSeries, seriesIndex) => {
								const color = seriesColor(seriesIndex, oneSeries.color)
								const segments = toSegments(seriesPoints[seriesIndex])

								return (
									<g key={oneSeries.key}>
										{isArea &&
											segments.map((segment, segmentIndex) => (
												<path
													key={`area-${segmentIndex}`}
													className="chart-area"
													/* The fill stops at the axis, not at the
													 * bottom of the plot — on a chart with a
													 * truncated axis those are the same line,
													 * but on one crossing zero the area has to
													 * hang off the zero line to make sense. */
													d={areaPath(segment, scale.positionOf(Math.max(scale.min, 0)))}
													fill={color}
												/>
											))}

										{segments.map((segment, segmentIndex) => (
											<path
												key={`line-${segmentIndex}`}
												className="chart-line"
												d={linePath(segment)}
												stroke={color}
												/* Explicit, because a <path> defaults to
												 * black fill and a line chart drawn with a
												 * fill becomes an unreadable blob. */
												fill="none"
											/>
										))}

										{seriesPoints[seriesIndex].map((point, categoryIndex) => {
											if (!point) {
												return null
											}

											/* Markers are opt-in, with one exception: a run of
											 * exactly one point has no line to draw, so without
											 * a dot the value would be invisible. */
											const isLonePoint =
												!seriesPoints[seriesIndex][categoryIndex - 1] &&
												!seriesPoints[seriesIndex][categoryIndex + 1]

											if (!hasMarkers && !isLonePoint && categoryIndex !== hoveredIndex) {
												return null
											}

											return (
												<circle
													key={`point-${categoryIndex}`}
													className={
														categoryIndex === hoveredIndex
															? 'chart-point chart-point-active'
															: 'chart-point'
													}
													cx={point.x}
													cy={point.y}
													r={categoryIndex === hoveredIndex ? 4.5 : 3}
													fill={color}
												/>
											)
										})}
									</g>
								)
							})}
						</CartesianPlot>

						{hoveredIndex !== null && (
							<ChartTooltip
								x={plot.left + bands.centreOf(hoveredIndex)}
								y={plot.top + 12}
								containerWidth={width}
								title={categories[hoveredIndex]}
								rows={tooltipRows}
							/>
						)}
					</>
				)
			}}
		</ChartFrame>
	)
}

export default LineChart
