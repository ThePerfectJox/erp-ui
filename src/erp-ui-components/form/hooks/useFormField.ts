/**
 * The one hook every control in this folder starts with.
 */

import { useId } from 'react'
import type {
	FieldBaseProps,
	FormControlProps,
	FormFieldChromeProps,
	FormGroupProps,
} from '../core/types'

export interface UseFormFieldResult {
	/** Spread onto `<FormField>`. */
	fieldProps: FormFieldChromeProps
	/** Spread onto the native control. */
	controlProps: FormControlProps
	/** Spread onto the `<fieldset>` of a grouped control instead. */
	groupProps: FormGroupProps
	/** The control's DOM id, for the rare case a component needs it directly. */
	controlId: string
	/** True when the value state is `"error"`. */
	isInvalid: boolean
}

/**
 * Turns the shared field props into the three things a control actually needs:
 * a unique id, the ARIA attributes that tie the control to its label, hint and
 * message, and the flags that drive the styling.
 *
 * Every control in this folder starts with this hook, which is why they all
 * behave identically and why none of them can be wired up wrongly:
 *
 * ```tsx
 * function TextInput({ value, onChange, ...field }: TextInputProps) {
 *     const { fieldProps, controlProps } = useFormField(field)
 *
 *     return (
 *         <FormField {...fieldProps}>
 *             <input {...controlProps} className="form-control" value={value} onChange={onChange} />
 *         </FormField>
 *     )
 * }
 * ```
 *
 * Three details worth knowing:
 *
 * - `aria-describedby` points at the hint and the message *only when they are
 *   rendered*. Pointing at an element that is not in the DOM makes some
 *   screen readers announce nothing at all, which is worse than staying quiet.
 * - `aria-invalid` is set for `"error"` and nothing else. Warning, success and
 *   information are not invalid — a field can be perfectly valid and still
 *   worth commenting on, and marking those as invalid would cry wolf.
 * - `controlProps.readOnly` is emitted unconditionally, which is correct for a
 *   text input and a textarea and wrong for everything else. Controls that have
 *   no native `readOnly` run it through `extractReadOnly` from `../core`; the
 *   reasoning is documented there.
 */
export function useFormField(props: FieldBaseProps): UseFormFieldResult {
	/* React generates this once per mounted component, so two instances of the
	 * same field on one screen still get distinct ids and their labels still
	 * point at the right control. */
	const generatedId = useId()
	const controlId = props.id ?? generatedId
	const hintId = `${controlId}-hint`
	const messageId = `${controlId}-message`

	const isInvalid = props.valueState === 'error'
	const hasHint = Boolean(props.hint)
	const hasMessage = Boolean(props.valueState && props.valueStateMessage)

	/* Order matters: the hint describes the field, the message reacts to what
	 * was typed into it, so the hint is announced first. */
	const describedByIds: string[] = []

	if (hasHint) {
		describedByIds.push(hintId)
	}

	if (hasMessage) {
		describedByIds.push(messageId)
	}

	const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined

	return {
		controlId,
		isInvalid,

		fieldProps: {
			controlId,
			label: props.label,
			hint: props.hint,
			hintId,
			valueState: props.valueState,
			valueStateMessage: props.valueStateMessage,
			messageId,
			isRequired: props.isRequired,
			isDisabled: props.isDisabled,
			isReadOnly: props.isReadOnly,
			isLabelHidden: props.isLabelHidden,
			labelPlacement: props.labelPlacement,
			className: props.className,
		},

		controlProps: {
			id: controlId,
			name: props.name,
			required: Boolean(props.isRequired),
			disabled: Boolean(props.isDisabled),
			readOnly: Boolean(props.isReadOnly),
			'aria-invalid': isInvalid ? true : undefined,
			'aria-describedby': describedBy,
		},

		groupProps: {
			'aria-required': props.isRequired ? true : undefined,
			'aria-invalid': isInvalid ? true : undefined,
			'aria-describedby': describedBy,
		},
	}
}
