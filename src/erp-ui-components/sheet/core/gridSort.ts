/**
 * Sorting for the grid.
 *
 * The output is always an **order**: an array of source row indices in display
 * position. The rows themselves are never moved.
 *
 * That matters more than it sounds. A document's item order is data — item 10
 * comes before item 20 — so sorting is a way of *looking* at the table, not an
 * edit to it. Keeping the order separate means `onChange` can hand back rows in
 * their original sequence however the user has the view sorted, and clicking a
 * header can never quietly rewrite the document.
 */

export type SortDirection = 'asc' | 'desc'

export interface GridSort {
	columnKey: string
	direction: SortDirection
}

/** Compares two cell values. Return <0, 0 or >0, as `Array.prototype.sort` wants. */
export type CellComparator = (left: unknown, right: unknown) => number

/**
 * Sort bucket for a value, so a column holding more than one type still has a
 * total order instead of sorting by luck.
 */
type ValueKind = 'number' | 'boolean' | 'date' | 'string' | 'other'

const KIND_RANK: Record<ValueKind, number> = {
	number: 0,
	boolean: 1,
	date: 2,
	string: 3,
	other: 4,
}

let collator: Intl.Collator | null = null

/**
 * Built once and reused. Constructing a collator is expensive enough that doing
 * it per comparison is visible on a few hundred rows.
 *
 * `numeric` is what makes `"item 2"` sort before `"item 10"` instead of after —
 * code-point order puts `"1"` before `"2"` and gets it backwards. Exactly the
 * case ERP data runs into, since half of it is numbered strings.
 */
function getCollator(): Intl.Collator {
	collator ??= new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

	return collator
}

/**
 * True for values with no meaningful position in an ordering: empty cells, `NaN`
 * and invalid dates.
 */
function isUnorderable(value: unknown): boolean {
	if (value === null || value === undefined || value === '') {
		return true
	}

	if (typeof value === 'number') {
		return Number.isNaN(value)
	}

	if (value instanceof Date) {
		return Number.isNaN(value.getTime())
	}

	return false
}

function valueKind(value: unknown): ValueKind {
	if (value instanceof Date) {
		return 'date'
	}

	switch (typeof value) {
		case 'number':
		case 'bigint':
			return 'number'

		case 'boolean':
			return 'boolean'

		case 'string':
			return 'string'

		default:
			return 'other'
	}
}

/**
 * Default comparison: numbers numerically, dates chronologically, strings
 * through the numeric collator, and differing types by a fixed type rank so the
 * result is still deterministic.
 *
 * Empty cells are not handled here — {@link compareRows} groups them before this
 * is reached, so that they can be kept at the bottom in both directions.
 */
export function compareCellValues(left: unknown, right: unknown): number {
	const leftKind = valueKind(left)
	const rightKind = valueKind(right)

	if (leftKind !== rightKind) {
		return KIND_RANK[leftKind] - KIND_RANK[rightKind]
	}

	switch (leftKind) {
		case 'number':
			return Number(left) - Number(right)

		case 'boolean':
			return Number(left) - Number(right)

		case 'date':
			return (left as Date).getTime() - (right as Date).getTime()

		case 'string':
			return getCollator().compare(left as string, right as string)

		default:
			return getCollator().compare(String(left), String(right))
	}
}

/**
 * Computes the display order for a set of rows.
 *
 * Two properties this relies on, both deliberate:
 *
 * - **Empty cells sink to the bottom in both directions.** They are grouped
 *   before the direction is applied, so flipping to descending does not float a
 *   block of blanks to the top where they hide the largest values. This is what
 *   a spreadsheet does and it is almost always what was wanted.
 * - **The sort is stable.** `Array.prototype.sort` has been required to be
 *   stable since ES2019, and the array being sorted starts in source order, so
 *   rows with equal values keep their document sequence. Sorting by plant leaves
 *   the items within each plant in item-number order rather than shuffled.
 */
export function computeOrder<TRow>(
	rows: readonly TRow[],
	/**
	 * Pulls the value to sort on out of a row.
	 *
	 * An accessor rather than a column key, so a **derived** column can be sorted
	 * too. A "net value" column computed from quantity × price has nothing stored
	 * under its key, and a key-based lookup would find `undefined` in every row
	 * and sort by nothing at all — quietly, which is the worst way for a sort to
	 * fail.
	 */
	getValue: (row: TRow) => unknown,
	direction: SortDirection,
	compare: CellComparator = compareCellValues
): number[] {
	const directionFactor = direction === 'asc' ? 1 : -1

	return rows
		.map((_row, index) => index)
		.sort((leftIndex, rightIndex) => {
			const left = getValue(rows[leftIndex])
			const right = getValue(rows[rightIndex])

			const leftIsEmpty = isUnorderable(left)
			const rightIsEmpty = isUnorderable(right)

			if (leftIsEmpty || rightIsEmpty) {
				if (leftIsEmpty && rightIsEmpty) {
					return 0
				}

				/* Not multiplied by directionFactor — that is the whole point. */
				return leftIsEmpty ? 1 : -1
			}

			return compare(left, right) * directionFactor
		})
}

/**
 * Next state when a header is clicked: ascending, then descending, then back to
 * the document's own order.
 *
 * Three states rather than a two-way toggle because the unsorted order is real
 * information in a business document. Once a user has sorted an item table by
 * material there has to be a way back to item sequence, and reloading the screen
 * to get it is not a way.
 */
export function cycleSort(current: GridSort | null, columnKey: string): GridSort | null {
	if (current?.columnKey !== columnKey) {
		return { columnKey, direction: 'asc' }
	}

	if (current.direction === 'asc') {
		return { columnKey, direction: 'desc' }
	}

	return null
}
