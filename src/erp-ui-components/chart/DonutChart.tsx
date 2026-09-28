import { useState } from 'react'
import { classNames } from '../shared/classNames'
import { donutSlicePath, formatShare, resolveFormatter, seriesColor } from './core'
import type { ChartBaseProps, ChartSlice } from './core'
import { ChartDataTable, ChartFrame, ChartLegend, ChartTooltip } from './parts'
import type { ChartLegendEntry, ChartTooltipRow } from './parts'
import './Chart.css'

interface DonutChartProps extends Omit<ChartBaseProps, 'legendPlacement'> {
	/**
	 * The wedges, drawn clockwise from 12 o'clock in the order given.
	 *
	 * Order them largest first unless the order means something — months, workflow
	 * stages. Comparing two similar arcs is hard enough without them being on
	 * opposite sides of the circle.
	 *
	 * Negative values are dropped: a negative share of a whole has no meaning, and
	 * drawing one would wrap the arc back over its neighbours. The accessible data
	 * table still reports them, so a bad number is visible rather than silently
	 * gone.
	 */
	slices: readonly ChartSlice[]

	/**
	 * Hole size as a share of the radius, 0 to 0.9. Defaults to 0.62.
	 *
	 * 0 draws a pie. The hole is not decoration — it is what makes the wedges read
	 * as arc *lengths* rather than as triangles, which people compare more
	 * accurately, and it is where the total goes.
	 */
	innerRadiusRatio?: number

	/**
	 * Wording for the figure in the middle — "Total", "Open items".
	 *
	 * Left off, the centre stays empty. Worth filling: the one thing a donut cannot
	 * show is the size of the whole, and the middle is the only place to put it.
	 */
	totalLabel?: string

	/** Heading for the name column in the accessible data table. Defaults to `"Category"`. */
	categoryHeader?: string

	/**
	 * Where the legend goes. `"right"` is the default and suits a donut: the labels
	 * stack beside the circle and carry each wedge's value, which is the only way to
	 * read an exact figure off one.
	 */
	legendPlacement?: 'right' | 'bottom' | 'none'
}

const DEFAULT_HEIGHT = 220

/**
 * Part-to-whole, as a ring.
 *
 * ```tsx
 * <DonutChart
 *     caption="Net value by material group"
 *     slices={[
 *         { key: 'raw',       label: 'Raw material', value: 2208 },
 *         { key: 'hardware',  label: 'Hardware',     value: 408 },
 *         { key: 'packaging', label: 'Packaging',    value: 229 },
 *     ]}
 *     totalLabel="Net total"
 *     formatValue={value => `€${value.toFixed(2)}`}
 * />
 * ```
 *
 * **Use it for few slices.** Three to six. Past that the wedges get too thin to tell
 * apart, the palette starts repeating at eight, and a bar chart answers the same
 * question better — people read lengths far more accurately than angles. A donut
 * earns its place when the point is "these are the parts of one thing", not when it
 * is "which of these is biggest".
 *
 * **The legend carries the numbers.** Each entry shows its value and share, because
 * an exact figure cannot be read off an arc. That makes the legend part of the
 * chart rather than a key to it, which is why it defaults to sitting alongside.
 */
