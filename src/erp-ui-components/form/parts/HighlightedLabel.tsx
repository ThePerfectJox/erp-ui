import { findMatchRange } from '../core/comboBoxMatching'

interface HighlightedLabelProps {
	label: string

	/** The filter text, or `null` when nothing has been typed. */
	query: string | null
}

/**
 * A label with the matched run of characters marked.
 *
 * Shows *why* a row is in a filtered list. In forty plant codes that all look
 * alike, that is the difference between reading and scanning.
 *
 * `<mark>` rather than a `<span>`: it means "relevant to the user's current
 * activity", which is exactly this. Its default yellow block is restyled in the
 * combobox stylesheet, which keeps the highlight tint and carries the emphasis with
 * weight instead — a yellow block inside a blue-tinted active row is two
 * highlights fighting.
 *
 * The arithmetic is in `core/comboBoxMatching`; this is only the element. That
 * split is why the "matched on the value rather than the label, so there is nothing
 * to mark" case is testable without rendering anything.
 */
function HighlightedLabel({ label, query }: HighlightedLabelProps) {
	const range = query === null ? null : findMatchRange(label, query)

	if (!range) {
		return <>{label}</>
	}

	return (
		<>
			{label.slice(0, range.start)}
			<mark className="form-combobox-match">{label.slice(range.start, range.end)}</mark>
			{label.slice(range.end)}
		</>
	)
}

export default HighlightedLabel
