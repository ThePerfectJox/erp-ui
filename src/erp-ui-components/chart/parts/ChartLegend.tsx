/**
 * The key: which colour is which series.
 *
 * Real text, not hidden from assistive technology. It duplicates the series names
 * in the data table, and that is fine — hiding visible text from a screen reader
 * because it appears elsewhere is how a page ends up describing itself differently
 * to different users.
 */

import type { ReactNode } from 'react'

export interface ChartLegendEntry {
	key: string
	label: string

	/** A CSS colour, usually a `var(--chart-n)` from `seriesColor`. */
	color: string

	/**
	 * An optional figure after the label — a total, a share.
	 *
	 * Used by the donut, where the legend is doing double duty as the readout: a
	 * wedge's exact value cannot be read off an arc, so the legend carries it.
	 */
	value?: ReactNode
}

interface ChartLegendProps {
	entries: readonly ChartLegendEntry[]

	/** Adds a bottom margin for a legend above the plot, a top one for below. */
	placement: 'top' | 'bottom'
}

function ChartLegend({ entries, placement }: ChartLegendProps) {
	if (entries.length === 0) {
		return null
	}

	return (
		/* A list, because it is one. A row of <span>s would read as a run-on sentence
		 * of series names with no indication of where one ends. */
		<ul className={`chart-legend chart-legend-${placement}`}>
			{entries.map(entry => (
				<li className="chart-legend-item" key={entry.key}>
					{/* The swatch is the only colour-only element in the chart, and it is
					  * decorative: the label next to it is the actual information. Hidden,
					  * so a screen reader does not announce an empty bullet before every
					  * series name. */}
					<span className="chart-legend-swatch" style={{ backgroundColor: entry.color }} aria-hidden="true" />

					<span className="chart-legend-label">{entry.label}</span>

					{entry.value !== undefined && <span className="chart-legend-value">{entry.value}</span>}
				</li>
			))}
		</ul>
	)
}

export default ChartLegend