function DonutChart({
	caption,
	isCaptionHidden,
	description,
	slices,
	innerRadiusRatio = 0.62,
	totalLabel,
	categoryHeader = 'Category',
	height = DEFAULT_HEIGHT,
	legendPlacement = 'right',
	formatValue,
	className,
}: DonutChartProps) {
	const [hoveredKey, setHoveredKey] = useState<string | null>(null)

	const formatFigure = resolveFormatter(formatValue)

	/* Negatives clamped to zero for drawing. The data table reports the original. */
	const drawable = slices.map((slice, index) => ({
		...slice,
		drawValue: Number.isFinite(slice.value) ? Math.max(0, slice.value) : 0,
		color: seriesColor(index, slice.color),
	}))

	const total = drawable.reduce((sum, slice) => sum + slice.drawValue, 0)

	const legendEntries: ChartLegendEntry[] = drawable.map(slice => ({
		key: slice.key,
		label: slice.label,
		color: slice.color,
		value: (
			<>
				{formatFigure(slice.value)}
				{/* The share in a quieter span, so the eye lands on the figure first.
				  * Both are here because they answer different questions — "how much"
				  * and "how much of it". */}
				<span className="chart-legend-share">{formatShare(slice.drawValue, total)}</span>
			</>
		),
	}))

	const dataTable = (
		<ChartDataTable
			caption={caption}
			categoryHeader={categoryHeader}
			valueHeaders={['Value', 'Share']}
			rows={drawable.map(slice => ({
				label: slice.label,
				values: [formatFigure(slice.value), formatShare(slice.drawValue, total)],
			}))}
		/>
	)

	return (
		<ChartFrame
			caption={caption}
			isCaptionHidden={isCaptionHidden}
			description={description}
			height={height}
			legend={
				legendPlacement === 'none' ? undefined : (
					/* `right` is a donut-only arrangement, so it is a modifier class on the
					 * chart rather than a placement ChartLegend has to know about. The
					 * legend itself still renders in document order after the plot. */
					<ChartLegend entries={legendEntries} placement="bottom" />
				)
			}
			legendPlacement={legendPlacement === 'none' ? 'none' : 'bottom'}
			dataTable={dataTable}
			className={classNames(legendPlacement === 'right' ? 'chart-donut-beside' : 'chart-donut', className)}
		>
			{width => {
				const centreX = width / 2
				const centreY = height / 2

				/* The circle is bounded by whichever axis is shorter, less a margin for
				 * the hover ring to grow into without being clipped. */
				const outerRadius = Math.max(1, Math.min(centreX, centreY) - 6)
				const innerRadius = outerRadius * Math.min(0.9, Math.max(0, innerRadiusRatio))

				/* Running angle, in the clockwise-from-noon convention `polarPoint` uses. */
				let angle = 0

				return (
					<>
						<svg className="chart-svg" width={width} height={height} aria-hidden="true" focusable="false">
							{total <= 0 ? (
								/* Nothing to divide up. An empty ring rather than a blank box,
								 * so the chart reads as "no data" instead of as failed. */
								<circle
									className="chart-donut-empty"
									cx={centreX}
									cy={centreY}
									r={(outerRadius + innerRadius) / 2}
									strokeWidth={outerRadius - innerRadius}
									fill="none"
								/>
							) : (
								drawable.map(slice => {
									if (slice.drawValue <= 0) {
										return null
									}

									const startAngle = angle
									const endAngle = startAngle + (slice.drawValue / total) * Math.PI * 2

									angle = endAngle

									const isHovered = slice.key === hoveredKey

									return (
										<path
											key={slice.key}
											className={isHovered ? 'chart-slice chart-slice-active' : 'chart-slice'}
											/* The hovered wedge grows outwards by 3px rather
											 * than being pulled away from the centre. An
											 * exploded slice changes the apparent size of the
											 * gap next to it, which is the one thing the chart
											 * is meant to communicate accurately. */
											d={donutSlicePath(
												centreX,
												centreY,
												isHovered ? outerRadius + 3 : outerRadius,
												innerRadius,
												startAngle,
												endAngle
											)}
											fill={slice.color}
											onMouseEnter={() => setHoveredKey(slice.key)}
											onMouseLeave={() => setHoveredKey(null)}
										/>
									)
								})
							)}

							{totalLabel && (
								/* The hole's job. Two lines of text centred on the circle, and
								 * `pointer-events: none` in the stylesheet so it never
								 * intercepts a hover meant for a wedge behind it. */
								<g className="chart-donut-centre">
									<text
										className="chart-donut-total"
										x={centreX}
										y={centreY}
										textAnchor="middle"
										dy="-0.1em"
									>
										{formatFigure(total)}
									</text>

									<text
										className="chart-donut-total-label"
										x={centreX}
										y={centreY}
										textAnchor="middle"
										dy="1.3em"
									>
										{totalLabel}
									</text>
								</g>
							)}
						</svg>

						{hoveredKey !== null &&
							(() => {
								const slice = drawable.find(candidate => candidate.key === hoveredKey)

								if (!slice) {
									return null
								}

								const rows: ChartTooltipRow[] = [
									{
										key: 'value',
										label: 'Value',
										value: formatFigure(slice.value),
									},
									{
										key: 'share',
										label: 'Share',
										value: formatShare(slice.drawValue, total),
									},
								]

								return (
									<ChartTooltip
										/* Above the circle rather than following the pointer
										 * round it. A tooltip orbiting the donut is hard to
										 * read and keeps overlapping the wedge it describes. */
										x={centreX}
										y={centreY - outerRadius}
										containerWidth={width}
										title={slice.label}
										rows={rows}
									/>
								)
							})()}
					</>
				)
			}}
		</ChartFrame>
	)
}

export default DonutChart
