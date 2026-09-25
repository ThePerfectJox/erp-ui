import FormControlShell from './FormControlShell'
import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldAdornment, FieldBaseProps, PassthroughInputProps } from './FieldTypes'

/**
 * The single-line text types. Each one changes the on-screen keyboard on a
 * tablet and what the browser offers to autofill, so picking the right one is
 * worth the two seconds it takes — `"email"` and `"tel"` in particular.
 *
 * Numbers are not here on purpose: use `<NumberInput>`, which aligns the digits
 * and handles units.
 */
export type TextInputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search'

interface TextInputProps extends FieldBaseProps, PassthroughInputProps {
	/** Defaults to `"text"`. */
	type?: TextInputType

	/** Fixed text inside the field, before the value. */
	prefix?: FieldAdornment

	/** Fixed text inside the field, after the value. */
	suffix?: FieldAdornment
}

/**
 * Single-line text entry.
 *
 * ```tsx
 * <TextInput
 *     label="Supplier"
 *     value={supplier}
 *     onChange={event => setSupplier(event.target.value)}
 *     isRequired
 * />
 *
 * <TextInput
 *     label="Contact email"
 *     type="email"
 *     value={email}
 *     onChange={event => setEmail(event.target.value)}
 *     valueState="error"
 *     valueStateMessage="Enter an address in the form name@company.com"
 * />
 * ```
 *
 * Anything a native `<input>` accepts passes straight through — `placeholder`,
 * `maxLength`, `autoComplete`, `onBlur`. The handful this component owns (`id`,
 * `name`, `required`, `disabled`, `readOnly` and the ARIA wiring) are taken off
 * the type, because setting them here would break the tie between the input and
 * its label.
 *
 * A note on `placeholder`: it is not a label and it is gone the moment someone
 * types. Put the requirement in `hint`, where it stays.
 */
function TextInput({ type = 'text', prefix, suffix, ...props }: TextInputProps) {
	const [field, nativeProps] = splitFieldProps(props)
	const { fieldProps, controlProps } = useFormField(field)

	return (
		<FormField {...fieldProps}>
			<FormControlShell prefix={prefix} suffix={suffix}>
				<input {...nativeProps} {...controlProps} type={type} className="form-control" />
			</FormControlShell>
		</FormField>
	)
}

export default TextInput
