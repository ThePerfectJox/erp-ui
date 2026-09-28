import { classNames } from '../../shared/classNames'
import { extractReadOnly, splitFieldProps } from '../core/fieldProps'
import type { FieldBaseProps, PassthroughInputProps } from '../core/types'
import { useFormField } from '../hooks/useFormField'
import FormField from '../parts/FormField'
import ReadOnlySubmitValue from '../parts/ReadOnlySubmitValue'

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

	/* Same as Checkbox: the browser ignores `readOnly` on a checkbox, so read-only
	 * has to disable the input and submit through a hidden field. */
	const [switchProps, isReadOnly] = extractReadOnly(controlProps)

	return (
		<FormField
			{...fieldProps}
			variant="inline"
			/* The only control that needs its own wrapper class. Appended rather than
			 * assigned, so the caller's className survives. */
			className={classNames('form-field-switch', fieldProps.className)}
		>
			<span className="form-switch">
				<input
					{...nativeProps}
					{...switchProps}
					type="checkbox"
					className="form-switch-input"
					disabled={switchProps.disabled || isReadOnly}
				/>

				{/* The track and the knob. Decorative: everything a screen reader
				  * needs is on the input behind it. */}
				<span className="form-switch-track" aria-hidden="true">
					<span className="form-switch-knob" />
				</span>
			</span>

			<ReadOnlySubmitValue
				isReadOnly={isReadOnly}
				name={controlProps.name}
				hasValue={nativeProps.checked ?? nativeProps.defaultChecked}
			/>
		</FormField>
	)
}

export default Switch
