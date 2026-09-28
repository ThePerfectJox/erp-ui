/**
 * Notices a press that landed outside an element.
 *
 * `DataGrid` uses it to deselect: pressing anywhere else on the screen has to
 * clear the selection, or the grid keeps a highlighted range and a focus ring long
 * after the user has moved on to another field — and `Ctrl+C` from over there
 * would still copy cells.
 *
 * It lives in `shared/` rather than next to the grid because there is nothing
 * grid-shaped about it. It is the same primitive a dropdown, a popover or a
 * colour picker needs, and three copies of this listener with three subtly
 * different `contains` checks is how "click away to close" ends up working in some
 * places and not others.
 */

import { useEffect } from 'react'
import type { RefObject } from 'react'

/**
 * @param ref       The element presses are considered "inside".
 * @param onOutside Fired on a press anywhere else. Must be stable — wrap it in
 *                  `useCallback`, or the listener is torn down and rebuilt on
 *                  every render of the host component.
 * @param isEnabled Skips the listener entirely when false. Cheaper than
 *                  attaching one that returns straight away, and it makes
 *                  "only while something is selected" expressible.
 */
export function useOutsidePointerDown(
	ref: RefObject<HTMLElement | null>,
	onOutside: () => void,
	isEnabled = true
): void {
	useEffect(() => {
		if (!isEnabled) {
			return
		}

		const handlePointerDown = (event: PointerEvent) => {
			const element = ref.current

			if (!element) {
				return
			}

			const target = event.target

			/* Not a Node when the press came from outside the document — a browser
			 * extension's overlay, say. Treated as outside, which is what it is. */
			if (target instanceof Node && element.contains(target)) {
				return
			}

			onOutside()
		}

		/* `pointerdown`, not `click`: the selection should go the moment the user
		 * presses elsewhere, not when they release. A drag that starts outside and
		 * ends inside the grid would never fire `click` at all.
		 *
		 * Capture phase, so a handler that calls `stopPropagation` — a menu, a
		 * modal's backdrop — cannot stop the grid from hearing about it. */
		document.addEventListener('pointerdown', handlePointerDown, true)

		return () => document.removeEventListener('pointerdown', handlePointerDown, true)
	}, [ref, onOutside, isEnabled])
}
