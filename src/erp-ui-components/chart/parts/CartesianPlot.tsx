/**
 * The furniture behind a bar or line chart: gridlines, the value axis, the
 * category axis, and the baseline.
 *
 * Shared by `BarChart` and `LineChart`, which differ only in what they draw *on*
 * it. Keeping it here means the two charts cannot end up with axes that disagree
 * about tick placement or label spacing, which is exactly the sort of difference
 * that makes two charts on one screen impossible to compare.
 */

import type { ReactNode } from 'react'
import { labelStride } from '../core/scale'
import type { BandScale, LinearScale, PlotArea } from '../core/scale'
import type { ChartValueFormatter } from '../core/types'

interface CartesianPlotProps {
	width: number
	height: number
	plot: PlotArea
	categories: readonly string[]
	valueScale: LinearScale
	bands: BandScale
	formatAxisValue: ChartValueFormatter

	/** The marks — bars, lines, points. Drawn in plot coordinates. */
	children: ReactNode

	/** Hover targets and the highlight, drawn over the marks. */
	overlay?: ReactNode
}

function CartesianPlot({
	width,
	height,
	plot,
	categories,
	valueScale,
	bands,
	formatAxisValue,
	children,
	overlay,
}: CartesianPlotProps) {
	/* Every nth label, so twelve months in a narrow card drop to every second or
	 * third rather than overlapping into an unreadable smear. */
	const stride = labelStride(categories.length, plot.width)

	return (
		<svg
			className="chart-svg"
			width={width}
			height={height}
			/* Hidden, because the `<ChartDataTable>` beside it carries the same data in
			 * a form a screen reader can actually use. See the note on ChartFrame. */
			aria-hidden="true"
			focusable="false"
		>
			{/* One translate for the whole plot, so every mark inside can be positioned
			  * from 0,0 and no coordinate has to carry the axis gutter around with it. */}
			<g transform={`translate(${plot.left}, ${plot.top})`}>
				{/* --- gridlines and value labels ------------------------------------ */}
				{valueScale.ticks.map(tick => {
					const y = valueScale.positionOf(tick)

					/* The zero line is drawn as the axis rather than as a gridline: it is
					 * the line every bar is measured from, so it has to read as structure
					 * and not as one of the reading aids behind the data. */
					const isBaseline = tick === 0

					return (
						<g key={tick}>
							<line
								className={isBaseline ? 'chart-baseline' : 'chart-gridline'}
								x1={0}
								y1={y}
								x2={plot.width}
								y2={y}
							/>

							<text
								className="chart-axis-label chart-axis-label-value"
								/* Outside the plot, in the gutter the plot area reserved. */
								x={-8}
								y={y}
								textAnchor="end"
								/* Centres the text on the gridline. `dominant-baseline`
								 * would be the tidier way and is inconsistent across
								 * engines for `middle`; a third of the cap height is the
								 * reliable one. */
								dy="0.32em"
							>
								{formatAxisValue(tick)}
							</text>
						</g>
					)
				})}

				{/* --- marks --------------------------------------------------------- */}
				{children}

				{/* --- category labels ----------------------------------------------- */}
				{categories.map((category, index) => {
					/* The last label is always kept, even when the stride would skip it:
					 * the two ends of the axis are what tell the reader what range they
					 * are looking at. */
					const isLast = index === categories.length - 1

					if (index % stride !== 0 && !isLast) {
						return null
					}

					return (
						<text
							key={`${category}-${index}`}
							className="chart-axis-label chart-axis-label-category"
							x={bands.centreOf(index)}
							y={plot.height + 14}
							textAnchor="middle"
						>
							{category}
						</text>
					)
				})}

				{overlay}
			</g>
		</svg>
	)
}

export default CartesianPlot
