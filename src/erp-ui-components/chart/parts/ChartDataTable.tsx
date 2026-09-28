/**
 * The chart's data as a real table, visually hidden.
 *
 * This is the accessible chart. The SVG next to it is `aria-hidden`, so what a
 * screen reader reaches is this: a caption, column headers, and every value, in a
 * structure that can be navigated cell by cell and read at whatever pace the user
 * wants.
 *
 * Not a `role="img"` with a summary. A summary describes the picture; this hands
 * over the content. Someone reconciling a figure needs the number, not a sentence
 * saying the line goes up.
 */

interface ChartDataTableRow {
	/** The category, or the slice name for a donut. */
	label: string

	/** Already formatted, one per column. `""` for a gap. */
	values: readonly string[]
}

interface ChartDataTableProps {
	/** Same text as the chart's visible caption, so both name the same thing. */
	caption: string

	/** Heading for the first column. */
	categoryHeader: string

	/** Headings for the value columns — the series names, or `["Value", "Share"]`. */
	valueHeaders: readonly string[]

	rows: readonly ChartDataTableRow[]
}

function ChartDataTable({ caption, categoryHeader, valueHeaders, rows }: ChartDataTableProps) {
	return (
		/* Two classes, doing two different jobs. `erp-visually-hidden` (from
		 * ../../styles/a11y.css) takes it off screen while leaving it in the
		 * accessibility tree — not `display: none`, which would remove it from both
		 * and leave the chart with no accessible content at all. `chart-data-table` is
		 * only a hook for the donut's side-by-side grid layout to place it. */
		<table className="chart-data-table erp-visually-hidden">
			<caption>{caption}</caption>

			<thead>
				<tr>
					{/* `scope` on both axes, so a screen reader reading a single cell can
					  * announce which series and which category it belongs to. Without it
					  * the user hears a bare number. */}
					<th scope="col">{categoryHeader}</th>

					{valueHeaders.map(header => (
						<th scope="col" key={header}>
							{header}
						</th>
					))}
				</tr>
			</thead>

			<tbody>
				{rows.map(row => (
					<tr key={row.label}>
						<th scope="row">{row.label}</th>

						{row.values.map((value, index) => (
							<td key={valueHeaders[index] ?? index}>
								{/* An em dash for a gap, not an empty cell. "No data" and
								  * "the cell failed to render" sound identical when a cell
								  * is simply skipped. */}
								{value === '' ? '—' : value}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	)
}

export default ChartDataTable
