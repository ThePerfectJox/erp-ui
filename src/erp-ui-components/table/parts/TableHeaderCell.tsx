import { classNames } from '../../shared/classNames'
import type { SortDirection } from '../../shared/sortRows'
import { resolveCellAlign } from '../core/cellText'
import type { TableColumn } from '../core/types'

interface TableHeaderCellProps {
	column: TableColumn

	/** The direction this column is sorted, or `null` if it is not. */
	sortDirection: SortDirection | null

	isSortable: boolean

	onSort: () => void
}

/**
 * One column heading, sortable or not.
 *
 * Presentational: it is told whether it is sorted and which way, and knows nothing about
 * what the next click will do. The three-state cycle — ascending, descending, back to the
 * original order — lives in `shared/sortRows`.
 */
function TableHeaderCell({ column, sortDirection, isSortable, onSort }: TableHeaderCellProps) {
	return (
		<th
			className={classNames(
				'table-header',
				column.hideBelow && `table-hide-below-${column.hideBelow}`,
				column.isNoWrap && 'table-nowrap'
			)}
			scope="col"
			/* The one ARIA attribute that matters on a sortable header: it is how a screen
			 * reader announces the current direction rather than just "sortable". Absent —
			 * not "none" — on the columns that are not sorted, so only one header ever
			 * claims a direction. */
			aria-sort={sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
			style={{ width: column.width, textAlign: resolveCellAlign(column) }}
		>
			{isSortable ? (
				/* A real button, so the header is reachable by keyboard and announced as
				 * pressable. A click handler on the <th> alone would be neither. */
				<button type="button" className="table-sort-button" onClick={onSort}>
					<span className="table-header-label">{column.header}</span>
					<span
						className={classNames('table-sort-arrow', sortDirection && `table-sort-arrow-${sortDirection}`)}
						aria-hidden="true"
					/>
				</button>
			) : (
				<span className="table-header-label">{column.header}</span>
			)}
		</th>
	)
}

export default TableHeaderCell
