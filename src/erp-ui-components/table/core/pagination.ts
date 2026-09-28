/**
 * Page arithmetic.
 *
 * Small, dull, and worth having on its own because every one of these functions has an
 * off-by-one waiting in it. Pages are **1-based** throughout — page 1 is the first —
 * because that is what the user is shown, and converting at the boundary once is
 * cheaper than remembering which layer is 0-based.
 */

/** How the range is described: `{ first, last, total }` for "21–40 of 137". */
export interface PageRange {
	/** 1-based index of the first row on the page. 0 when there are no rows. */
	first: number

	/** 1-based index of the last row on the page. 0 when there are no rows. */
	last: number

	total: number
}

/**
 * How many pages a row count needs.
 *
 * At least 1, even for zero rows. A table showing "page 1 of 0" is nonsense, and a
 * loop bounded by 0 pages renders no pager at all — so an empty table would lose the
 * control that tells the user it is empty rather than broken.
 */
export function pageCount(total: number, pageSize: number): number {
	if (pageSize <= 0) {
		return 1
	}

	return Math.max(1, Math.ceil(total / pageSize))
}

/**
 * Holds a page number inside the range that exists.
 *
 * The case this is really for: the row count shrank. Someone is on page 7, they filter
 * the list down to 12 rows, and page 7 no longer exists — without clamping they get a
 * blank table and no clue why. Clamped, they land on the last page that has rows.
 */
export function clampPage(page: number, total: number, pageSize: number): number {
	return Math.min(Math.max(1, Math.trunc(page)), pageCount(total, pageSize))
}

/** The slice of rows on a page. Clamps the page first, so it can never return nothing. */
export function pageSlice<TRow>(rows: readonly TRow[], page: number, pageSize: number): TRow[] {
	if (pageSize <= 0) {
		return [...rows]
	}

	const safePage = clampPage(page, rows.length, pageSize)
	const start = (safePage - 1) * pageSize

	return rows.slice(start, start + pageSize)
}

/**
 * Which rows a page covers, for the "21–40 of 137" readout.
 *
 * Zeroes for an empty list rather than `1–0 of 0`, which is what the naive arithmetic
 * produces and which reads as a rendering fault.
 */
export function pageRange(total: number, page: number, pageSize: number): PageRange {
	if (total === 0 || pageSize <= 0) {
		return { first: 0, last: total, total }
	}

	const safePage = clampPage(page, total, pageSize)
	const first = (safePage - 1) * pageSize + 1

	return { first, last: Math.min(safePage * pageSize, total), total }
}
