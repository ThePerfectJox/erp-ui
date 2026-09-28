/**
 * The hover readout.
 *
 * HTML positioned over the plot, not SVG inside it. An SVG tooltip has to size its
 * own background rectangle, which means knowing how wide the text will be — and
 * measuring text in SVG means rendering it, reading it back and re-rendering. HTML
 * boxes size themselves to their content for free, wrap long labels, and inherit
 * the app's type without restating it.
 *
 * It is a convenience, not the only route to the numbers: the chart's data table
 * has them all, which is what makes a hover-only affordance acceptable.
 */

export interface ChartTooltipRow {
	key: string
	label: string
	value: string

	/** Swatch colour. Omitted for a single-series chart, where there is nothing to tell apart. */
	color?: string
}

interface ChartTooltipProps {
	/** Position within the plot container, in pixels. */
	x: number
	y: number

	/** Container width, used to decide which way to flip near an edge. */
	containerWidth: number

	title: string
	rows: readonly ChartTooltipRow[]
}

/**
 * How close to an edge counts as "near" it. Roughly half a narrow tooltip, so the
 * flip happens before the box would start to be clipped rather than after.
 */
const EDGE_MARGIN = 88

function ChartTooltip({ x, y, containerWidth, title, rows }: ChartTooltipProps) {
	/**
	 * Horizontal alignment, chosen from the position rather than measured.
	 *
	 * Centred over the point normally; pinned to one side when the point is close to
	 * an edge, where a centred box would hang outside the card. Percentages in a
	 * transform mean the box still sizes itself to its text — the alternative,
	 * clamping a pixel `left`, needs the box's width, which is the thing being
	 * avoided.
	 */
	const horizontal = x < EDGE_MARGIN ? '0%' : x > containerWidth - EDGE_MARGIN ? '-100%' : '-50%'

	return (
		<div
			className="chart-tooltip"
			style={{
				left: x,
				top: y,
				/* -100% vertically lifts the box clear of the point it describes, so the
				 * cursor never sits on top of the value it is pointing at. */
				transform: `translate(${horizontal}, -100%)`,
			}}
			/* Hidden and inert. It follows the pointer, so there is nothing for a
			 * keyboard or screen reader user to reach here; the data table is their
			 * route to the same numbers. `pointer-events: none` in the stylesheet also
			 * stops the box from stealing the hover that is keeping it open — which
			 * would make it flicker as the cursor moved under it. */
			aria-hidden="true"
		>
			<p className="chart-tooltip-title">{title}</p>

			<ul className="chart-tooltip-rows">
				{rows.map(row => (
					<li className="chart-tooltip-row" key={row.key}>
						{row.color && (
							<span className="chart-tooltip-swatch" style={{ backgroundColor: row.color }} />
						)}

						<span className="chart-tooltip-label">{row.label}</span>
						<span className="chart-tooltip-value">{row.value}</span>
					</li>
				))}
			</ul>
		</div>
	)
}

export default ChartTooltip
