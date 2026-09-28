import { useState } from 'react'
import {
	resolveAxisFormatter,
	resolveFormatter,
	seriesColor,
	stackTotals,
	stackValues,
	bandScale,
	linearScale,
	plotAreaFor,
} from './core'
import type { ChartBaseProps, ChartSeries } from './core'
import { CartesianPlot, ChartDataTable, ChartFrame, ChartLegend, ChartTooltip } from './parts'
import type { ChartLegendEntry, ChartTooltipRow } from './parts'
import './Chart.css'

interface BarChartProps extends ChartBaseProps {
	/** The axis labels, left to right. */
	categories: readonly string[]

	/**
	 * One entry per series. Grouped side by side within each category, or stacked
	 * when `isStacked` is set.
	 */
	series: readonly ChartSeries[]

	/**
	 * Stacks the series instead of grouping them, so each bar's total height is the
	 * sum of its parts.
	 *
	 * Right when the parts genuinely add up to something — a cost broken into
	 * material, labour and freight. Wrong when they do not: stacking *ordered*
	 * against *received* produces a total that means nothing, and makes the second
	 * series impossible to compare across categories because its baseline moves.
	 *
	 * Note that only the bottom series in a stack can be read accurately. If the
	 * comparison between series matters more than the total, group them.
	 */
	isStacked?: boolean

	/** Heading for the category column in the accessible data table. Defaults to `"Category"`. */
	categoryHeader?: string
}

/** Comfortable for a chart in a form section; overridable per instance. */
const DEFAULT_HEIGHT = 240

/**
 * Bars, grouped or stacked.
 *
 * ```tsx
 * <BarChart
 *     caption="Ordered against received"
 *     categories={['Jan', 'Feb', 'Mar', 'Apr']}
 *     series={[
 *         { key: 'ordered',  label: 'Ordered',  values: [120, 140, 95, 160] },
 *         { key: 'received', label: 'Received', values: [118, 140, 95, null] },
 *     ]}
 *     formatValue={value => `${value} EA`}
 * />
 * ```
 *
 * **The axis always includes zero, and that is not configurable.** A bar's meaning
 * is its length, so an axis starting at 90 draws 100 as ten times the height of 91.
 * It is the most effective way to mislead with a chart and almost always an
 * accident. A line chart, where slope carries the meaning rather than length, can
 * legitimately start elsewhere — see `LineChart`'s `isZeroBased`.
 *
 * **Gaps are gaps.** A `null` draws no bar at all, rather than a zero-height one
 * sitting on the axis — "we have not received anything yet" and "we received none"
 * are different statements and a chart should not merge them.
 *
 * Hovering a category highlights it and shows every series' value for it. The same
 * numbers are in the data table the chart renders for screen readers, so nothing is
 * only available on hover.
 */
function BarChart({
	caption,
	isCaptionHidden,
	description,
	categories,
	series,
	isStacked,
	categoryHeader = 'Category',
	height = DEFAULT_HEIGHT,
	legendPlacement = 'bottom',
	formatValue,
	className,
}: BarChartProps) {
	/** Which category the pointer is over, or `null`. */
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

	const formatFigure = resolveFormatter(formatValue)
	const formatAxis = resolveAxisFormatter(formatValue)

	/* Every value the axis has to accommodate. For a stack that is the column
	 * totals, not the individual values — a stack reaching 300 needs an axis
	 * reaching 300 even if no single series exceeds 150. */
	const axisValues = isStacked
		? stackTotals(series, categories.length)
		: series.flatMap(oneSeries => oneSeries.values.filter((value): value is number => typeof value === 'number'))

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
				/* Recomputed per width rather than memoised. The whole calculation is a
				 * handful of array passes over data small enough to fit on a screen, and
				 * it only runs when the width, the data or the hover changes — a
				 * useMemo here would cost more in dependency comparison than it saves. */
				const valueScale = linearScale({
					values: axisValues,
					/* A provisional height, only used to pick the ticks — whose labels
					 * then decide how wide the axis gutter is. The real scale below is
					 * built once that is known. */
					height: height - 28,
				})

				const plot = plotAreaFor({
					width,
					height,
					valueLabels: valueScale.ticks.map(formatAxis),
				})

				const scale = linearScale({ values: axisValues, height: plot.height })
				const bands = bandScale({ count: categories.length, width: plot.width })

				const stacks = isStacked ? stackValues(series, categories.length) : null

				/* Grouped bars split the band between them; stacked ones each take the
				 * whole band. A floor of 1px so a chart with many series and a narrow
				 * card still draws something rather than nothing. */
				const barWidth = isStacked ? bands.bandWidth : Math.max(1, bands.bandWidth / Math.max(1, series.length))

				const tooltipRows: ChartTooltipRow[] =
					hoveredIndex === null
						? []
						: series.map((oneSeries, seriesIndex) => {
								const value = oneSeries.values[hoveredIndex]

								return {
									key: oneSeries.key,
									label: oneSeries.label,
									value: typeof value === 'number' ? formatFigure(value) : '—',
									/* Only when there is more than one series. A swatch
									 * beside a single row is decoration explaining a
									 * distinction that does not exist. */
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
								/* Invisible full-height bands, one per category, sitting over
								 * the bars. Hovering the *column* rather than the bar itself
								 * means a short bar is as easy to reach as a tall one — and a
								 * category whose every value is a gap still responds, which
								 * is how the user finds out it is empty rather than broken. */
								<g>
									{categories.map((category, index) => (
										<rect
											key={`${category}-${index}`}
											className={
												index === hoveredIndex
													? 'chart-hover-band chart-hover-band-active'
													: 'chart-hover-band'
											}
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
							{series.map((oneSeries, seriesIndex) => (
								<g key={oneSeries.key} fill={seriesColor(seriesIndex, oneSeries.color)}>
									{categories.map((category, categoryIndex) => {
										const value = oneSeries.values[categoryIndex]

										if (typeof value !== 'number' || !Number.isFinite(value)) {
											return null
										}

										const stack = stacks?.[seriesIndex][categoryIndex]

										const top = stack
											? scale.positionOf(stack.end)
											: scale.positionOf(Math.max(0, value))

										const bottom = stack
											? scale.positionOf(stack.start)
											: scale.positionOf(Math.min(0, value))

										const barHeight = Math.abs(bottom - top)

										/* A stacked segment with nothing in it, or a genuine
										 * zero. Skipped rather than drawn as a hairline, which
										 * would read as a real quantity. */
										if (barHeight < 0.5) {
											return null
										}

										const x = isStacked
											? bands.startOf(categoryIndex)
											: bands.startOf(categoryIndex) + seriesIndex * barWidth

										return (
											<rect
												key={`${oneSeries.key}-${category}-${categoryIndex}`}
												className={
													hoveredIndex !== null && hoveredIndex !== categoryIndex
														? 'chart-bar chart-bar-dimmed'
														: 'chart-bar'
												}
												x={x}
												y={Math.min(top, bottom)}
												width={barWidth}
												height={barHeight}
											/>
										)
									})}
								</g>
							))}
						</CartesianPlot>

						{hoveredIndex !== null && (
							<ChartTooltip
								x={plot.left + bands.centreOf(hoveredIndex)}
								/* Pinned near the top of the plot rather than to the bar's
								 * own height. A tooltip that tracked the bar would jump
								 * vertically as the pointer moved between a tall category and
								 * a short one, which is far more distracting than a box that
								 * slides along a fixed line. */
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

export default BarChart
