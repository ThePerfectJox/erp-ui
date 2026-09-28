interface TableSkeletonProps {
	rowCount: number

	/** Total columns, including the selection column if there is one. */
	columnCount: number
}

/**
 * Placeholder rows shown while the data is loading.
 *
 * Grey bars in the real table's shape rather than a spinner, for one reason: the table
 * does not move when the data arrives. A spinner that is replaced by rows makes
 * everything below it jump down the page, and on a screen where the user is already
 * reaching for a row that is how the wrong one gets clicked.
 *
 * `aria-hidden`, with the announcing left to the `aria-busy` on the table itself. Four
 * rows of "loading" read out cell by cell is noise, not information.
 */
function TableSkeleton({ rowCount, columnCount }: TableSkeletonProps) {
	return (
		<>
			{Array.from({ length: rowCount }, (_unused, rowIndex) => (
				<tr className="table-row table-row-skeleton" key={rowIndex} aria-hidden="true">
					{Array.from({ length: columnCount }, (_alsoUnused, columnIndex) => (
						<td className="table-cell" key={columnIndex}>
							{/* Varying widths, so it reads as text of different lengths rather
							  * than as a grid of identical blocks. Derived from the indices so
							  * it is stable across renders — random widths would shimmer on
							  * every re-render. */}
							<span
								className="table-skeleton-bar"
								style={{ width: `${55 + ((rowIndex * 7 + columnIndex * 13) % 40)}%` }}
							/>
						</td>
					))}
				</tr>
			))}
		</>
	)
}

export default TableSkeleton
