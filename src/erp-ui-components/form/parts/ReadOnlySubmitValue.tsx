interface ReadOnlySubmitValueProps {
	/** Whether the control is read-only. Nothing is rendered otherwise. */
	isReadOnly: boolean

	/** The field name. Nothing is rendered without one — there is nothing to submit under. */
	name: string | undefined

	/** Whether there is a value to submit at all. */
	hasValue: boolean | undefined

	/** What to submit. `"on"` is what a checked checkbox sends. */
	value?: string
}

/**
 * Keeps a read-only checkable control's value in the submitted form.
 *
 * -----------------------------------------------------------------------------
 * The problem it solves
 * -----------------------------------------------------------------------------
 * `readOnly` does nothing on a checkbox — the browser accepts the attribute and
 * leaves the box fully clickable. So the only way to actually stop the click is
 * `disabled`, and a disabled control is **not submitted**. Read-only is supposed to
 * mean "you can see this value and it is part of the record, you just cannot change
 * it here"; silently dropping it from the POST turns it into "this value does not
 * exist", which is a data-loss bug rather than a styling one.
 *
 * A hidden input with the same name puts it back.
 *
 * `Checkbox` and `Switch` both need this and both had it inlined, character for
 * character. Two copies of a four-line guard is not much duplication, but it is
 * duplication of something subtle enough that nobody would notice one of them
 * losing its `name` check.
 */
function ReadOnlySubmitValue({ isReadOnly, name, hasValue, value = 'on' }: ReadOnlySubmitValueProps) {
	if (!isReadOnly || !name || !hasValue) {
		return null
	}

	return <input type="hidden" name={name} value={value} />
}

export default ReadOnlySubmitValue
