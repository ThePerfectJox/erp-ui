import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldBaseProps, FieldOption, PassthroughSelectProps } from './FieldTypes'

interface SelectProps extends FieldBaseProps, PassthroughSelectProps {
	/** The choices, in the order they should appear. */
	options: readonly FieldOption[]

	/**
	 * Shown as the first entry while nothing is chosen, and not selectable once
	 * the user moves off it. Without one a `<select>` silently starts on its
	 * first option, which on a required field means the user "chose" something
	 * they never looked at.
	 *
	 * Write it as an instruction — "Select a plant" — not as a fake value.
	 */
	placeholder?: string
}

/**
 * A dropdown, backed by a native `<select>`.
 *
 * ```tsx
 * <Select
 *     label="Plant"
 *     placeholder="Select a plant"
 *     options={[
 *         { value: '1000', label: '1000 — Hamburg' },
 *         { value: '2000', label: '2000 — Rotterdam' },
 *         { value: '3000', label: '3000 — Singapore', isDisabled: true },
 *     ]}
 *     value={plant}
 *     onChange={event => setPlant(event.target.value)}
 *     isRequired
 * />
 * ```
 *
 * Native on purpose. A custom dropdown has to reimplement type-ahead, keyboard
 * paging, the mobile picker and every screen reader's idea of a listbox, and
 * usually gets one of them wrong. Reach for a custom control when you need
 * multi-select tokens or server-side search — and treat that as a different
 * component, not a flag on this one.
 */
function Select({ options, placeholder, ...props }: SelectProps) {
	const [field, nativeProps] = splitFieldProps(props)
	const { fieldProps, controlProps } = useFormField(field)

	/* `readOnly` is not a valid attribute on <select>, so it is pulled off
	 * before the rest is spread — React would warn about it on the DOM node —
	 * and expressed as `aria-readonly` plus the narrowing below. */
	const { readOnly, ...selectProps } = controlProps

	const currentValue = nativeProps.value ?? nativeProps.defaultValue

	/* Read-only keeps a real, focusable, submitting <select> but leaves only
	 * the chosen option in it, so there is nothing to change. Disabling it
	 * instead would drop the value from the submitted form and skip the field
	 * in keyboard navigation — the user could not even read it. */
	const visibleOptions =
		readOnly && currentValue !== undefined
			? options.filter(option => option.value === String(currentValue))
			: options

	return (
		<FormField {...fieldProps}>
			<div className="form-select-shell">
				<select
					{...nativeProps}
					{...selectProps}
					className="form-control form-select"
					aria-readonly={readOnly ? true : undefined}
				>
					{placeholder !== undefined && (
						/* Empty value so a required select counts it as "nothing
						 * chosen"; disabled so it cannot be picked on purpose;
						 * still rendered while read-only when nothing was ever
						 * chosen, otherwise the field would be blank with no
						 * explanation. */
						<option value="" disabled>
							{placeholder}
						</option>
					)}
					{visibleOptions.map(option => (
						<option key={option.value} value={option.value} disabled={option.isDisabled}>
							{option.label}
						</option>
					))}
				</select>
				{/* The chevron. A <select> cannot be given one through CSS
				  * alone on every browser, so it is a separate element and the
				  * select is padded to leave room for it. */}
				<span className="form-select-chevron" aria-hidden="true" />
			</div>
		</FormField>
	)
}

export default Select
