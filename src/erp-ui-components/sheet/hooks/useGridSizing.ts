/**
 * Column widths, row heights, and the drags that change them.
 *
 * Sizes live in the grid's own state, so they are per-session: reloading the
 * screen brings the declared widths back. Lift this hook's state out if they need
 * to outlive that.
 *
 * The arithmetic is in `core/gridSizing.ts`, including the reason every column
 * has a definite width rather than flexing — which is what makes a drag here
 * change the *total* width, and so what makes the grid scroll sideways instead of
 * redistributing the space among its other columns.
 */

import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { measureTableWidth, resizeTo, resolveColumnWidth, resolveRowHeight } from '../core/gridSizing'
import type { GridColumn, ResizeAxis } from '../core/types'

/** Everything a resize handle needs on its DOM node. Spread it. */
export interface ResizeGestureProps {
	onPointerDown: (event: PointerEvent<HTMLElement>) => void
	onPointerMove: (event: PointerEvent<HTMLElement>) => void
	onPointerUp: (event: PointerEvent<HTMLElement>) => void
	onPointerCancel: (event: PointerEvent<HTMLElement>) => void
	onDoubleClick: () => void
}

export interface GridSizingApi {
	getColumnWidth: (column: GridColumn) => number
	getRowHeight: (rowId: string) => number

	/** The row gutter plus every column. What the `<table>` gets as its width. */
	tableWidth: number

	/**
	 * Handlers for one handle.
	 *
	 * @param currentSize Where the drag starts from. Always known, because every
	 *                    column and row has a definite size — no measuring the
	 *                    laid-out element, which is what a flexible column used to
	 *                    require and what made a drag on a narrow container snap.
	 */
	getResizeProps: (axis: ResizeAxis, key: string, currentSize: number) => ResizeGestureProps
}

interface UseGridSizingOptions {
	columns: readonly GridColumn[]
	gutterWidth: number
	defaultColumnWidth: number
	defaultRowHeight: number
	minColumnWidth: number
	minRowHeight: number
}

/** The live drag. A ref, not state — see the note in the hook. */
interface ResizeDrag {
	axis: ResizeAxis
	key: string

	/** Pointer position when the drag started, on the axis being dragged. */
	origin: number

	startSize: number
}

export function useGridSizing({
	columns,
	gutterWidth,
	defaultColumnWidth,
	defaultRowHeight,
	minColumnWidth,
	minRowHeight,
}: UseGridSizingOptions): GridSizingApi {
	const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
	const [rowHeights, setRowHeights] = useState<Record<string, number>>({})

	/* A ref, because it changes continuously during a drag and nothing rendered
	 * reads it — as state it would re-render the whole grid once per pixel of
	 * pointer movement, on top of the width update that has to happen anyway. */
	const dragRef = useRef<ResizeDrag | null>(null)

	const dropOverride = (axis: ResizeAxis, key: string) => {
		const without = (current: Record<string, number>) => {
			const next = { ...current }

			delete next[key]

			return next
		}

		if (axis === 'column') {
			setColumnWidths(without)
		} else {
			setRowHeights(without)
		}
	}

	return {
		getColumnWidth: column => resolveColumnWidth(column, columnWidths, defaultColumnWidth),

		getRowHeight: rowId => resolveRowHeight(rowId, rowHeights, defaultRowHeight),

		tableWidth: measureTableWidth(columns, columnWidths, defaultColumnWidth, gutterWidth),

		getResizeProps: (axis, key, currentSize) => ({
			onPointerDown: event => {
				event.preventDefault()

				/* The handle sits inside a header or the row gutter; without this the
				 * press can also read as the start of a selection gesture. */
				event.stopPropagation()

				/* Pointer capture rather than window listeners: the browser routes
				 * every subsequent move and the release to the handle itself, so the
				 * drag survives the pointer leaving the element — or the window — and
				 * there is no listener to leak if the component unmounts mid-gesture. */
				event.currentTarget.setPointerCapture(event.pointerId)

				dragRef.current = {
					axis,
					key,
					origin: axis === 'column' ? event.clientX : event.clientY,
					startSize: currentSize,
				}
			},

			onPointerMove: event => {
				const drag = dragRef.current

				if (!drag) {
					return
				}

				const position = drag.axis === 'column' ? event.clientX : event.clientY
				const floor = drag.axis === 'column' ? minColumnWidth : minRowHeight
				const nextSize = resizeTo(drag.startSize, position - drag.origin, floor)

				if (drag.axis === 'column') {
					setColumnWidths(current => ({ ...current, [drag.key]: nextSize }))
				} else {
					setRowHeights(current => ({ ...current, [drag.key]: nextSize }))
				}
			},

			onPointerUp: event => {
				dragRef.current = null
				event.currentTarget.releasePointerCapture(event.pointerId)
			},

			/* The OS can take the pointer away mid-drag — a touch turning into a
			 * scroll, the window losing focus. Without this the drag stays open and
			 * the next unrelated move over the handle resizes the column. */
			onPointerCancel: event => {
				dragRef.current = null
				event.currentTarget.releasePointerCapture(event.pointerId)
			},

			/* Double-click returns the column or row to its declared size, which for
			 * a column with no `width` of its own means `defaultColumnWidth`. */
			onDoubleClick: () => dropOverride(axis, key),
		}),
	}
}
