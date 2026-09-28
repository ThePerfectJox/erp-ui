/**
 * Which rows are ticked.
 *
 * The defining interaction of an ERP list report: pick some rows, then act on them from
 * a toolbar. Everything here is about making the header checkbox behave the way people
 * expect, which turns out to be the only fiddly part.
 */

import { useState } from 'react'
import type { TableSelectionMode } from '../core/types'

export interface TableSelectionApi {
	/** Row ids currently ticked. */
	selectedIds: ReadonlySet<string>

	/** Whether any rows are selectable at all. */
	isEnabled: boolean

	isSelected: (rowId: string) => boolean

	/** Ticks or unticks one row, honouring `"single"` mode. */
	toggleRow: (rowId: string) => void

	/** True when every selectable row is ticked. Drives the header checkbox. */
	isAllSelected: boolean

	/** True when some but not all are ticked. Drives its indeterminate state. */
	isPartiallySelected: boolean

	/** Ticks everything, or clears everything if it is all already ticked. */
	toggleAll: () => void
}

interface UseTableSelectionOptions {
	mode: TableSelectionMode

	/**
	 * The ids of the rows on screen, in display order.
	 *
	 * Deliberately the **visible** rows, not every row the caller holds. So "select all"
	 * on a paginated table selects the page, which is what the checkbox sitting at the
	 * top of that page appears to promise. A control that silently selected 3,000 rows
	 * the user cannot see is how people delete things by accident.
	 */
	visibleRowIds: readonly string[]

	/** Controlled selection. */
	selectedRowIds?: readonly string[]

	onSelectionChange?: (rowIds: string[]) => void
}

export function useTableSelection({
	mode,
	visibleRowIds,
	selectedRowIds,
	onSelectionChange,
}: UseTableSelectionOptions): TableSelectionApi {
	const [uncontrolledIds, setUncontrolledIds] = useState<readonly string[]>([])

	const isControlled = selectedRowIds !== undefined
	const isEnabled = mode !== 'none'

	const selectedIds = new Set(isControlled ? selectedRowIds : uncontrolledIds)

	const publish = (next: string[]) => {
		if (!isControlled) {
			setUncontrolledIds(next)
		}

		onSelectionChange?.(next)
	}

	/* Counted against the visible rows rather than the whole selection, so a selection
	 * carried over from a previous page does not make this page's header checkbox claim
	 * everything is ticked. */
	const selectedVisibleCount = visibleRowIds.filter(rowId => selectedIds.has(rowId)).length
	const isAllSelected = visibleRowIds.length > 0 && selectedVisibleCount === visibleRowIds.length

	return {
		selectedIds,
		isEnabled,
		isAllSelected,

		/* Strictly between none and all. A header checkbox that was indeterminate *and*
		 * checked would be showing two states at once. */
		isPartiallySelected: selectedVisibleCount > 0 && !isAllSelected,

		isSelected: rowId => selectedIds.has(rowId),

		toggleRow: rowId => {
			if (!isEnabled) {
				return
			}

			/* Single mode replaces rather than adds — and clicking the ticked row clears
			 * it, so a required choice can still be undone. Radio buttons cannot normally
			 * be unset, which is exactly the trap `RadioGroup` documents; here the row is
			 * a filter rather than an answer, so being able to clear it matters. */
			if (mode === 'single') {
				publish(selectedIds.has(rowId) ? [] : [rowId])
				return
			}

			const next = new Set(selectedIds)

			if (next.has(rowId)) {
				next.delete(rowId)
			} else {
				next.add(rowId)
			}

			/* Ordered by the rows on screen rather than by click order, so the array is
			 * stable between renders and comparable. */
			publish(visibleRowIds.filter(candidate => next.has(candidate)))
		},

		toggleAll: () => {
			if (mode !== 'multiple') {
				return
			}

			/* Partially selected clears to none rather than filling to all. Both readings
			 * are defensible; this one is safer, because the destructive mistake is acting
			 * on more rows than intended, never on fewer. */
			publish(isAllSelected || selectedVisibleCount > 0 ? [] : [...visibleRowIds])
		},
	}
}
