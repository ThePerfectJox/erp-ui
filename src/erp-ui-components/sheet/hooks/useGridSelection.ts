/**
 * What is selected, and the gestures that change it.
 *
 * -----------------------------------------------------------------------------
 * Range selection is *armed*, not automatic
 * -----------------------------------------------------------------------------
 * A press on a cell selects that one cell. Dragging afterwards does nothing
 * until range selection has been **armed**, which happens two ways:
 *
 * - **Shift.** Shift+click extends from the existing anchor. Intent is explicit,
 *   so the drag is live immediately.
 * - **Holding still.** Press and keep the button down for
 *   {@link RANGE_ARMING_DELAY_MS}, and the range arms under the cursor.
 *
 * The alternative — arming on mouse-down, the way most grids do — is what makes
 * a spreadsheet feel twitchy in a form. Cells here are 30px tall and a few
 * millimetres of hand movement while clicking is normal, so every single click
 * risks becoming a 1 × 2 selection. Worse, it collides with the *other* thing
 * pressing a cell means, which is "put the cursor here so I can type".
 *
 * Arming is also the fix for a concrete bug: the drag flag used to be raised on
 * mouse-down and never lowered, because nothing was listening for the release.
 * After one click anywhere in the grid, every later mouse movement extended the
 * selection — the grid behaved as though the button were permanently held. The
 * release listener is on `window` rather than the grid for exactly that reason:
 * a button let go outside the table, over the page or another window, still has
 * to disarm.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, RefObject } from 'react'
import { clampAddress, toRange } from '../core/gridSelection'
import type { CellAddress, CellRange, CellSelection } from '../core/gridSelection'

/**
 * How long a press has to be held before dragging extends the selection.
 *
 * 250ms is roughly the shortest hold that reads as deliberate. Under about
 * 200ms it starts catching ordinary clicks; much over 300ms and the grid feels
 * like it is ignoring you.
 */
export const RANGE_ARMING_DELAY_MS = 250

export interface GridSelectionApi {
	/** The live selection, anchor and focus, or `null` when nothing is selected. */
	selection: CellSelection | null

	/** The same thing normalised into a rectangle. `null` when nothing is selected. */
	range: CellRange | null

	/** True while dragging would extend the selection. Drives the cursor. */
	isRangeArmed: boolean

	/**
	 * Moves the selection, or extends it if `isExtending`. Clamps to the grid and
	 * moves DOM focus onto the target cell.
	 */
	select: (address: CellAddress, isExtending: boolean) => void

	selectAll: () => void

	/** Sets the whole selection at once. Used by paste, to cover what it wrote. */
	replace: (selection: CellSelection) => void

	/** Deselects everything. Stable, so it can be handed to an event listener. */
	clear: () => void

	handleCellMouseDown: (event: MouseEvent<HTMLElement>, address: CellAddress) => void

	handleCellMouseEnter: (address: CellAddress) => void
}

interface UseGridSelectionOptions {
	rowCount: number
	columnCount: number

	/** The scrollport, searched for the cell to focus. */
	scrollRef: RefObject<HTMLElement | null>

	/** Overridable for testing, and for a caller who wants a different feel. */
	armingDelay?: number
}

