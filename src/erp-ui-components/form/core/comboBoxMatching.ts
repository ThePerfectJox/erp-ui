/**
 * The two decisions a searchable dropdown makes that have nothing to do with
 * React: which options survive the filter, and which one an arrow key moves to.
 *
 * Both were buried in the middle of a 545-line component. They are the parts most
 * worth getting right and the easiest to reason about in isolation — a wrapping
 * index search with disabled rows in it has more edge cases than the rest of the
 * component put together.
 */

import type { FieldOption } from './types'

/** Decides whether an option survives the filter text. Return `true` to keep it. */
export type ComboBoxFilter = (option: FieldOption, query: string) => boolean

/**
 * Case-insensitive substring match on the label *and* the value.
 *
 * Matching the value matters more than it looks. ERP options are usually
 * `"1000 — Hamburg"`, and whoever is filling the form often knows the code but
 * not the name, or the other way round. Matching both means typing `1000` and
 * typing `ham` land on the same row.
 *
 * Substring rather than prefix, for the same reason: `"Hamburg"` has to be
 * reachable in a list where every label starts with its plant number.
 */
export const matchLabelOrValue: ComboBoxFilter = (option, query) => {
	const needle = query.trim().toLowerCase()

	if (needle === '') {
		return true
	}

	return option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle)
}

/**
 * First selectable option at or after `start`, stepping by `step` and wrapping at
 * both ends.
 *
 * Returns `-1` when every option is disabled, which is the case that matters: the
 * loop is bounded by the list length rather than running until it finds something,
 * so arrowing through a fully disabled list stops instead of spinning forever.
 *
 * @param step `1` to search forwards, `-1` backwards.
 */
export function findSelectableIndex(options: readonly FieldOption[], start: number, step: number): number {
	const count = options.length

	if (count === 0) {
		return -1
	}

	for (let offset = 0; offset < count; offset += 1) {
		/* The double modulo is what makes a negative index wrap to the end of the
		 * list: in JavaScript -1 % 5 is -1, not 4. */
		const index = (((start + step * offset) % count) + count) % count

		if (!options[index].isDisabled) {
			return index
		}
	}

	return -1
}

/**
 * Where a matched run of characters starts in a label, or `-1`.
 *
 * Separated from the rendering so the arithmetic can be read on its own. `-1`
 * covers the real case, not an error: the option may have matched on its *value*
 * rather than its label, in which case there is nothing in the label to mark.
 */
export function findMatchRange(label: string, query: string): { start: number; end: number } | null {
	const needle = query.trim()

	if (needle === '') {
		return null
	}

	const start = label.toLowerCase().indexOf(needle.toLowerCase())

	if (start === -1) {
		return null
	}

	return { start, end: start + needle.length }
}
