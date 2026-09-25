import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldBaseProps, PassthroughInputProps } from './FieldTypes'

interface SwitchProps extends FieldBaseProps, Omit<PassthroughInputProps, 'checked' | 'defaultChecked'> {
	checked?: boolean
	defaultChecked?: boolean
}

/**
 * An on/off switch, captioned on the right.
 *
 * ```tsx
 * <Switch
 *     label="Automatic goods receipt posting"
 *     checked={isAutoPosting}
 *     onChange={event => setIsAutoPosting(event.target.checked)}
 *     hint="Posts the receipt as soon as the delivery is confirmed."
 * />
 * ```
 *
 * Switch or checkbox? The useful distinction is *when it takes effect*. A
 * switch reads as something that is now on — use it for a setting that applies
 * straight away. A checkbox reads as something you have marked — use it for a
 * value that is saved when the form is saved. Both are a native
 * `<input type="checkbox">` underneath, so a screen reader announces this as a
 * checkbox; the difference is what the user understands from it, which is
 * exactly why it should not be picked on looks.
 *
 * Label it with the thing being switched, not with the state: "Automatic goods
 * receipt posting", not "Enable automatic posting" and not "On".
 */
function Switch(props: SwitchProps) {
	const [field, nativeProps] = splitFieldProps(props)
	const { fieldProps, controlProps } = useFormField(field)

	/* Same as Checkbox: the browser ignores `readOnly` on a checkbox, so
	 * read-only has to disable the input and submit through a hidden field.
	 * The wrapper still gets form-field-readonly, so it is styled as
	 * "unchangeable" rather than as "unavailable". */
	const { readOnly, ...switchProps } = controlProps
	const isCheckedForSubmit = nativeProps.checked ?? nativeProps.defaultChecked

	/* Appended rather than assigned: `fieldProps.className` is whatever the
	 * caller passed, and overwriting it here would silently swallow it. */
	const wrapperClassName = fieldProps.className
		? `form-field-switch ${fieldProps.className}`
		: 'form-field-switch'

	return (
		<FormField {...fieldProps} variant="inline" className={wrapperClassName}>
			<span className="form-switch">
				<input
					{...nativeProps}
					{...switchProps}
					type="checkbox"
					className="form-switch-input"
					disabled={switchProps.disabled || readOnly}
					aria-readonly={readOnly ? true : undefined}
				/>
				{/* The track and the knob. Decorative: everything a screen
				  * reader needs is on the input behind it. */}
				<span className="form-switch-track" aria-hidden="true">
					<span className="form-switch-knob" />
				</span>
			</span>
			{readOnly && isCheckedForSubmit && controlProps.name && (
				<input type="hidden" name={controlProps.name} value="on" />
			)}
		</FormField>
	)
}

export default Switch