export function useGridSelection({
	rowCount,
	columnCount,
	scrollRef,
	armingDelay = RANGE_ARMING_DELAY_MS,
}: UseGridSelectionOptions): GridSelectionApi {
	const [selection, setSelection] = useState<CellSelection | null>(null)

	/* State rather than a ref, because the cursor changes when it flips — a ref
	 * would arm the behaviour without showing that it had. */
	const [isRangeArmed, setIsRangeArmed] = useState(false)

	const armingTimerRef = useRef<number | null>(null)

	/**
	 * The cell the pointer is over, kept current whether or not anything is
	 * armed.
	 *
	 * Needed because the hold can finish somewhere other than where it started:
	 * press, drift two cells while waiting, and the range should arm covering the
	 * cell now under the cursor rather than waiting for one more movement.
	 */
	const hoveredCellRef = useRef<CellAddress | null>(null)

	const range = useMemo(() => (selection ? toRange(selection) : null), [selection])

	const cancelArming = useCallback(() => {
		if (armingTimerRef.current !== null) {
			window.clearTimeout(armingTimerRef.current)
			armingTimerRef.current = null
		}
	}, [])

	/**
	 * Lowers the drag flag whenever the button comes up, wherever that happens.
	 *
	 * Capture phase and on `window`, so nothing between the cell and here can
	 * swallow it — a release that goes unnoticed leaves the grid convinced the
	 * button is still down, which is the bug this replaces.
	 *
	 * `blur` covers the release the browser never reports: alt-tab away
	 * mid-gesture and the mouse-up lands in another window entirely.
	 */
	useEffect(() => {
		const disarm = () => {
			cancelArming()
			setIsRangeArmed(false)
		}

		window.addEventListener('mouseup', disarm, true)
		window.addEventListener('blur', disarm)

		return () => {
			window.removeEventListener('mouseup', disarm, true)
			window.removeEventListener('blur', disarm)

			/* A pending timer would fire into an unmounted component. */
			cancelArming()
		}
	}, [cancelArming])

	const select = useCallback(
		(address: CellAddress, isExtending: boolean) => {
			if (rowCount === 0 || columnCount === 0) {
				return
			}

			const next = clampAddress(address, rowCount, columnCount)

			setSelection(current =>
				/* Extending keeps the original anchor, which is what lets
				 * shift+click and shift+arrow both grow from where the selection
				 * started rather than from wherever it currently ends. */
				isExtending && current ? { anchor: current.anchor, focus: next } : { anchor: next, focus: next }
			)

			/* Focus and reveal by hand rather than in an effect. Doing it here ties
			 * it to the gesture that caused it, so focus is never yanked around by
			 * an unrelated re-render — and `preventScroll` avoids the browser's own
			 * centre-the-element jump, which is jarring in a long grid. */
			const cell = scrollRef.current?.querySelector<HTMLElement>(
				`[data-row="${next.row}"][data-column="${next.column}"]`
			)

			cell?.focus({ preventScroll: true })
			cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
		},
		[rowCount, columnCount, scrollRef]
	)

	const clear = useCallback(() => {
		setSelection(null)
		cancelArming()
		setIsRangeArmed(false)
	}, [cancelArming])

	const handleCellMouseDown = (event: MouseEvent<HTMLElement>, address: CellAddress) => {
		/* Right-click opens the context menu on whatever is already selected,
		 * rather than moving the selection out from under the user first. */
		if (event.button !== 0) {
			return
		}

		/* Stops the browser turning a press-and-drag across cells into a text
		 * selection, which would fight the range highlight and put the wrong thing
		 * on the clipboard. Focus is moved explicitly by `select` instead. */
		event.preventDefault()

		hoveredCellRef.current = address
		cancelArming()

		if (event.shiftKey) {
			setIsRangeArmed(true)
			select(address, true)
			return
		}

		setIsRangeArmed(false)
		select(address, false)

		armingTimerRef.current = window.setTimeout(() => {
			armingTimerRef.current = null
			setIsRangeArmed(true)

			/* Catch up with wherever the pointer drifted to during the hold. Same
			 * cell as the press is the normal case, and extending to it is a no-op. */
			const hovered = hoveredCellRef.current

			if (hovered) {
				select(hovered, true)
			}
		}, armingDelay)
	}

	const handleCellMouseEnter = (address: CellAddress) => {
		hoveredCellRef.current = address

		/* Armed only ever means "the button is down and the user asked for a
		 * range" — the window listener above guarantees it is lowered on release,
		 * so a hover with no button held can never extend anything. */
		if (isRangeArmed) {
			select(address, true)
		}
	}

	return {
		selection,
		range,
		isRangeArmed,
		select,
		clear,
		handleCellMouseDown,
		handleCellMouseEnter,

		selectAll: () => {
			if (rowCount === 0 || columnCount === 0) {
				return
			}

			setSelection({ anchor: { row: 0, column: 0 }, focus: { row: rowCount - 1, column: columnCount - 1 } })
		},

		replace: next => setSelection(next),
	}
}
