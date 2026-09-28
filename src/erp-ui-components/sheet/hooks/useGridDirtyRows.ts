/**
 * The dirty set, controlled or uncontrolled.
 *
 * One small hook rather than a pair of branches inside the component, because
 * "may or may not be controlled" is the kind of thing that ends up half-handled:
 * somewhere a `setState` runs on a controlled prop, the parent never hears about
 * it, and the marks disagree with what a save is about to send.
 */

import { useState } from 'react'
import type { GridDirtyRows, RowChangeKind } from '../core/types'

export interface GridDirtyRowsApi {
	/** The set in force, whichever side owns it. */
	dirtyRows: GridDirtyRows

	/**
	 * Records the next set. Writes to internal state only while uncontrolled, and
	 * always notifies the parent.
	 */
	publish: (next: Map<string, RowChangeKind>) => void
}

interface UseGridDirtyRowsOptions {
	/** Supplied means controlled: the parent owns the set. */
	dirtyRows?: GridDirtyRows
	onDirtyRowsChange?: (dirtyRows: Map<string, RowChangeKind>) => void
}

export function useGridDirtyRows({ dirtyRows, onDirtyRowsChange }: UseGridDirtyRowsOptions): GridDirtyRowsApi {
	/** Only used while `dirtyRows` is not supplied. */
	const [internalDirtyRows, setInternalDirtyRows] = useState<Map<string, RowChangeKind>>(new Map())

	const isControlled = dirtyRows !== undefined

	return {
		dirtyRows: dirtyRows ?? internalDirtyRows,

		publish: next => {
			/* Skipped when controlled. Setting internal state as well would give
			 * the grid a second copy of the truth that the parent cannot clear, so
			 * a save that resets the marks would leave them on screen. */
			if (!isControlled) {
				setInternalDirtyRows(next)
			}

			onDirtyRowsChange?.(next)
		},
	}
}
