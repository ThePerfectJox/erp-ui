import { useEffect, useRef } from 'react'
import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldBaseProps, PassthroughInputProps } from './FieldTypes'

interface CheckboxProps extends FieldBaseProps, Omit<PassthroughInputProps, 'checked' | 'defaultChecked'> {
	checked?: boolean
	defaultChecked?: boolean

	/**
	 * The third state: neither on nor off. For a "select all" box sitting over
	 * a partly selected list.
	 *
	 * HTML has no attribute for this — it is a DOM property only — so it is set
	 * on the element after render. Clicking an indeterminate box turns it on;
	 * the browser never cycles back into this state, so whatever set it is
	 * responsible for clearing it.
	 */
	isIndeterminate?: boolean
}

/**
 * A single on/off box, captioned on the right.
 *
 * ```tsx
 * <Checkbox
 *     label="Delivery completed"
 *     checked={isComplete}
 *     onChange={event => setIsComplete(event.target.checked)}
 * />
 * ```
 *
 * Write the label as the state when it is ticked — "Delivery completed", not
 * "Delivery status" — because that is how it will be read out: "Delivery
 * completed, checkbox, not checked".
 *
 * For several related boxes use `<CheckboxGroup>`, which puts one caption over
 * the set. For one either/or choice use `<Switch>` if it takes effect
 * immediately, or this if it is saved with the rest of the form.
 */
function Checkbox({ isIndeterminate, ...props }: CheckboxProps) {
	const [field, nativeProps] = splitFieldProps(props)
	const { fieldProps, controlProps } = useFormField(field)

	const inputRef = useRef<HTMLInputElement>(null)

	/* `indeterminate` exists only as a DOM property, so React cannot set it
	 * from JSX and it has to be written after every render — including the
	 * renders where it goes back to false, or a box that was indeterminate
	 * would stay that way. */
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.indeterminate = Boolean(isIndeterminate)
		}
	}, [isIndeterminate])

	/* `readOnly` does nothing on a checkbox — the browser ignores it and the
	 * box stays clickable — so read-only is enforced by disabling the control
	 * and keeping the value in a hidden input, which is what actually submits.
	 * The styling stays distinct from disabled via the form-field-readonly
	 * class that FormField puts on the wrapper. */
	const { readOnly, ...checkboxProps } = controlProps
	const isCheckedForSubmit = nativeProps.checked ?? nativeProps.defaultChecked

	return (
		<FormField {...fieldProps} variant="inline">
			<input
				{...nativeProps}
				{...checkboxProps}
				ref={inputRef}
				type="checkbox"
				className="form-checkbox"
				disabled={checkboxProps.disabled || readOnly}
				aria-readonly={readOnly ? true : undefined}
			/>
			{readOnly && isCheckedForSubmit && controlProps.name && (
				<input type="hidden" name={controlProps.name} value="on" />
			)}
		</FormField>
	)
}

export default Checkbox
