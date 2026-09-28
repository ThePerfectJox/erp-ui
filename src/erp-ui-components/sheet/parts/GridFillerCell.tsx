/**
 * The empty cell after the last column, one per row.
 *
 * This is what lets the grid be full width *and* Excel-like at the same time.
 * Every real column has a definite pixel width, so when they add up to less than
 * the container there is space left over and something has to take it. Without a
 * filler the browser would hand it to the real columns — which is precisely the
 * auto-fitting the definite widths exist to avoid, and which made "narrow every
 * column" impossible.
 *
 * So the filler soaks it up instead. The columns stay exactly as wide as they
 * were set, and the table still reaches the right-hand edge. When the columns are
 * wider than the container the filler collapses to nothing and the scrollport
 * takes over.
 *
 * It is `aria-hidden` because it holds no data: a screen reader reading "blank"
 * at the end of every row would be describing a layout trick.
 */

interface GridFillerCellProps {
	/** Renders a `<th>` for the header row instead of a `<td>`. */
	isHeader?: boolean
}

function GridFillerCell({ isHeader }: GridFillerCellProps) {
	if (isHeader) {
		return <th className="grid-filler grid-filler-header" aria-hidden="true" />
	}

	return <td className="grid-filler" aria-hidden="true" />
}

export default GridFillerCell
