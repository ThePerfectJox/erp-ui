import { useEffect, useRef } from 'react'
import type { TableSelectionMode } from '../core/types'

interface TableSelectCellProps {
	mode: Exclude<TableSelectionMode, 'none'>

	isChecked: boolean

	/**
	 * The header's third state: some rows ticked, but not all.
	 *
	 * A DOM property with no HTML attribute, so it has to be written after render — see
	 * the effect below. Body rows never use it.
	 */
	isIndeterminate?: boolean

	/**
	 * The accessible name. Required, and it has to say *which* row.
	 *
	 * A column of forty checkboxes all announced as "checkbox" is unusable: the row's
	 * text is in sibling cells, and nothing ties it to the control. `"Select order
	 * 4500001827"` is the difference between a usable table and a decorative one.
	 */
	label: string

	/** Renders a `<th>` instead of a `<td>`, for the select-all in the header row. */
	isHeader?: boolean

	onToggle: () => void
}

/**
 * The checkbox (or radio) in the selection column.
 *
 * A **native** control tinted with `accent-color`, not the form folder's custom-drawn
 * `.form-checkbox`. Borrowing that class was the first thing I tried and it is a trap: it
 * would make `ViewTable` silently depend on `Form.css` being loaded, so a screen that
 * imports only this folder gets an unstyled checkbox and no error to explain why.
 *
 * `accent-color` gets the brand tick in four lines of CSS with no duplication and no
 * coupling. The form's control is drawn by hand because a field's fill and underline have
 * to match every other field on the screen; a row selector has no such obligation.
 */
function TableSelectCell({ mode, isChecked, isIndeterminate, label, isHeader, onToggle }: TableSelectCellProps) {
	const inputRef = useRef<HTMLInputElement>(null)

	/* `indeterminate` exists only as a DOM property, so React cannot set it from JSX and
	 * it has to be written after every render — including the renders where it goes back
	 * to false, or a header that was partially selected would stay that way. */
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.indeterminate = Boolean(isIndeterminate)
		}
	}, [isIndeterminate])

	const control = (
		<input
			ref={inputRef}
			type={mode === 'single' ? 'radio' : 'checkbox'}
			className="table-select-control"
			checked={isChecked}
			aria-label={label}
			onChange={onToggle}
			/* The row also toggles on click, and that click bubbles from here. Without this
			 * the two handlers would both fire and cancel each other out, so ticking a box
			 * would appear to do nothing at all. */
			onClick={event => event.stopPropagation()}
		/>
	)

	if (isHeader) {
		/* No `scope`: this cell heads neither a row nor a column, it holds a control. */
		return <th className="table-select-cell">{control}</th>
	}

	return <td className="table-select-cell">{control}</td>
}

export default TableSelectCell
